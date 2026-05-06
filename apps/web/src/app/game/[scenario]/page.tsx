"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import dynamic from "next/dynamic";
import GameClient from "@/components/game-client";
import GameOverlay from "@/components/game-overlay";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { useChallenge, useEndSession, useUserBestScore, useMe, useCreateGuestUser, useStartSession } from "@/hooks/use-api";
import { toast } from "sonner";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const { data: user, isLoading: isUserLoading } = useMe();
  const createGuestUser = useCreateGuestUser();
  const startSessionMutation = useStartSession();
  const initAttemptedRef = useRef(false);

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




  const { data: bestScoreData } = useUserBestScore(challengeDbId ?? 0, !!challengeDbId && !isInitializing);
  const bestScore = bestScoreData?.score ?? null;

  // ── Initialization Flow ────────────────────────────────────────
  useEffect(() => {
    async function initialize() {
      // Skip if already attempted or if we're not in a challenge
      if (initAttemptedRef.current) return;
      
      // Wait for basic user/challenge query states to settle
      if (isUserLoading || (isChallenge && !challenge && !isChallengeError)) return;

      initAttemptedRef.current = true;
      
      try {
        // 1. Ensure User Exists
        if (!user) {
          try {
            await createGuestUser.mutateAsync();
          } catch (err) {
            console.error("Failed to create guest user", err);
            setInitError("Could not create player account. Please try again.");
            return;
          }
        }

        // 2. Start Session for Challenges
        if (isChallenge) {
          if (isChallengeError || !challenge) {
            setInitError("Challenge not found or server is offline.");
            return;
          }

          try {
            await startSessionMutation.mutateAsync(challenge.id);
            sessionStartedRef.current = true;
          } catch (err) {
            console.error("Failed to start session", err);
            setInitError("Could not start training session.");
            return;
          }
        }

        // Success!
        setIsInitializing(false);
      } catch (err) {
        setInitError("An unexpected error occurred during initialization.");
      }
    }

    initialize();
  }, [isChallenge, challenge, isChallengeError, user, isUserLoading, createGuestUser, startSessionMutation]);

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
      {/* Loading Phase */}
      {isInitializing && (
        <div className="absolute inset-0 z-100 flex flex-col items-center justify-center bg-background">
          <div className="absolute inset-0 overflow-hidden opacity-20">
             <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/30 blur-[120px] animate-pulse" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative flex flex-col items-center gap-12 max-w-sm w-full px-8">
            {/* Logo/Icon Area */}
            <div className="relative size-32">
              <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
              <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
              <div className="absolute inset-4 rounded-full border-2 border-primary/5 animate-reverse-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Trophy className="size-10 text-primary animate-pulse" />
              </div>
            </div>

            {/* Text Area */}
            <div className="flex flex-col items-center text-center gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/60">
                  Initializing {isChallenge ? "Challenge" : "Scenario"}
                </p>
                <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase italic">
                  {scenarioTitle}
                </h2>
              </div>
              
              {!initError ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-muted-foreground font-medium animate-pulse">
                    Synchronizing game state...
                  </p>
                  <div className="w-48 h-1 bg-muted/40 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-progress-fast" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <p className="text-sm text-destructive font-bold uppercase tracking-tight">
                    {initError}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-9"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-9"
                      onClick={() => router.push("/play/challenge")}
                    >
                      Go Back
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!isInitializing && (
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
          onOpenSettings={() => setSettingsOpen(true)}
          onExit={() => router.push("/")}
        />
      )}

      <SettingsDialog 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
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
