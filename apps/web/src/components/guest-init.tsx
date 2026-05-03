"use client";

import { useEffect, useRef } from "react";
import { useMe, useCreateGuestUser } from "@/hooks/use-api";

const MAX_CREATE_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Invisible component — mounts once on app load.
 * If no guest user exists yet, silently creates one with retry logic.
 */
export function GuestInit() {
  const { data: user, isLoading, isError: isMeError } = useMe();
  const { mutate: createGuest, isPending, isError: isCreateError, reset } = useCreateGuestUser();
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Wait for the user check to complete before acting
    if (isLoading || isPending) return;

    // If no user found, create a guest account automatically
    if (user === null && !isCreateError) {
      createGuest();
    }
  }, [isLoading, isPending, user, createGuest, isCreateError]);

  // Retry guest creation on failure with backoff
  useEffect(() => {
    if (!isCreateError) {
      retryCountRef.current = 0;
      return;
    }

    if (retryCountRef.current >= MAX_CREATE_RETRIES) {
      // Exhausted all retries — stop trying silently
      return;
    }

    retryTimerRef.current = setTimeout(() => {
      retryCountRef.current += 1;
      reset(); // Clear the error state so the mutation can fire again
      createGuest();
    }, RETRY_DELAY_MS * Math.pow(2, retryCountRef.current));

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [isCreateError, createGuest, reset]);

  return null; // renders nothing
}
