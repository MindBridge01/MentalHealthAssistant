import { useEffect, useState } from "react";

export default function ActivityTimer({ durationMinutes = 4 }) {
  const totalSeconds = durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return undefined;

    const interval = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
        Guided timer
      </p>
      <div className="mt-6 flex flex-col items-center">
        <div
          className="relative flex h-52 w-52 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(var(--color-primary) ${progress}%, rgba(218, 232, 229, 0.7) ${progress}% 100%)`,
          }}
        >
          <div className="flex h-[calc(100%-18px)] w-[calc(100%-18px)] items-center justify-center rounded-full bg-[var(--color-surface-elevated)] shadow-inner-soft">
            <div className="text-center">
              <p className="font-display text-5xl font-semibold text-[var(--color-text)]">
                {minutes}:{seconds}
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {secondsLeft === 0 ? "Complete" : isRunning ? "Keep breathing gently" : "Ready when you are"}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsRunning((value) => !value)}
            className="rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white"
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(totalSeconds);
            }}
            className="rounded-2xl border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text)]"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
