import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/patient/PageHeader";
import { getDoctorProfile, getDoctors } from "../../services/doctorService";

export default function DoctorProfilePage() {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [profile, doctors] = await Promise.all([getDoctorProfile(doctorId), getDoctors()]);
        const matchingDoctor = doctors.find((entry) => entry.userId === doctorId);
        if (active) {
          setDoctor({ ...matchingDoctor, ...profile, userId: doctorId, slots: matchingDoctor?.slots || [] });
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [doctorId]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Doctor profile"
        title={doctor?.name || "Doctor details"}
        description={doctor?.specialty || "Review this doctor's focus areas and availability before booking."}
      />

      {error ? <div className="rounded-2xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{error}</div> : null}

      {doctor ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[36px] border border-white/70 bg-white/85 p-8 shadow-soft">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[var(--color-primary-soft)] text-2xl font-semibold text-[var(--color-primary)]">
                {(doctor.name || "D").slice(0, 1)}
              </div>
              <div>
                <h3 className="font-display text-3xl font-semibold text-[var(--color-text)]">{doctor.name}</h3>
                <p className="mt-2 text-sm font-medium text-[var(--color-primary)]">{doctor.specialty}</p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-8 text-[var(--color-text-muted)]">
              {doctor.bio || "This doctor profile is still being completed."}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] bg-[var(--color-surface)] p-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">Experience</p>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  {doctor.yearsOfExperience || "Experience details coming soon"}
                </p>
              </div>
              <div className="rounded-[24px] bg-[var(--color-surface)] p-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">Contact</p>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  {doctor.contact || "Contact information available after booking"}
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-[36px] border border-white/70 bg-white/85 p-8 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              Booking
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--color-text-muted)]">
              This doctor currently has {doctor.slots?.length || 0} open slot{doctor.slots?.length === 1 ? "" : "s"}.
            </p>
            <Link to={`/patient/doctors/${doctorId}/book`} className="mt-6 inline-flex rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white">
              Continue to booking
            </Link>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
