import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import PageHeader from "../../components/patient/PageHeader";
import { getAssessmentResult } from "../../services/assessmentService";

const nextStepLabels = {
  low: { title: "Try calming activities", href: "/patient/activities" },
  medium: { title: "Open AI chat", href: "/patient/chat" },
  high: { title: "Find a doctor", href: "/patient/doctors" },
};

export default function AssessmentResultPage() {
  const { assessmentId } = useParams();
  const location = useLocation();
  const [assessment, setAssessment] = useState(location.state?.assessment || null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (assessment) return;

    let active = true;

    async function load() {
      try {
        const response = await getAssessmentResult(assessmentId);
        if (active) {
          setAssessment(response.assessment);
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
  }, [assessment, assessmentId]);

  const classification = assessment?.classification || "medium";
  const nextStep = nextStepLabels[classification];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Assessment result"
        title="Here’s the next step that may fit best"
        description="This result is guidance, not a diagnosis. If you ever feel unsafe or overwhelmed, choose immediate human support."
      />

      {error ? <div className="rounded-2xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{error}</div> : null}

      {assessment ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[36px] border border-white/70 bg-[linear-gradient(180deg,#def4ee_0%,#ffffff_100%)] p-8 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              Support level
            </p>
            <h3 className="mt-4 font-display text-5xl font-semibold uppercase text-[var(--color-text)]">
              {classification}
            </h3>
            <p className="mt-4 text-sm leading-7 text-[var(--color-text-muted)]">
              Score: {assessment.score}
            </p>
          </div>

          <div className="rounded-[36px] border border-white/70 bg-white/85 p-8 shadow-soft">
            <h3 className="font-display text-3xl font-semibold text-[var(--color-text)]">
              What this means
            </h3>
            <p className="mt-4 text-sm leading-8 text-[var(--color-text-muted)]">
              {assessment.recommendation}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={nextStep.href} className="primary-button">
                {nextStep.title}
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
      ) : null}
    </div>
  );
}
