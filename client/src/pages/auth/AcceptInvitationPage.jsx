import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { apiRequest } from "../../lib/apiClient";
import { useAuth } from "../../context/AuthContext";
import RecoveryCodes from "../../components/auth/RecoveryCodes";
import QrCodeView from "../../components/auth/QrCodeView";

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const [token] = useState(()=>new URLSearchParams(window.location.hash.slice(1)).get("token") || searchParams.get("token"));
  const [codes,setCodes]=useState(null);
  const navigate = useNavigate();
  const { setUser, refreshUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    window.history.replaceState(null,"",window.location.pathname);
    let isMounted = true;
    if (!token) {
      setIsLoading(false);
      setLoadError("No invitation token was provided in the link. Please check your invitation email.");
      return;
    }

    apiRequest("/api/auth/invitation/verify",{method:"POST",body:{token}})
      .then((data) => {
        if (isMounted) {
          setInvitation(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(err.message || "This invitation link is invalid or has expired.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (password.length < 12) {
      setSubmitError("Password must be at least 12 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }
    if (!/^\d{6}$/.test(mfaCode.trim())) {
      setSubmitError("Please enter the 6-digit verification code from your authenticator app.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await apiRequest("/api/auth/invitation/accept", {
        method: "POST",
        body: JSON.stringify({
          token,
          password,
          mfaCode: mfaCode.trim(),

        }),
      });

      const {recoveryCodes,...user}=result;
      setUser(user);
      await refreshUser();

      setCodes(recoveryCodes || []);
    } catch (err) {
      setSubmitError(err.message || "Failed to activate your account. Please check your credentials.");
      setIsSubmitting(false);
    }
  };

  if(codes) return <main style={{maxWidth:640,margin:"50px auto",padding:24}}><RecoveryCodes codes={codes} onContinue={()=>navigate("/hospital/dashboard")}/></main>;
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center p-8 bg-white border border-slate-200 rounded-3xl shadow-sm max-w-md w-full">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Validating Invitation</h2>
          <p className="text-sm text-slate-500">Checking your secure invitation token with the server...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm max-w-lg w-full text-center">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Invitation Unavailable</h2>
          <p className="text-sm text-slate-600 mb-6">{loadError}</p>
          <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 mb-6 text-left">
            <strong>Why might this happen?</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>The invitation link was already used to create an account.</li>
              <li>The 48-hour validity period has expired.</li>
              <li>An administrator revoked or resent this invitation.</li>
            </ul>
          </div>
          <div className="flex justify-center gap-3">
            <Link to="/login" className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors">
              Go to Sign In
            </Link>
            <Link to="/" className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
            Hospital Staff Onboarding
          </span>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Complete Officer Activation
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Set your secure password and enroll in Multi-Factor Authentication (MFA) to access the booking desk.
          </p>
        </div>

        {/* Assigned Details Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs mb-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Assigned Credentials & Scope
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500 block text-xs">Staff Name</span>
              <strong className="text-slate-800 font-medium">{invitation?.name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Official Work Email</span>
              <strong className="text-slate-800 font-medium">{invitation?.email}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Assigned Medical Centre</span>
              <strong className="text-teal-700 font-semibold">{invitation?.hospitalName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Platform Role</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                Hospital Booking Officer
              </span>
            </div>
          </div>
          <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
            🔒 Security policy: Your hospital assignment and role are enforced by system administration and cannot be modified.
          </p>
        </div>

        {/* Activation Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">1. Choose Your Password</h2>
            <p className="text-xs text-slate-500 mb-4">
              Use at least 12 characters. Never reuse your personal passwords.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="officer-password" className="block text-xs font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="officer-password" autoComplete="new-password"
                  type={showPassword ? "text" : "password"}
                    required
                    minLength={12}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter at least 12 characters"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="officer-confirm" className="block text-xs font-medium text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  id="officer-confirm" autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-rose-600 mt-1">Passwords do not match.</p>
                )}
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* MFA Setup Section */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">2. Enroll in MFA (Mandatory)</h2>
            <p className="text-xs text-slate-500 mb-4">
              Scan this code into your authenticator app (Google Authenticator, Microsoft Authenticator, or 1Password).
            </p>

            <QrCodeView
              otpAuthUrl={invitation?.otpAuthUrl}
              secret={invitation?.mfaSecret}
            />

            <div className="mt-4">
              <label htmlFor="officer-code" className="block text-xs font-medium text-slate-700 mb-1">
                Enter 6-Digit Code from Authenticator
              </label>
              <input
                type="text"
                id="officer-code" autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                required
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full px-4 py-3 text-center text-xl font-mono font-bold tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none focus:bg-white transition-all"
              />
              <p className="text-xs text-slate-400 mt-1 text-center">
                This verifies that your authenticator app is configured correctly before activating your account.
              </p>
            </div>
          </div>

          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
              {submitSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || password.length < 12 || password !== confirmPassword || mfaCode.length < 6}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm transition-all focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            {isSubmitting ? "Activating Your Account..." : "Activate Account & Enter Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
