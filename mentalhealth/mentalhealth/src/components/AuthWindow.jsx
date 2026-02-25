import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const AuthWindow = ({ mode = "login", role = "user" }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // ---------- Google Sign-In ----------
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse.credential;
      const response = await axios.post('/api/auth/google-login', { idToken, role });

      // Save user info + JWT
      localStorage.setItem('user', JSON.stringify(response.data));
      localStorage.setItem('token', response.data.token);
      console.log("JWT Token:", response.data.token);// <-- store JWT

      // Redirect based on role
      if (response.data.role === 'doctor') navigate('/doctor-dashboard');
      else if (response.data.role === 'admin') navigate('/admin-dashboard');
      else navigate('/');
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
        response = await axios.post('/api/auth/login', { email, password, role });
      } else {
        response = await axios.post('/api/auth/signup', { name, email, password, role });
      }

      // Save user info + JWT
      localStorage.setItem('user', JSON.stringify(response.data));
      localStorage.setItem('token', response.data.token);

      // Redirect based on role
      if (response.data.role === 'doctor') navigate('/doctor-only-dashboard');
      else if (response.data.role === 'admin') navigate('/admin-dashboard');
      else navigate('/'); // redirects standard users to home page
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-md p-8 mt-12">
      <h2 className="font-['General_Sans'] font-semibold text-dark-blue900 text-2xl md:text-4xl mb-6 text-center">
        {mode === "login"
          ? `Login as ${role === "doctor" ? "Doctor" : role === "admin" ? "Admin" : "User"}`
          : `Signup as ${role === "doctor" ? "Doctor" : role === "admin" ? "Admin" : "User"}`}
      </h2>
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
            onClick={() => navigate(`/forgot-password/${role}`)}
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
                onClick={() => navigate(`/signup/${role}`)}
              >Sign Up</button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                className="text-blue-600 hover:underline"
                type="button"
                onClick={() => navigate(`/login/${role}`)}
              >Login</button>
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default AuthWindow;