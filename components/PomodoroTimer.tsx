/* components/PomodoroTimer.tsx */
"use client";

import { useState } from "react";
import { useFocusTimer } from "@/hooks/useFocusTimer";
import { useTasks } from "@/hooks/useTasks";

const PRESETS = [15, 25, 30, 45, 60] as const;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PomodoroTimer({ taskId }: { taskId: string }) {
  const { settings, updateSettings } = useTasks();
  const { remainingSeconds, isRunning, isPaused, start, pause, resume, reset } =
    useFocusTimer(taskId);

  const [showPresets, setShowPresets] = useState(false);

  const totalSeconds = settings.pomodoroMinutes * 60;
  const progress =
    isRunning || isPaused
      ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100
      : 0;

  return (
    <div className="mt-3">
      {/* Progress bar */}
      {(isRunning || isPaused) && (
        <div
          className="w-full h-2 rounded-full overflow-hidden mb-3"
          style={{ background: "rgb(var(--border))" }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="タイマー進捗"
        >
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${progress}%`,
              background: "rgb(var(--primary))",
            }}
          />
        </div>
      )}

      {/* Timer display */}
      <div className="flex items-center gap-3 flex-wrap">
        {isRunning || isPaused ? (
          <span className="text-2xl font-mono font-bold tabular-nums" aria-live="polite" aria-atomic="true">
            {formatTime(remainingSeconds)}
          </span>
        ) : (
          <span className="text-sm muted">{settings.pomodoroMinutes}分タイマー</span>
        )}

        {/* Controls */}
        {!isRunning && !isPaused && (
          <button
            onClick={() => start(settings.pomodoroMinutes)}
            className="btn-primary px-3 py-1.5 text-xs"
            aria-label="タイマー開始"
          >
            開始
          </button>
        )}
        {isRunning && !isPaused && (
          <button
            onClick={pause}
            className="btn-outline px-3 py-1.5 text-xs"
            aria-label="タイマー一時停止"
          >
            一時停止
          </button>
        )}
        {isPaused && (
          <>
            <button
              onClick={resume}
              className="btn-primary px-3 py-1.5 text-xs"
              aria-label="タイマー再開"
            >
              再開
            </button>
            <button
              onClick={reset}
              className="btn-outline px-3 py-1.5 text-xs"
              aria-label="タイマーリセット"
            >
              リセット
            </button>
          </>
        )}
        {isRunning && !isPaused && (
          <button
            onClick={reset}
            className="btn-outline px-3 py-1.5 text-xs"
            aria-label="タイマーリセット"
          >
            リセット
          </button>
        )}

        {/* Preset picker */}
        <div className="relative">
          <button
            onClick={() => setShowPresets((v) => !v)}
            className="btn-outline px-2 py-1.5 text-xs"
            aria-label="タイマー時間変更"
            aria-expanded={showPresets}
          >
            ⏱
          </button>
          {showPresets && (
            <div className="absolute top-full left-0 mt-1 z-10 card p-2 flex flex-col gap-1 min-w-[80px]">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    updateSettings({ pomodoroMinutes: m });
                    setShowPresets(false);
                    if (!isRunning && !isPaused) {
                      // just update setting, don't auto-start
                    }
                  }}
                  className={`text-xs px-2 py-1 rounded-lg text-left ${
                    settings.pomodoroMinutes === m
                      ? "font-bold"
                      : "muted"
                  }`}
                >
                  {m}分
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
