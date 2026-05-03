import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { apiRequest } from "../lib/apiClient";
import { hasCompletePatientProfile } from "../lib/authStorage";
import { useAuth } from "../context/AuthContext";
import loginSideImage from "../assets/images/login-hero-figma.jpg";
import LoginContainer from "./auth/LoginContainer";
import LoginForm from "./auth/LoginForm";
import InputField from "./auth/InputField";
import AuthButton from "./auth/AuthButton";
import "./auth/auth.css";

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
  const [rememberMe, setRememberMe] = useState(false);

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
      navigate("/patient/onboarding", {
        state: { onboarding: true, from: location.state?.from || "/patient/dashboard" },
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

  const handleForgotPassword = () => {};

  if (mode === "login") {
    return (
      <LoginContainer
        imageAlt="MindBridge calming wellness illustration"
        imageSrc={loginSideImage}
      >
        <LoginForm
          currentRole={currentRole}
          email={email}
          error={error}
          isSubmitting={isSubmitting}
          onEmailChange={(event) => setEmail(event.target.value)}
          onForgotPassword={handleForgotPassword}
          onPasswordChange={(event) => setPassword(event.target.value)}
          onRememberChange={(event) => setRememberMe(event.target.checked)}
          onSubmit={handleSubmit}
          password={password}
          rememberMe={rememberMe}
          success={success}
        />
      </LoginContainer>
    );
  }

  return (
    <section className="w-full max-w-xl mx-auto mt-10 mb-10 px-6 py-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
      <header className="mb-6 text-center">
        <p className="text-sm uppercase tracking-wide text-slate-500 font-['Outfit']">MindBridge Secure Access</p>
        <h1 className="login-ui__title mt-2 mb-2" style={{ textAlign: 'center', fontSize: '42px' }}>
          {mode === "login" ? `Sign In as ${roleLabel}` : `Create ${roleLabel} Account`}
        </h1>
        <p className="login-ui__subtitle" style={{ textAlign: 'center', fontSize: '18px' }}>
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
          <InputField
            autoComplete="name"
            id="name"
            label="Full Name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your full name"
            type="text"
            value={name}
          />
        )}

        <InputField
          autoComplete="email"
          id="email"
          label="Email Address"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          type="email"
          value={email}
        />

        <InputField
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          id="password"
          label="Password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          type="password"
          value={password}
        />

        {error && (
          <div aria-live="assertive" className="login-ui__message login-ui__message--error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div aria-live="polite" className="login-ui__message login-ui__message--success" role="status">
            {success}
          </div>
        )}

        <div className="pt-2">
          <AuthButton disabled={isSubmitting} type="submit">
            {isSubmitting ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </AuthButton>
        </div>
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
