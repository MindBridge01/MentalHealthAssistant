export default function StepProgress({ steps, currentStep }) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--color-text)]">
          Step {currentStep + 1} of {steps.length}
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">{steps[currentStep]}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {steps.map((step, index) => {
          const state = index < currentStep ? "done" : index === currentStep ? "active" : "idle";
          return (
            <div key={step} className="space-y-2">
              <div
                className={[
                  "h-2 rounded-full transition",
                  state === "done"
                    ? "bg-[var(--color-primary)]"
                    : state === "active"
                      ? "bg-[var(--color-primary-soft-strong)]"
                      : "bg-[var(--color-border)]",
                ].join(" ")}
              />
              <p
                className={[
                  "text-xs font-medium",
                  state === "idle" ? "text-[var(--color-text-subtle)]" : "text-[var(--color-text)]",
                ].join(" ")}
              >
                {step}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
