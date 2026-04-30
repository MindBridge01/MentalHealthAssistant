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
  
  const customResult = location.state?.customResult || null;

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
  
  let nextStep = nextStepLabels[classification];
  let recommendationText = assessment?.recommendation || "";

  if (customResult) {
    const highLevels = ['Moderately Severe', 'Severe', 'High'];
    if (highLevels.includes(customResult.level) || customResult.needsHelp) {
      nextStep = nextStepLabels.high;
      recommendationText = "Your responses suggest you may be carrying a heavy weight right now. We highly recommend connecting with a qualified doctor or counselor who can offer direct, human support.";
    } else if (['Moderate'].includes(customResult.level)) {
      nextStep = nextStepLabels.medium;
      recommendationText = "It looks like you've been facing some challenges recently. A guided conversation with MindBridge AI could be a safe space to reflect on what you're experiencing.";
    } else {
      nextStep = nextStepLabels.low;
      recommendationText = "Your current well-being appears relatively stable. Gentle daily activities and occasional check-ins are great ways to maintain this balance.";
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Assessment result"
        title="Here’s the next step that may fit best"
        description="This result is guidance, not a diagnosis. If you ever feel unsafe or overwhelmed, choose immediate human support."
      />

      {error ? <div className="rounded-2xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{error}</div> : null}

      {assessment ? (
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[36px] border border-white/70 bg-white/85 p-8 shadow-soft text-center sm:text-left">
            <h3 className="font-display text-3xl font-semibold text-[var(--color-text)]">
              Thank you for checking in
            </h3>
            <p className="mt-4 text-base leading-8 text-[var(--color-text-muted)] italic">
              "Taking a moment to pause and reflect on how you're truly feeling is an act of courage and self-care. We are so glad you are here."
            </p>
            <div className="my-6 h-px w-full bg-black/5"></div>
            <p className="text-base leading-8 text-[var(--color-text-muted)] font-medium">
              {recommendationText}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center sm:justify-start">
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
