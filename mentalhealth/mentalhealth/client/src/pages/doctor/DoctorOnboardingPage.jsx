import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StepProgress from "../../components/patient/StepProgress";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../lib/apiClient";

const steps = ["Professional Info", "Credentials", "Consent"];

const initialForm = {
  name: "",
  specialty: "",
  bio: "",
  contact: "",
  yearsOfExperience: "",
  qualifications: "",
  licenseNumber: "",
  consentAccepted: false,
};

export default function DoctorOnboardingPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSaving, setSaving] = useState(false);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user?._id) return;
      try {
        const data = await apiRequest(`/api/doctor/profile/${user._id}`);
        if (active) {
          setForm((current) => ({ 
            ...current, 
            ...data,
            name: data.name || user.name || ""
          }));
        }
      } catch (_error) {
        setForm(current => ({ ...current, name: user?.name || "" }));
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
  }, [user?._id, user?.name]);

  function nextStep() {
    if (currentStep === 0 && (!form.name || !form.specialty || !form.contact)) {
      setError("Please complete your basic professional details before moving on.");
      return;
    }

    if (currentStep === 1 && (!form.licenseNumber || !form.qualifications)) {
      setError("Please provide your license number and qualifications.");
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
      // We use a specific onboarding endpoint for doctors that updates both doctor profile and marks onboarding as complete
      await apiRequest(`/api/doctor/onboarding`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      await refreshUser();
      // Redirect based on role - if they are still pending-doctor, maybe to a "thank you" or "pending" page
      // But for now, let's follow the patient pattern or redirect to dashboard if they are already doctor
      navigate(user?.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard", { replace: true });
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
            Doctor onboarding
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--color-text)]">
            Welcome to the MindBridge care team.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-muted)]">
            Please complete your professional profile so we can present your expertise accurately to patients.
          </p>

          <div className="mt-8">
            <StepProgress steps={steps} currentStep={currentStep} />
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-soft sm:p-8">
              {currentStep === 0 ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">Professional Info</h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                      Help patients identify you and understand your specialty.
                    </p>
                  </div>
                  <label className="field">
                    <span>Display Name</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Dr. Name"
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="field">
                      <span>Specialty</span>
                      <input
                        type="text"
                        value={form.specialty}
                        onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value }))}
                        placeholder="e.g. Clinical Psychologist"
                      />
                    </label>
                    <label className="field">
                      <span>Contact Info</span>
                      <input
                        type="text"
                        value={form.contact}
                        onChange={(event) => setForm((current) => ({ ...current, contact: event.target.value }))}
                        placeholder="Email or Phone"
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span>Short Bio</span>
                    <textarea
                      rows="4"
                      value={form.bio}
                      onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                      placeholder="Tell patients about your approach and experience..."
                    />
                  </label>
                </div>
              ) : null}

              {currentStep === 1 ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">Credentials</h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                      Your qualifications and license help verify your expertise.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="field">
                      <span>Years of Experience</span>
                      <input
                        type="text"
                        value={form.yearsOfExperience}
                        onChange={(event) => setForm((current) => ({ ...current, yearsOfExperience: event.target.value }))}
                        placeholder="e.g. 5+ years"
                      />
                    </label>
                    <label className="field">
                      <span>License Number</span>
                      <input
                        type="text"
                        value={form.licenseNumber}
                        onChange={(event) => setForm((current) => ({ ...current, licenseNumber: event.target.value }))}
                        placeholder="Medical license ID"
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span>Qualifications</span>
                    <textarea
                      rows="4"
                      value={form.qualifications}
                      onChange={(event) => setForm((current) => ({ ...current, qualifications: event.target.value }))}
                      placeholder="e.g. MBBS, MD Psychiatry, PhD Clinical Psychology..."
                    />
                  </label>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">Consent and Professional Ethics</h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                      By joining MindBridge, you agree to provide supportive care in accordance with professional ethical guidelines and maintain patient confidentiality.
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
                      I agree to the MindBridge Professional Terms and verify that the information provided is accurate. I understand that my profile will be subject to admin approval.
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
                    {isSaving ? "Saving your profile..." : "Finish onboarding"}
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-[32px] bg-[linear-gradient(180deg,#dff4ef_0%,#f9fffd_100%)] p-6 shadow-soft sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                What comes next
              </p>
              <ul className="mt-5 space-y-4 text-sm leading-7 text-[var(--color-text-muted)]">
                <li>Admin will review your credentials for approval.</li>
                <li>Once approved, you can set your availability slots.</li>
                <li>Patients can then discover your profile and book appointments.</li>
                <li>You'll receive notifications for new bookings and messages.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
