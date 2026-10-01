import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../../lib/apiClient';

const PatientSignupWizard = ({ onSubmit, isSubmitting: parentIsSubmitting }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    agreeTerms: false,
    agreePrivacy: false,
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!formData.agreeTerms || !formData.agreePrivacy) {
      setError("You must agree to the Terms & Conditions and Privacy Policy.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        })
      });
      
      // Navigate to login on success
      navigate('/login', { state: { message: "Account created successfully. Please login." } });
    } catch (err) {
      if (err.status === 409) {
        setError("An account with this email already exists.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden p-8 md:p-12">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
          <div className="h-full bg-[#0ea5e9] w-1/2"></div>
        </div>

        {/* Close Button */}
        <button 
          type="button"
          onClick={() => navigate('/login/patient')}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Return to Login"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="text-center mb-8 mt-2">
          <h2 className="text-[28px] font-bold text-[#0f172a]">Create Your Account</h2>
          <p className="text-[#64748b] mt-1 text-[15px]">Join MindBridge to start your mental health journey</p>
        </div>

        <div className="flex bg-[#f1f5f9] p-1 rounded-xl mb-8">
          <button
            type="button"
            className="flex-1 py-2 rounded-lg bg-white text-[#0f172a] font-semibold shadow-sm text-[15px]"
          >
            Patient
          </button>
          <button
            type="button"
            onClick={() => navigate('/signup/doctor')}
            className="flex-1 py-2 rounded-lg text-[#64748b] hover:text-[#0f172a] font-medium transition-colors text-[15px]"
          >
            Doctor
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleNext} className="space-y-5">
          <div>
            <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors"
              placeholder="e.g. Jane Doe"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors"
                placeholder="jane@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Mobile Number *</label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors"
                placeholder="+94 7X XXX XXXX"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors text-[#94a3b8]"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors text-[#94a3b8]"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors text-[#475569]"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors text-[#475569] appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>Select ▼</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="w-[18px] h-[18px] border-2 border-[#cbd5e1] rounded-[4px] text-sky-500 focus:ring-sky-500 cursor-pointer"
              />
              <span className="text-[14px] text-[#475569]">I agree to the Terms & Conditions</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="agreePrivacy"
                checked={formData.agreePrivacy}
                onChange={handleChange}
                className="w-[18px] h-[18px] border-2 border-[#cbd5e1] rounded-[4px] text-sky-500 focus:ring-sky-500 cursor-pointer"
              />
              <span className="text-[14px] text-[#475569]">I agree to the Privacy Policy</span>
            </label>
          </div>

          <div className="pt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-medium py-3.5 rounded-xl transition-colors text-[15px]"
            >
              {isSubmitting ? "Processing..." : "Create Account"}
            </button>
          </div>
        </form>

        <p className="text-center text-[14px] text-[#64748b] mt-8">
          Already have an account? <Link to="/login" className="text-[#334155] font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default PatientSignupWizard;
