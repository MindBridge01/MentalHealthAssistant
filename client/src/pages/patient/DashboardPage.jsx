import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FeatureCard from "../../components/patient/FeatureCard";
import PageHeader from "../../components/patient/PageHeader";
import { dashboardFeatures } from "../../data/patientContent";
import { getDashboardData } from "../../services/patientService";

function SummaryCard({ label, value, hint }) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-soft">
      <p className="text-sm font-medium text-[var(--color-text-subtle)]">{label}</p>
      <p className="mt-3 font-display text-4xl font-semibold text-[var(--color-text)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{hint}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await getDashboardData();
        if (active) {
          setData(response);
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
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        title="Your support hub"
        description="Start with the kind of support that fits today. Everything here is designed to feel steady, private, and easy to return to."
        actions={
          <Link to="/patient/chat" className="primary-button">
            Start AI chat
          </Link>
        }
      />

      {error ? <div className="rounded-2xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Available activities"
          value={data?.activityCount ?? "—"}
          hint="Breathing, grounding, and reflection tools you can start in minutes."
        />
        <SummaryCard
          label="Upcoming appointments"
          value={data?.upcomingAppointments?.length ?? "—"}
          hint="Your next doctor bookings show up here."
        />
        <SummaryCard
          label="Doctors to explore"
          value={data?.doctorCount ?? "—"}
          hint="Browse trusted professionals and book when you feel ready."
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {dashboardFeatures.map((feature) => (
          <FeatureCard key={feature.href} {...feature} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
            Latest assessment
          </p>
          {data?.latestAssessment ? (
            <div className="mt-4">
              <h3 className="font-display text-2xl font-semibold text-[var(--color-text)]">
                {data.latestAssessment.classification.toUpperCase()} support recommendation
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                {data.latestAssessment.recommendation}
              </p>
              <Link
                to={`/patient/assessments/${data.latestAssessment._id}`}
                className="mt-5 inline-flex rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white"
              >
                Review result
              </Link>
            </div>
          ) : (
            <div className="mt-4 rounded-[24px] bg-[var(--color-surface)] p-5">
              <p className="text-sm leading-7 text-[var(--color-text-muted)]">
                You have not taken a recent assessment yet. A short check-in can help MindBridge guide you toward the best next step.
              </p>
              <Link
                to="/patient/assessments"
                className="mt-4 inline-flex rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[var(--color-text)]"
              >
                Start assessment
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
            Upcoming appointments
          </p>
          <div className="mt-4 space-y-4">
            {data?.upcomingAppointments?.length ? (
              data.upcomingAppointments.map((appointment) => (
                <div key={appointment._id} className="rounded-[24px] bg-[var(--color-surface)] p-4">
                  <p className="font-semibold text-[var(--color-text)]">{appointment.doctorName}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {appointment.date} · {appointment.time}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] bg-[var(--color-surface)] p-5 text-sm leading-7 text-[var(--color-text-muted)]">
                No appointments booked yet. When you are ready, you can browse doctors and choose a time that fits.
              </div>
            )}
          </div>
          <Link
            to="/patient/appointments"
            className="mt-5 inline-flex rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[var(--color-text)]"
          >
            View all appointments
          </Link>
        </div>
      </section>
    </div>
  );
}
