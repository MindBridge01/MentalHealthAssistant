import { Link, useLocation } from "react-router-dom";
import PageHeader from "../../components/patient/PageHeader";

export default function BookingConfirmationPage() {
  const location = useLocation();
  const appointment = location.state?.appointment;
  const doctorName = location.state?.doctorName || "your doctor";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Booking confirmed"
        title="Your appointment is all set"
        description="You can return to your appointments list anytime to review the details."
      />

      <div className="rounded-[40px] border border-white/70 bg-[linear-gradient(180deg,#def4ee_0%,#ffffff_100%)] p-8 shadow-soft">
        <p className="text-sm leading-7 text-[var(--color-text-muted)]">
          You booked with <span className="font-semibold text-[var(--color-text)]">{doctorName}</span>.
        </p>
        {appointment ? (
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
            Appointment time: <span className="font-semibold text-[var(--color-text)]">{appointment.date} · {appointment.time}</span>
          </p>
        ) : null}
        <p className="mt-5 text-sm leading-7 text-[var(--color-text-muted)]">
          If you need to prepare, it can help to jot down what support you want most from the conversation.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/patient/appointments" className="primary-button">
            View appointments
          </Link>
          <Link
            to="/patient/dashboard"
            className="rounded-2xl border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text)]"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
