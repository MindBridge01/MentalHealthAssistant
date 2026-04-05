import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/patient/PageHeader";
import { getActivities } from "../../services/patientService";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await getActivities();
        if (active) {
          setActivities(response.activities || []);
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
        eyebrow="Activities"
        title="Small practices that can help you settle"
        description="These exercises are simple, non-clinical tools you can start whenever you need a softer landing."
      />

      {error ? <div className="rounded-2xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{error}</div> : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {activities.map((activity) => (
          <article key={activity.id} className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
              {activity.category}
            </p>
            <h3 className="mt-3 font-display text-2xl font-semibold text-[var(--color-text)]">
              {activity.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">{activity.description}</p>
            <div className="mt-5 flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
              <span>{activity.durationMinutes} min</span>
              <span>·</span>
              <span>{activity.intensity}</span>
            </div>
            <Link to={`/patient/activities/${activity.id}`} className="mt-6 inline-flex rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white">
              Open activity
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
