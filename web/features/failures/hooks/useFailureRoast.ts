"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFailureRoast } from "@/lib/api";
import type { FailurePayload } from "@/types/domain";

export function useFailureRoast(payload: FailurePayload) {
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const play = useCallback(async () => {
    try {
      setError(null);
      setStatus("loading");
      cleanup();

      const blob = await fetchFailureRoast(payload);
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;

      const audio = new Audio(objectUrl);
      audioRef.current = audio;
      audio.onended = () => setStatus("idle");
      await audio.play();
      setStatus("playing");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown roast playback error");
    }
  }, [cleanup, payload]);

  return {
    status,
    error,
    play
  };
}
