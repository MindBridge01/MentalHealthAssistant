import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ActivityTimer from "../../components/patient/ActivityTimer";
import PageHeader from "../../components/patient/PageHeader";
import { getActivities } from "../../services/patientService";

export default function ActivityDetailPage() {
  const { activityId } = useParams();
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const response = await getActivities();
      if (active) {
        setActivity((response.activities || []).find((entry) => entry.id === activityId) || null);
      }
    }

    load().catch(() => {});
    return () => {
      active = false;
    };
  }, [activityId]);

  if (!activity) {
    return (
      <div className="rounded-2xl bg-white/85 p-6 shadow-soft">
        <p className="text-sm text-[var(--color-text-muted)]">We could not find that activity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={activity.category}
        title={activity.title}
        description={activity.description}
        actions={
          <Link
            to="/patient/activities"
            className="rounded-2xl border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text)]"
          >
            Back to activities
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <ActivityTimer durationMinutes={activity.durationMinutes} />
        <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
            How to begin
          </p>
          <ol className="mt-5 space-y-4">
            {activity.steps.map((step, index) => (
              <li key={step} className="flex gap-4 rounded-[24px] bg-[var(--color-surface)] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] font-semibold text-[var(--color-primary)]">
                  {index + 1}
                </div>
                <p className="text-sm leading-7 text-[var(--color-text)]">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
