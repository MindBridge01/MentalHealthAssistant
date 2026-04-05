import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/patient/PageHeader";
import { assessmentOptions, assessmentQuestions } from "../../data/patientContent";
import { submitAssessment } from "../../services/assessmentService";

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const question = assessmentQuestions[currentIndex];
  const selectedValue = responses.find((entry) => entry.questionId === question.id)?.score;

  function saveResponse(option) {
    setResponses((current) => {
      const next = current.filter((entry) => entry.questionId !== question.id);
      next.push({
        questionId: question.id,
        question: question.prompt,
        score: option.value,
        label: option.label,
      });
      return next;
    });
  }

  async function handleNext() {
    if (selectedValue === undefined) {
      setError("Choose the option that feels closest right now.");
      return;
    }

    setError("");
    if (currentIndex < assessmentQuestions.length - 1) {
      setCurrentIndex((value) => value + 1);
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitAssessment(responses);
      navigate(`/patient/assessments/${result.assessment._id}`, {
        state: { assessment: result.assessment },
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Assessment"
        title="A short emotional check-in"
        description="This is not a diagnosis. It is simply a guided reflection to help point you toward the next kind of support that may feel useful."
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <aside className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
            Progress
          </p>
          <div className="mt-5 space-y-3">
            {assessmentQuestions.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                    index < currentIndex
                      ? "bg-[var(--color-primary)] text-white"
                      : index === currentIndex
                        ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                        : "bg-[var(--color-surface)] text-[var(--color-text-subtle)]",
                  ].join(" ")}
                >
                  {index + 1}
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">{item.prompt}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="rounded-[36px] border border-white/70 bg-white/85 p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
            Question {currentIndex + 1} of {assessmentQuestions.length}
          </p>
          <h3 className="mt-4 font-display text-3xl font-semibold text-[var(--color-text)]">
            {question.prompt}
          </h3>

          <div className="mt-8 space-y-4">
            {assessmentOptions.map((option) => {
              const isSelected = selectedValue === option.value;
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => saveResponse(option)}
                  className={[
                    "w-full rounded-[24px] border px-5 py-4 text-left transition",
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                      : "border-white/70 bg-[var(--color-surface)] hover:border-[var(--color-primary-soft-strong)]",
                  ].join(" ")}
                >
                  <p className="font-semibold text-[var(--color-text)]">{option.label}</p>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">{option.description}</p>
                </button>
              );
            })}
          </div>

          {error ? <p className="mt-5 rounded-2xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{error}</p> : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
              disabled={currentIndex === 0}
              className="rounded-2xl border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text)] disabled:opacity-50"
            >
              Previous
            </button>
            <button type="button" onClick={handleNext} disabled={isSubmitting} className="primary-button">
              {currentIndex === assessmentQuestions.length - 1
                ? isSubmitting
                  ? "Finishing..."
                  : "See result"
                : "Continue"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
