import { useState } from "react";
import { triggerSos } from "../../services/patientService";

export default function SosDialog({ open, onClose }) {
  const [phase, setPhase] = useState("idle");
  const [message, setMessage] = useState("");

  if (!open) return null;

  async function handleConfirm() {
    setPhase("loading");
    setMessage("");
    try {
      const response = await triggerSos();
      setPhase("success");
      setMessage(response.message || "Help is on the way. Your guardian has been notified.");
    } catch (error) {
      setPhase("error");
      setMessage(error.message);
    }
  }

  function handleClose() {
    if (phase !== "loading") {
      setPhase("idle");
      setMessage("");
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(18,24,23,0.48)] p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[36px] border border-white/60 bg-[linear-gradient(180deg,#fff8f6_0%,#ffffff_100%)] p-8 shadow-[0_24px_100px_rgba(40,24,21,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-danger)]">
              Emergency support
            </p>
            <h3 className="mt-2 font-display text-3xl font-semibold text-[var(--color-text)]">
              Are you sure you want to trigger SOS?
            </h3>
          </div>
          <button type="button" onClick={handleClose} className="rounded-2xl bg-white p-3 text-[var(--color-text-muted)]">
            <span className="material-icons">close</span>
          </button>
        </div>

        <p className="mt-4 text-sm leading-7 text-[var(--color-text-muted)]">
          This sends an emergency alert to your saved guardian contact. If you are in immediate danger, please contact local emergency services too.
        </p>

        {message ? (
          <div
            className={[
              "mt-5 rounded-2xl px-4 py-3 text-sm",
              phase === "success"
                ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
            ].join(" ")}
          >
            {message}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-2xl border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={phase === "loading"}
            className="rounded-2xl bg-[var(--color-danger)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {phase === "loading" ? "Sending alert..." : "Yes, send SOS"}
          </button>
        </div>
      </div>
    </div>
  );
}
