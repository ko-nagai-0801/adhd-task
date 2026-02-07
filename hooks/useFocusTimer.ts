/* hooks/useFocusTimer.ts */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TimerState = {
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
};

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // Audio not available — silent fallback
  }
}

export function useFocusTimer(taskId: string | undefined) {
  const [state, setState] = useState<TimerState>({
    remainingSeconds: 0,
    isRunning: false,
    isPaused: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const taskIdRef = useRef(taskId);

  // Reset when taskId changes
  useEffect(() => {
    if (taskIdRef.current !== taskId) {
      taskIdRef.current = taskId;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setState({ remainingSeconds: 0, isRunning: false, isPaused: false });
    }
  }, [taskId]);

  // Countdown effect
  useEffect(() => {
    if (!state.isRunning || state.isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.remainingSeconds <= 1) {
          playBeep();
          return { remainingSeconds: 0, isRunning: false, isPaused: false };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isRunning, state.isPaused]);

  const start = useCallback((minutes: number) => {
    setState({
      remainingSeconds: minutes * 60,
      isRunning: true,
      isPaused: false,
    });
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState({ remainingSeconds: 0, isRunning: false, isPaused: false });
  }, []);

  return { ...state, start, pause, resume, reset };
}
