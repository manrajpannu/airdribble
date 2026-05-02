"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

import dynamic from "next/dynamic";
import GameClient from "@/components/game-client";
import GameOverlay from "@/components/game-overlay";
const FreeplayMenu = dynamic(() => import("@/components/freeplay-menu").then(mod => mod.FreeplayMenu), { ssr: false });
import { SCENARIOS } from "@/lib/scenarios";

const toScenarioTitle = (id: string): string =>
  id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Scenario";

export default function GamePage() {
  const router = useRouter();
  const params = useParams<{ scenario: string }>();
  const [isPaused, setIsPaused] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isTutorial, setIsTutorial] = useState(false);
  const [showTutorialComplete, setShowTutorialComplete] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [freeplayConfig, setFreeplayConfig] = useState({
    numBalls: 1,
    size: 1.5,
    boundary: 20,
  });
  const countdownTimerRef = useRef<number | null>(null);
  const bootPauseAppliedRef = useRef(false);
  const needsTutorialRef = useRef<boolean | null>(null); // null = not checked yet
  const modeStateRef = useRef<any>(null); // Use ref instead of state to prevent 30Hz re-renders
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDarkMode(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const scenarioId = useMemo(
    () => (typeof params?.scenario === "string" ? params.scenario : "scenario"),
    [params]
  );

  const currentScenario = useMemo(
    () => SCENARIOS.find((s) => s.id === scenarioId),
    [scenarioId]
  );

  const scenarioTitle = useMemo(
    () => currentScenario?.title ?? toScenarioTitle(scenarioId),
    [currentScenario, scenarioId]
  );
  const scenarioDescription = useMemo(
    () => currentScenario?.description ?? "Push your score and accuracy in this challenge.",
    [currentScenario]
  );
  const challengeConfig = useMemo(
    () => currentScenario?.config ?? {},
    [currentScenario]
  );

  const bestScoreKey = useMemo(() => `airdribble-best-score:${scenarioId}`, [scenarioId]);

  useEffect(() => {
    const raw = window.localStorage.getItem(bestScoreKey);
    const parsed = raw ? Number(raw) : 0;
    setBestScore(Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0);
  }, [bestScoreKey]);

  const clearCountdownTimer = useCallback(() => {
    if (countdownTimerRef.current !== null) {
      window.clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const dispatchEscapeToGame = useCallback(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape" }));
  }, []);

  const startCountdown = useCallback(
    (onDone: () => void) => {
      clearCountdownTimer();
      setIsPaused(true); // Always enforce pause at countdown start
      setCountdownValue(3);

      const tick = (value: number) => {
        if (value <= 0) {
          countdownTimerRef.current = window.setTimeout(() => {
            setCountdownValue(null);
            setIsPaused(false); // Unpause only after countdown is over
            onDone();
          }, 1000);
          return;
        }

        countdownTimerRef.current = window.setTimeout(() => {
          const next = value - 1;
          setCountdownValue(next);
          tick(next);
        }, 1000);
      };

      tick(3);
    },
    [clearCountdownTimer]
  );

  const onModeStateChange = useCallback(
    (state: any) => {
      modeStateRef.current = state; // Update ref instead of state

      const score = Number(state?.score ?? 0);
      const safeScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
      
      let newBest = 0;
      setBestScore((currentBest) => {
        newBest = Math.max(safeScore, currentBest);
        if (safeScore <= currentBest) return currentBest;
        window.localStorage.setItem(bestScoreKey, String(safeScore));
        return safeScore;
      });

      if (!bootPauseAppliedRef.current) {
        bootPauseAppliedRef.current = true;
        
        if (scenarioId === "tutorial") {
          // No countdown for tutorial
          setIsPaused(false);
        } else {
          setIsPaused(true);
          dispatchEscapeToGame();
          startCountdown(() => {
            dispatchEscapeToGame();
            setIsPaused(false);
          });
        }
      } else if (state?.completed && !hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        
        // Mock saving to a database
        const resultId = crypto.randomUUID();
        const mockResultData = {
          score: safeScore,
          bestScore: newBest,
          scenarioId: scenarioId,
          title: scenarioTitle,
        };
        window.localStorage.setItem(`mock_result_${resultId}`, JSON.stringify(mockResultData));

        router.push(`/play/challenge?resultId=${resultId}`);
      }
    },
    [bestScoreKey, dispatchEscapeToGame, startCountdown, scenarioId, router, scenarioTitle]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // During tutorial, don't allow restart or pause
      if (isTutorial) return;

      if (event.key.toLowerCase() === "r" && event.isTrusted) {
        event.preventDefault();
        event.stopImmediatePropagation();

        window.dispatchEvent(new CustomEvent("rldart:restart"));
        setIsPaused(false);
        setCountdownValue(null);
        clearCountdownTimer();
        return;
      }

      if (event.code !== "Escape" || !event.isTrusted) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      // Prevent toggling pause/unpause during countdown
      if (countdownValue !== null) return;

      if (!isPaused) {
        dispatchEscapeToGame();
        setIsPaused(true);
        return;
      }

      // Only allow unpausing if not in countdown
      startCountdown(() => {
        dispatchEscapeToGame();
        // setIsPaused(false); // Now handled in startCountdown
      });
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [clearCountdownTimer, countdownValue, dispatchEscapeToGame, isPaused, isTutorial, startCountdown]);

  useEffect(() => {
    const onTutorialComplete = () => {
      setShowTutorialComplete(true);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    };
    window.addEventListener("tutorial-complete", onTutorialComplete);
    return () => window.removeEventListener("tutorial-complete", onTutorialComplete);
  }, [router]);

  useEffect(
    () => () => {
      clearCountdownTimer();
    },
    [clearCountdownTimer]
  );

  // Listen for tutorial completion and transition to the real scenario
  useEffect(() => {
    const onTutorialComplete = () => {
      setIsTutorial(false);
      needsTutorialRef.current = false;

      // Restart the engine (which reloads the default ChallengeMode)
      window.dispatchEvent(new CustomEvent("rldart:restart"));

      // Now run the normal pause + countdown flow
      setIsPaused(true);
      dispatchEscapeToGame();
      startCountdown(() => {
        dispatchEscapeToGame();
      });
    };

    window.addEventListener("rldart:tutorial-complete", onTutorialComplete);
    return () =>
      window.removeEventListener("rldart:tutorial-complete", onTutorialComplete);
  }, [dispatchEscapeToGame, startCountdown]);

  const resumeGame = () => {
    if (!isPaused || countdownValue !== null) return;
    startCountdown(() => {
      dispatchEscapeToGame();
      // setIsPaused(false); // Now handled in startCountdown
    });
  };

  const restartGame = () => {
    window.dispatchEvent(new CustomEvent("rldart:restart"));
    dispatchEscapeToGame();
    startCountdown(() => {
      dispatchEscapeToGame();
    });
  };

  const openSettings = () => {
    // Placeholder button for future settings panel.
  };

  const exitGame = () => {
    router.push("/");
  };

  const combinedChallengeConfig = useMemo(
    () => ({ ...challengeConfig, id: scenarioId }),
    [challengeConfig, scenarioId]
  );

  return (
    <section className="fixed inset-0 overflow-hidden bg-background">
      <GameClient
        fullscreen
        onModeStateChange={onModeStateChange}
        challengeConfig={scenarioId === "freeplay" ? freeplayConfig : combinedChallengeConfig}
        darkMode={darkMode}
        modeName={scenarioId === "tutorial" ? "Tutorial" : scenarioId === "freeplay" ? "Freeplay" : "Challenge"}
      />

      {scenarioId === "freeplay" && (
        <FreeplayMenu config={freeplayConfig} onChange={setFreeplayConfig} />
      )}

      {scenarioId === "tutorial" && !showTutorialComplete && (
        <div className="absolute bottom-12 right-12 z-[20000]">
          <button 
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold uppercase tracking-wider rounded-xl backdrop-blur-md transition-all active:scale-95"
            onClick={() => router.push("/")}
          >
            Skip Tutorial
          </button>
        </div>
      )}

      {showTutorialComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[30000] backdrop-blur-sm animate-in fade-in duration-500">
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-widest animate-in zoom-in-150 duration-700 ease-out fill-mode-forwards">
            Tutorial Complete
          </h1>
        </div>
      )}

      {scenarioId !== "tutorial" && (
        <GameOverlay
          isPaused={isPaused}
          countdownValue={countdownValue}
          scenarioTitle={scenarioTitle}
          scenarioDescription={scenarioDescription}
          bestScore={bestScore}
          onResume={resumeGame}
          onRestart={restartGame}
          onOpenSettings={openSettings}
          onExit={exitGame}
        />
      )}

      {/* <div className="pointer-events-none absolute left-5 top-5 z-20 border-2 border-border bg-card px-3 py-2 text-xs uppercase tracking-[0.2em] text-foreground shadow-[var(--shadow-xs)]">
        {scenarioId.replace(/-/g, " ")}
      </div> */}

      {/*
      <ChallengeResultsDialog
        open={resultsOpen}
        challengeName={scenarioId.replace(/-/g, " ")}
        modeState={modeStateRef.current}
        highScore={highScore}
        scoreHistory={historyRef.current}
        onDone={handleDone}
        onReplay={handleReplay}
        onOpenStats={handleOpenStats}
      />
      */}
    </section>
  );
}
