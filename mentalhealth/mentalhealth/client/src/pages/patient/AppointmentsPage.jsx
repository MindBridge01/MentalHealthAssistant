import { useEffect, useState } from "react";
import PageHeader from "../../components/patient/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { getPatientAppointments } from "../../services/appointmentService";

export default function AppointmentsPage() {
  const { userId } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;

    getPatientAppointments(userId)
      .then((response) => setAppointments(response.appointments || []))
      .catch((loadError) => setError(loadError.message));
  }, [userId]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Appointments"
        title="Your booked support sessions"
        description="Review upcoming sessions and keep track of the care you have already scheduled."
      />

      {error ? <div className="rounded-2xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{error}</div> : null}

      <div className="space-y-4">
        {appointments.length ? (
          appointments.map((appointment) => (
            <article key={appointment._id} className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-[var(--color-text)]">
                    {appointment.doctorName}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    {appointment.date} · {appointment.time}
                  </p>
                  {appointment.notes ? (
                    <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">{appointment.notes}</p>
                  ) : null}
                </div>
                <div className="rounded-2xl bg-[var(--color-primary-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]">
                  {appointment.status}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[32px] border border-dashed border-[var(--color-border)] bg-white/70 p-8 text-sm leading-7 text-[var(--color-text-muted)]">
            You have not booked any appointments yet.
          </div>
        )}
      </div>
    </div>
  );
}
