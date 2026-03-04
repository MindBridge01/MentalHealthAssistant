import React, { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const AuthWindow = ({ mode = "login" }) => {
  const { role: urlRole } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [currentRole, setCurrentRole] = useState(urlRole || "user");

  // ---------- Google Sign-In ----------
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse.credential;
      const response = await axios.post(
        '/api/auth/google-login',
        { idToken, role: currentRole },
        { withCredentials: true }
      );

      // Save user info
      localStorage.setItem('user', JSON.stringify(response.data));

      // Redirect based on role
      if (response.data.role === 'doctor') navigate(location.state?.from || '/doctor-dashboard');
      else if (response.data.role === 'admin') navigate('/admin-dashboard');
      else navigate(location.state?.from || '/');
    } catch (err) {
      setError('Google login failed');
    }
  };

  const handleGoogleError = () => setError('Google login was cancelled or failed.');

  // ---------- Manual Login/Signup ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (mode === "signup" && !name)) {
      setError("Please fill all required fields.");
      return;
    }
    setError("");
    try {
      let response;
      if (mode === "login") {
        response = await axios.post(
          '/api/auth/login',
          { email, password, role: currentRole },
          { withCredentials: true }
        );
      } else {
        response = await axios.post(
          '/api/auth/signup',
          { name, email, password, role: currentRole },
          { withCredentials: true }
        );
      }

      // Save user info
      localStorage.setItem('user', JSON.stringify(response.data));

      // Redirect based on role
      if (response.data.role === 'doctor') navigate(location.state?.from || '/doctor-only-dashboard');
      else if (response.data.role === 'admin') navigate('/admin-dashboard');
      else navigate(location.state?.from || '/'); // redirects standard users to home page
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-md p-8 mt-12">
      <h2 className="font-['General_Sans'] font-semibold text-dark-blue900 text-2xl md:text-4xl mb-6 text-center">
        {mode === "login"
          ? `Login as ${currentRole === "doctor" ? "Doctor" : currentRole === "admin" ? "Admin" : "User"}`
          : `Signup as ${currentRole === "doctor" ? "Doctor" : currentRole === "admin" ? "Admin" : "User"}`}
      </h2>

      <div className="flex bg-gray-100 p-1 rounded-lg mb-6 justify-center">
        <button
          type="button"
          onClick={() => setCurrentRole('user')}
          className={`flex-1 py-1.5 rounded-md transition-colors ${currentRole === 'user' ? 'bg-white shadow-sm font-semibold' : 'text-gray-600'}`}
        >
          User
        </button>
        <button
          type="button"
          onClick={() => setCurrentRole('doctor')}
          className={`flex-1 py-1.5 rounded-md transition-colors ${currentRole === 'doctor' ? 'bg-white shadow-sm font-semibold' : 'text-gray-600'}`}
        >
          Doctor
        </button>
        {mode === "login" && (
          <button
            type="button"
            onClick={() => setCurrentRole('admin')}
            className={`flex-1 py-1.5 rounded-md transition-colors ${currentRole === 'admin' ? 'bg-white shadow-sm font-semibold' : 'text-gray-600'}`}
          >
            Admin
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "signup" && (
          <input
            className="p-3 border border-gray-300 rounded-md"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        )}
        <input
          className="p-3 border border-gray-300 rounded-md"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="p-3 border border-gray-300 rounded-md"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {mode === "login" && (
          <button
            type="button"
            className="text-blue-600 hover:underline text-sm text-left"
            onClick={() => navigate(`/forgot-password/${currentRole}`)}
          >
            Forgot password?
          </button>
        )}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          type="submit"
          className="w-full py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 font-bold"
        >
          {mode === "login" ? "Login" : "Sign Up"}
        </button>
        <div className="w-full flex justify-center mt-2">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
          />
        </div>
        <div className="text-center mt-2">
          {mode === "login" ? (
            <span>
              Don't have an account?{' '}
              <button
                className="text-blue-600 hover:underline"
                type="button"
                onClick={() => navigate(`/signup/${currentRole}`)}
              >Sign Up</button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                className="text-blue-600 hover:underline"
                type="button"
                onClick={() => navigate(`/login/${currentRole}`)}
              >Login</button>
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default AuthWindow;
