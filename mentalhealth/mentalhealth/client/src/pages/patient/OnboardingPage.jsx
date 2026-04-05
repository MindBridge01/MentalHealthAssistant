import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StepProgress from "../../components/patient/StepProgress";
import { useAuth } from "../../context/AuthContext";
import { getOnboarding, saveOnboarding } from "../../services/patientService";

const steps = ["Basic info", "How you've been feeling", "Emergency contact", "Consent"];

const initialForm = {
  name: "",
  age: "",
  gender: "",
  mentalHealthContext: "",
  guardianName: "",
  guardianPhone: "",
  guardianEmail: "",
  consentAccepted: false,
};

export default function OnboardingPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSaving, setSaving] = useState(false);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await getOnboarding();
        if (active) {
          setForm((current) => ({ ...current, ...data }));
        }
      } catch (_error) {
        // Allow a fresh onboarding flow even if profile data is empty.
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  function nextStep() {
    if (currentStep === 0 && (!form.name || !form.age || !form.gender)) {
      setError("Please complete your basic details before moving on.");
      return;
    }

    if (currentStep === 2 && !form.guardianEmail && !form.guardianPhone) {
      setError("Please add at least a guardian email or phone number.");
      return;
    }

    setError("");
    setCurrentStep((value) => Math.min(value + 1, steps.length - 1));
  }

  function previousStep() {
    setError("");
    setCurrentStep((value) => Math.max(value - 1, 0));
  }

  async function handleFinish() {
    if (!form.consentAccepted) {
      setError("Please review and accept the consent note to continue.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await saveOnboarding(form);
      await refreshUser();
      navigate("/patient/dashboard", { replace: true });
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p className="auth-copy">Preparing your onboarding flow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[40px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,252,251,0.96)_100%)] p-6 shadow-[0_26px_80px_rgba(35,61,58,0.12)] sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-subtle)]">
            Patient onboarding
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--color-text)]">
            Let’s make your support space feel a little more personal.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-muted)]">
            This short setup helps us guide you toward the right features without using clinical or diagnostic language.
          </p>

          <div className="mt-8">
            <StepProgress steps={steps} currentStep={currentStep} />
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-soft sm:p-8">
              {currentStep === 0 ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">Basic info</h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                      A few basics help us address you warmly and tailor the experience to you.
                    </p>
                  </div>
                  <label className="field">
                    <span>Name</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="What should we call you?"
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="field">
                      <span>Age</span>
                      <input
                        type="number"
                        min="1"
                        value={form.age}
                        onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))}
                        placeholder="Your age"
                      />
                    </label>
                    <label className="field">
                      <span>Gender</span>
                      <select
                        value={form.gender}
                        onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                      >
                        <option value="">Select one</option>
                        <option value="Woman">Woman</option>
                        <option value="Man">Man</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </label>
                  </div>
                </div>
              ) : null}

              {currentStep === 1 ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">A little context</h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                      If you want, share what has felt most important lately. This is optional and you can keep it light.
                    </p>
                  </div>
                  <label className="field">
                    <span>What would you like us to know?</span>
                    <textarea
                      rows="6"
                      value={form.mentalHealthContext}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, mentalHealthContext: event.target.value }))
                      }
                      placeholder="Examples: feeling more stressed than usual, trouble winding down at night, wanting better routines..."
                    />
                  </label>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">Emergency contact</h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                      This helps us support you quickly if you use the SOS feature.
                    </p>
                  </div>
                  <label className="field">
                    <span>Guardian or trusted person</span>
                    <input
                      type="text"
                      value={form.guardianName}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, guardianName: event.target.value }))
                      }
                      placeholder="Their name"
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="field">
                      <span>Email</span>
                      <input
                        type="email"
                        value={form.guardianEmail}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, guardianEmail: event.target.value }))
                        }
                        placeholder="contact@example.com"
                      />
                    </label>
                    <label className="field">
                      <span>Phone</span>
                      <input
                        type="tel"
                        value={form.guardianPhone}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, guardianPhone: event.target.value }))
                        }
                        placeholder="+94 7x xxx xxxx"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">Consent and care note</h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                      MindBridge offers supportive tools, not medical diagnosis. If you feel at immediate risk, please contact emergency services or a trusted person right away.
                    </p>
                  </div>
                  <label className="flex gap-3 rounded-[24px] bg-[var(--color-surface)] p-4 text-sm leading-7 text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={form.consentAccepted}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, consentAccepted: event.target.checked }))
                      }
                      className="mt-1 h-5 w-5 rounded border-[var(--color-border)] text-[var(--color-primary)]"
                    />
                    <span>
                      I understand MindBridge is a support platform, not a substitute for emergency care or a clinical diagnosis, and I consent to storing my onboarding details to personalize my experience.
                    </span>
                  </label>
                </div>
              ) : null}

              {error ? <p className="mt-6 rounded-2xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{error}</p> : null}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={previousStep}
                  disabled={currentStep === 0}
                  className="rounded-2xl border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text)] disabled:opacity-50"
                >
                  Back
                </button>

                {currentStep < steps.length - 1 ? (
                  <button type="button" onClick={nextStep} className="primary-button">
                    Continue
                  </button>
                ) : (
                  <button type="button" onClick={handleFinish} disabled={isSaving} className="primary-button">
                    {isSaving ? "Saving your setup..." : "Finish onboarding"}
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-[32px] bg-[linear-gradient(180deg,#dff4ef_0%,#f9fffd_100%)] p-6 shadow-soft sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                What comes next
              </p>
              <ul className="mt-5 space-y-4 text-sm leading-7 text-[var(--color-text-muted)]">
                <li>Use AI Chat for structured, supportive reflection.</li>
                <li>Take a short assessment to see which next step may help most.</li>
                <li>Explore calming activities you can start right away.</li>
                <li>Reach out to a doctor or use SOS if you need more urgent support.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
