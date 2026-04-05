export default function SlotPicker({ slots, selectedSlotId, onSelect }) {
  if (!slots.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)]">
        No slots are available right now. Please check back soon or pick another doctor.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {slots.map((slot) => {
        const isSelected = selectedSlotId === slot._id;
        return (
          <button
            key={slot._id}
            type="button"
            onClick={() => onSelect(slot)}
            className={[
              "rounded-[24px] border px-5 py-4 text-left transition",
              isSelected
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-soft"
                : "border-white/70 bg-white/80 hover:border-[var(--color-primary-soft-strong)]",
            ].join(" ")}
          >
            <p className="font-semibold text-[var(--color-text)]">
              {slot.date} · {slot.startTime} - {slot.endTime}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Choose this time if it feels comfortable and realistic for you.
            </p>
          </button>
        );
      })}
    </div>
  );
}
