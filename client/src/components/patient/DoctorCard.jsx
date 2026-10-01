import { Link } from "react-router-dom";

export default function DoctorCard({ doctor }) {
  return (
    <article className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--color-primary-soft)] text-xl font-semibold text-[var(--color-primary)]">
            {(doctor.name || "D").slice(0, 1)}
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-[var(--color-text)]">{doctor.name}</h3>
            <p className="mt-1 text-sm font-medium text-[var(--color-primary)]">
              {doctor.specialty || "Mental wellness support"}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--color-text-muted)]">
              {doctor.bio || "A calm, supportive profile is being prepared for this doctor."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
            {doctor.slots?.length || 0} open slots
          </div>
          <Link
            to={`/patient/doctors/${doctor.userId}`}
            className="rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white"
          >
            View profile
          </Link>
        </div>
      </div>
    </article>
  );
}
