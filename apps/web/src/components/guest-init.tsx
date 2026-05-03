"use client";

import { useEffect } from "react";
import { useMe, useCreateGuestUser } from "@/hooks/use-api";

/**
 * Invisible component — mounts once on app load.
 * If no guest user exists yet, silently creates one.
 */
export function GuestInit() {
  const { data: user, isLoading } = useMe();
  const { mutate: createGuest, isPending } = useCreateGuestUser();

  useEffect(() => {
    // Wait for the user check to complete before acting
    if (isLoading || isPending) return;
    // If no user found, create a guest account automatically
    if (user === null) {
      createGuest();
    }
  }, [isLoading, isPending, user, createGuest]);

  return null; // renders nothing
}
