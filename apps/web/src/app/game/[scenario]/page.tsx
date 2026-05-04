"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import dynamic from "next/dynamic";
import GameClient from "@/components/game-client";
import GameOverlay from "@/components/game-overlay";
import { useChallenge, useEndSession, useUserBestScore } from "@/hooks/use-api";
import { toast } from "sonner";

const FreeplayMenu = dynamic(() => import("@/components/freeplay-menu").then((mod) => mod.FreeplayMenu), { ssr: false });

const toScenarioTitle = (id: string): string =>
  id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Scenario";

const EMPTY_CONFIG = {};

export default function GamePage() {
  const router = useRouter();
  const params = useParams<{ scenario: string }>();
  const [isPaused, setIsPaused] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [showTutorialComplete, setShowTutorialComplete] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [freeplayConfig, setFreeplayConfig] = useState({ numBalls: 1, size: 1.5, boundary: 20 });

  const callbacksRef = useRef({
    scenarioId: "",
    isChallenge: false,
    challengeDbId: 0 as number | undefined,
    scenarioTitle: "",
    isSubmitting: false,
    dispatchEscapeToGame: null as (() => void) | null,
    startCountdown: null as ((onDone: () => void) => void) | null,
    endSession: null as ((modeState: any) => void) | null,
  });

  const countdownTimerRef = useRef<number | null>(null);
  const bootPauseAppliedRef = useRef(false);
  const modeStateRef = useRef<any>(null);
  const sessionStartedRef = useRef(false);
  const sessionEndedRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Scenario slug ──────────────────────────────────────────────
  const scenarioId = useMemo(
    () => (typeof params?.scenario === "string" ? params.scenario : "scenario"),
    [params]
  );

  const isChallenge = scenarioId !== "tutorial" && scenarioId !== "freeplay";

  // ── Fetch challenge from API ───────────────────────────────────
  const { data: challenge, isError: isChallengeError, refetch: refetchChallenge } = useChallenge(isChallenge ? scenarioId : "");

  const scenarioTitle = challenge?.title ?? toScenarioTitle(scenarioId);
  const scenarioDescription = challenge?.description ?? "Push your score and accuracy in this challenge.";
  const challengeConfig = useMemo(() => challenge?.config ?? EMPTY_CONFIG, [challenge?.config]);
  const challengeDbId = challenge?.id;

  // ── Challenge session mutations ────────────────────────────────
  const endSessionMutation = useEndSession();




  const { data: bestScoreData } = useUserBestScore(challengeDbId ?? 0, !!challengeDbId);
  const bestScore = bestScoreData?.score ?? null;

  // ── Dark mode sync ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    setDarkMode(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // ── Helpers ────────────────────────────────────────────────────
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
      setIsPaused(true);
      setCountdownValue(3);
      const tick = (value: number) => {
        if (value <= 0) {
          countdownTimerRef.current = window.setTimeout(() => {
            setCountdownValue(null);
            setIsPaused(false);
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



  // ── End session + route to results ─────────────────────────────
  const endSession = useCallback(
    (modeState: any) => {
      const { scenarioId, isChallenge, challengeDbId, scenarioTitle } = callbacksRef.current;
      if (!isChallenge || sessionEndedRef.current) return;

      const finalScore = Math.max(0, Math.floor(Number(modeState?.score ?? 0)));

      setIsSubmitting(true);
      sessionEndedRef.current = true;

      endSessionMutation.mutate({ 
        score: finalScore, 
        shots: modeState?.shots ?? 0, 
        kills: modeState?.kills ?? 0 
      }, {
        onSuccess: () => {
          if (challengeDbId) {
            sessionStorage.setItem("pendingChallengeResult", JSON.stringify({
              challengeId: challengeDbId,
              slug: scenarioId,
              score: finalScore,
              modeState: { ...modeState, isChallenge: true },
              title: scenarioTitle
            }));
          }
          router.push("/play/challenge");
        },
        onError: () => {
          toast.error("Failed to submit score", {
            description: "We'll try to show your results anyway, but the score might not be saved.",
          });
          // Still redirect so they see the result modal
          if (challengeDbId) {
            sessionStorage.setItem("pendingChallengeResult", JSON.stringify({
              challengeId: challengeDbId,
              slug: scenarioId,
              score: finalScore,
              modeState: { ...modeState, isChallenge: true },
              title: scenarioTitle,
              error: true
            }));
          }
          router.push("/play/challenge");
        }
      });
    },
    [router, endSessionMutation]
  );

  // ── Mode state handler from the game engine ───────────────────
  const onModeStateChange = useCallback(
    (state: any) => {
      modeStateRef.current = state;
      const { scenarioId, isChallenge, dispatchEscapeToGame, startCountdown, endSession } = callbacksRef.current;

      // First state event — boot the countdown and start the API session
      if (!bootPauseAppliedRef.current) {
        bootPauseAppliedRef.current = true;

        if (scenarioId === "tutorial") {
          setIsPaused(false);
        } else {
          setIsPaused(true);
          dispatchEscapeToGame?.();
          startCountdown?.(() => {
            dispatchEscapeToGame?.();
            setIsPaused(false);
          });
        }
      }

      // Challenge completed
      if (isChallenge && state?.completed && !sessionEndedRef.current) {
        endSession?.(state);
      }
    },
    [] // Truly stable callback now
  );

  // ── Sync refs for stable callbacks ───────────────────────────
  useEffect(() => {
    callbacksRef.current = {
      scenarioId,
      isChallenge,
      challengeDbId,
      scenarioTitle,
      isSubmitting,
      dispatchEscapeToGame,
      startCountdown,
      endSession,
    };
  }, [scenarioId, isChallenge, challengeDbId, scenarioTitle, isSubmitting, dispatchEscapeToGame, startCountdown, endSession]);

  // ── Keyboard shortcuts ─────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (scenarioId === "tutorial") return;

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
      if (countdownValue !== null) return;

      if (!isPaused) {
        dispatchEscapeToGame();
        setIsPaused(true);
        return;
      }

      startCountdown(() => {
        dispatchEscapeToGame();
      });
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [clearCountdownTimer, countdownValue, dispatchEscapeToGame, isPaused, scenarioId, startCountdown]);

  // ── Tutorial events ────────────────────────────────────────────
  useEffect(() => {
    const onTutorialComplete = () => {
      setShowTutorialComplete(true);
      setTimeout(() => router.push("/"), 2000);
    };
    window.addEventListener("tutorial-complete", onTutorialComplete);
    return () => window.removeEventListener("tutorial-complete", onTutorialComplete);
  }, [router]);

  useEffect(() => {
    const onTutorialComplete = () => {
      window.dispatchEvent(new CustomEvent("rldart:restart"));
      setIsPaused(true);
      dispatchEscapeToGame();
      startCountdown(() => dispatchEscapeToGame());
    };
    window.addEventListener("rldart:tutorial-complete", onTutorialComplete);
    return () => window.removeEventListener("rldart:tutorial-complete", onTutorialComplete);
  }, [dispatchEscapeToGame, startCountdown]);

  useEffect(() => () => clearCountdownTimer(), [clearCountdownTimer]);

  // ── Actions ────────────────────────────────────────────────────
  const resumeGame = () => {
    if (!isPaused || countdownValue !== null) return;
    startCountdown(() => dispatchEscapeToGame());
  };

  const restartGame = () => {
    sessionStartedRef.current = false;
    sessionEndedRef.current = false;
    window.dispatchEvent(new CustomEvent("rldart:restart"));
    dispatchEscapeToGame();
    startCountdown(() => {
      dispatchEscapeToGame();
    });
  };

  const combinedChallengeConfig = useMemo(
    () => ({ ...challengeConfig, id: scenarioId, bestScore }),
    [challengeConfig, scenarioId, bestScore]
  );

  return (
    <section className="fixed inset-0 overflow-hidden bg-background">
      {(!isChallenge || challenge) && (
        <GameClient
          fullscreen
          onModeStateChange={onModeStateChange}
          challengeConfig={scenarioId === "freeplay" ? freeplayConfig : combinedChallengeConfig}
          darkMode={darkMode}
          modeName={
            scenarioId === "tutorial" ? "Tutorial" : scenarioId === "freeplay" ? "Freeplay" : "Challenge"
          }
        />
      )}

      {scenarioId === "freeplay" && (
        <FreeplayMenu config={freeplayConfig} onChange={setFreeplayConfig} />
      )}

      {scenarioId === "tutorial" && !showTutorialComplete && (
        <div className="absolute bottom-12 right-12 z-20000">
          <button
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold uppercase tracking-wider rounded-xl backdrop-blur-md transition-all active:scale-95"
            onClick={() => router.push("/")}
          >
            Skip Tutorial
          </button>
        </div>
      )}

      {showTutorialComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30000 backdrop-blur-sm animate-in fade-in duration-500">
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
          onOpenSettings={() => {}}
          onExit={() => router.push("/")}
        />
      )}

      {/* Full-page error overlay if challenge data failed to load */}
      {isChallenge && isChallengeError && (
        <div className="absolute inset-0 z-50000 flex items-center justify-center bg-background/95 backdrop-blur-md">
          <div className="text-center space-y-4 max-w-md p-8">
            <h2 className="text-2xl font-bold text-destructive">Failed to Load Challenge</h2>
            <p className="text-sm text-muted-foreground">
              Could not fetch challenge data from the server. This may be a network issue.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => refetchChallenge()}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => router.push("/play/challenge")}
                className="px-4 py-2 text-sm font-medium rounded-lg border bg-background hover:bg-muted transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Submitting Overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 z-60000 flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
            </div>
            <p className="text-lg font-medium text-primary animate-pulse">Submitting your score...</p>
          </div>
        </div>
      )}
    </section>
  );
}
