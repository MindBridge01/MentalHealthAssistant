import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/patient/PageHeader";
import { screeningQuestionsData, screeningOptions, severityData } from "../../data/patientContent";
import { submitAssessment } from "../../services/assessmentService";

function shuffleArray(array) {
  let newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [screeningResponses, setScreeningResponses] = useState([]);
  const [severityResponses, setSeverityResponses] = useState([]);
  const [primaryIssue, setPrimaryIssue] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const shuffledScreeningQuestions = useMemo(() => {
    return shuffleArray(screeningQuestionsData);
  }, []);

  const activeSeverityData = primaryIssue ? severityData[primaryIssue] : null;

  const currentQuestions = step === 1 ? shuffledScreeningQuestions : (activeSeverityData?.questions || []);
  const currentOptions = step === 1 ? screeningOptions : (activeSeverityData?.options || []);
  const currentQuestion = currentQuestions[currentIndex] || {};
  
  const currentResponses = step === 1 ? screeningResponses : severityResponses;
  const selectedValue = currentResponses.find((entry) => entry.questionId === currentQuestion.id)?.option.value;

  function saveResponse(option) {
    const newEntry = { questionId: currentQuestion.id, question: currentQuestion.text, option };
    if (step === 1) {
      setScreeningResponses((current) => {
        const next = current.filter((entry) => entry.questionId !== currentQuestion.id);
        next.push(newEntry);
        return next;
      });
    } else {
      setSeverityResponses((current) => {
        const next = current.filter((entry) => entry.questionId !== currentQuestion.id);
        next.push(newEntry);
        return next;
      });
    }
  }

  function calculatePrimaryIssue(answers) {
    let scores = { Anxiety: 0, Depression: 0, Stress: 0 };
    answers.forEach(ans => {
      const q = shuffledScreeningQuestions.find(sq => sq.id === ans.questionId);
      if (q) scores[q.category] += ans.option.value;
    });

    let maxScore = -1;
    let pIssue = 'Anxiety';
    for (const [category, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        pIssue = category;
      }
    }
    setPrimaryIssue(pIssue);
  }

  async function handleNext() {
    if (selectedValue === undefined) {
      setError("Choose the option that feels closest right now.");
      return;
    }

    setError("");
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex((value) => value + 1);
      return;
    }

    if (step === 1) {
      calculatePrimaryIssue(screeningResponses);
      setStep(1.5);
      setCurrentIndex(0);
      return;
    }

    // End of Step 2
    setSubmitting(true);
    try {
      const result = activeSeverityData.calculateScore(severityResponses);
      
      const backendResponses = severityResponses.map((res) => ({
        questionId: res.questionId,
        question: res.question,
        score: res.option.value,
        label: res.option.label,
      }));

      const res = await submitAssessment(backendResponses);
      navigate(`/patient/assessments/${res.assessment._id}`, {
        state: { 
          assessment: res.assessment,
          customResult: { primaryIssue, level: result.level, needsHelp: result.needsHelp, total: result.total }
        },
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
        eyebrow={step === 1 ? "Assessment • Part 1" : step === 1.5 ? "Assessment Transition" : "Assessment • Part 2"}
        title={step === 1 ? "A short emotional check-in" : step === 1.5 ? "Moving to Part 2" : (activeSeverityData?.instruction || "Follow-up questions")}
        description="This is not a diagnosis. It is simply a guided reflection to help point you toward the next kind of support that may feel useful."
      />

      {step === 1.5 ? (
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[36px] border border-white/70 bg-white/85 p-12 text-center shadow-soft">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-display text-4xl font-semibold text-[var(--color-text)] mb-4">
              Part 1 Complete
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-[var(--color-text-muted)] mb-8">
              Thank you for taking the time to share how you've been feeling. Based on your responses, we have a few specific follow-up questions in Part 2 to help us better understand your current experience.
            </p>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="primary-button"
            >
              Continue to Part 2
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              Progress
            </p>
            <div className="mt-5 space-y-3">
              {currentQuestions.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div
                    className={[
                      "flex h-8 w-8 min-w-[32px] items-center justify-center rounded-full text-sm font-semibold",
                      index < currentIndex
                        ? "bg-[var(--color-primary)] text-white"
                        : index === currentIndex
                          ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                          : "bg-[var(--color-surface)] text-[var(--color-text-subtle)]",
                    ].join(" ")}
                  >
                    {index + 1}
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">{item.text}</p>
                </div>
              ))}
            </div>
          </aside>

          <section className="rounded-[36px] border border-white/70 bg-white/85 p-6 shadow-soft sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              Question {currentIndex + 1} of {currentQuestions.length}
            </p>
            <h3 className="mt-4 font-display text-3xl font-semibold text-[var(--color-text)]">
              {currentQuestion.text}
            </h3>

            <div className="mt-8 space-y-4">
              {currentOptions.map((option) => {
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
                    {option.description && <p className="mt-2 text-sm text-[var(--color-text-muted)]">{option.description}</p>}
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
                {currentIndex === currentQuestions.length - 1
                  ? step === 1
                    ? "Continue to Part 2"
                    : isSubmitting
                      ? "Finishing..."
                      : "See result"
                  : "Continue"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
