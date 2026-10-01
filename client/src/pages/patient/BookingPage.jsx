import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/patient/PageHeader";
import SlotPicker from "../../components/patient/SlotPicker";
import { useAuth } from "../../context/AuthContext";
import { bookAppointment } from "../../services/appointmentService";
import { getDoctors } from "../../services/doctorService";

export default function BookingPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    getDoctors()
      .then((response) => setDoctor(response.find((entry) => entry.userId === doctorId) || null))
      .catch((loadError) => setError(loadError.message));
  }, [doctorId]);

  const groupedSlots = useMemo(() => doctor?.slots || [], [doctor]);

  async function handleBooking() {
    if (!selectedSlot) {
      setError("Please choose a slot before continuing.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await bookAppointment(doctorId, {
        patientId: user?._id,
        patientName: user?.name,
        patientEmail: user?.email,
        slotDate: selectedSlot.date,
        slotTime: `${selectedSlot.startTime} - ${selectedSlot.endTime}`,
        slotId: selectedSlot._id,
        notes,
      });

      navigate("/patient/booking/confirmed", {
        state: {
          appointment: response.appointment,
          doctorName: doctor?.name,
        },
      });
    } catch (submitError) {
      setError(submitError.message || "That slot may no longer be available.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Booking"
        title={`Book with ${doctor?.name || "your selected doctor"}`}
        description="Choose a time that feels realistic and add an optional note so your appointment starts with more context."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <section className="rounded-[36px] border border-white/70 bg-white/85 p-8 shadow-soft">
          <SlotPicker
            slots={groupedSlots}
            selectedSlotId={selectedSlot?._id}
            onSelect={setSelectedSlot}
          />
        </section>

        <aside className="rounded-[36px] border border-white/70 bg-white/85 p-8 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
            Optional note
          </p>
          <textarea
            rows="6"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-4 w-full rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
            placeholder="You can share what you'd like support with, but only if that feels helpful."
          />

          {selectedSlot ? (
            <div className="mt-5 rounded-[24px] bg-[var(--color-surface)] p-4">
              <p className="font-semibold text-[var(--color-text)]">Selected slot</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {selectedSlot.date} · {selectedSlot.startTime} - {selectedSlot.endTime}
              </p>
            </div>
          ) : null}

          {error ? <p className="mt-5 rounded-2xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{error}</p> : null}

          <button type="button" onClick={handleBooking} disabled={isSubmitting} className="primary-button mt-6 w-full">
            {isSubmitting ? "Confirming..." : "Confirm booking"}
          </button>
        </aside>
      </div>
    </div>
  );
}
