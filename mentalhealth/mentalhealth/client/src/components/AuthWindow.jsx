import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { apiRequest } from "../lib/apiClient";
import { hasCompletePatientProfile } from "../lib/authStorage";
import { useAuth } from "../context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const ROLE_PATIENT = "patient";
const ROLE_DOCTOR = "doctor";
const ROLE_ADMIN = "admin";

function normalizeRole(candidateRole, mode) {
  const raw = String(candidateRole || "").trim().toLowerCase();

  if (raw === "user") return ROLE_PATIENT;
  if (raw === ROLE_PATIENT) return ROLE_PATIENT;
  if (raw === ROLE_DOCTOR) return ROLE_DOCTOR;
  if (raw === ROLE_ADMIN && mode === "login") return ROLE_ADMIN;
  return ROLE_PATIENT;
}

function getFieldValidation({ mode, name, email, password }) {
  if (mode === "signup" && name.trim().length < 2) {
    return "Please enter your full name.";
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return "Please enter a valid email address.";
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return "Password must be at least 8 characters.";
  }

  return "";
}

const AuthWindow = ({ mode = "login" }) => {
  const { role: urlRole } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, refreshUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentRole, setCurrentRole] = useState(() => normalizeRole(urlRole, mode));

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleLabel = useMemo(() => {
    if (currentRole === ROLE_DOCTOR) return "Doctor";
    if (currentRole === ROLE_ADMIN) return "Admin";
    return "Patient";
  }, [currentRole]);

  useEffect(() => {
    setCurrentRole(normalizeRole(urlRole, mode));
  }, [urlRole, mode]);

  const redirectAfterAuth = (user) => {
    if (user.role === ROLE_DOCTOR) {
      navigate(location.state?.from || "/doctor/dashboard");
      return;
    }

    if (user.role === ROLE_ADMIN) {
      navigate("/admin/dashboard");
      return;
    }

    if (!hasCompletePatientProfile(user)) {
      navigate("/profile-settings", {
        state: { onboarding: true, from: location.state?.from || "/" },
      });
      return;
    }

    navigate(location.state?.from || "/patient/dashboard");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = getFieldValidation({ mode, name, email, password });
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const path =
        mode === "login"
          ? "/api/auth/login"
          : currentRole === ROLE_DOCTOR
            ? "/api/auth/signup-doctor"
            : "/api/auth/signup";
      const body =
        mode === "login"
          ? { email: email.trim().toLowerCase(), password }
          : {
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password,
            };

      const user = await apiRequest(path, {
        method: "POST",
        body: JSON.stringify(body),
      });

      setUser(user);
      await refreshUser();
      setSuccess(mode === "login" ? "Signed in successfully." : "Account created successfully.");
      redirectAfterAuth(user);
    } catch (err) {
      if (err.status === 401) {
        setError("Invalid credentials. Please check your email and password.");
      } else if (err.status === 403) {
        setError("Your selected role does not have access for this account.");
      } else if (err.status === 404 && mode === "login") {
        setError("No account found for this email.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full max-w-xl mx-auto mt-10 mb-10 px-6 py-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
      <header className="mb-6 text-center">
        <p className="text-sm uppercase tracking-wide text-slate-500">MindBridge Secure Access</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          {mode === "login" ? `Sign In as ${roleLabel}` : `Create ${roleLabel} Account`}
        </h1>
        <p className="mt-2 text-slate-600">
          {mode === "login"
            ? "Use your registered details to securely access your care dashboard."
            : "Start with your account details. You can complete your health profile next."}
        </p>
      </header>

      <div className="flex bg-slate-100 p-1 rounded-xl mb-6" role="tablist" aria-label="Select account role">
        <button
          type="button"
          onClick={() => setCurrentRole(ROLE_PATIENT)}
          className={`flex-1 py-2 rounded-lg ${currentRole === ROLE_PATIENT ? "bg-white text-slate-900 font-semibold" : "text-slate-600"}`}
        >
          Patient
        </button>
        <button
          type="button"
          onClick={() => setCurrentRole(ROLE_DOCTOR)}
          className={`flex-1 py-2 rounded-lg ${currentRole === ROLE_DOCTOR ? "bg-white text-slate-900 font-semibold" : "text-slate-600"}`}
        >
          Doctor
        </button>
        {mode === "login" && (
          <button
            type="button"
            onClick={() => setCurrentRole(ROLE_ADMIN)}
            className={`flex-1 py-2 rounded-lg ${currentRole === ROLE_ADMIN ? "bg-white text-slate-900 font-semibold" : "text-slate-600"}`}
          >
            Admin
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full p-3 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              placeholder="Enter your full name"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full p-3 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            placeholder="name@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full p-3 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            placeholder="At least 8 characters"
            required
          />
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div role="status" aria-live="polite" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl text-white bg-sky-700 hover:bg-sky-800 disabled:bg-slate-400 font-semibold"
        >
          {isSubmitting ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>

      <div className="text-center mt-6 text-sm text-slate-600">
        {mode === "login" ? (
          <span>
            Need an account?{" "}
            <button type="button" className="text-sky-700 hover:underline" onClick={() => navigate(`/signup/${currentRole}`)}>
              Sign up
            </button>
          </span>
        ) : (
          <span>
            Already registered?{" "}
            <button type="button" className="text-sky-700 hover:underline" onClick={() => navigate(`/login/${currentRole}`)}>
              Sign in
            </button>
          </span>
        )}
      </div>
    </section>
  );
};

export default AuthWindow;
