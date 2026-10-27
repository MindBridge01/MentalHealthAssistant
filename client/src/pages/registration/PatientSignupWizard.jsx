import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalShell from '../../components/auth/PortalShell';
import { useAuth } from '../../context/AuthContext';

const PatientSignupWizard = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
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
    if (formData.password.length < 15) {
      setError("Password must be at least 15 characters.");
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
      await signup({ name: formData.fullName.trim(), email: formData.email.trim().toLowerCase(), password: formData.password });
      
      // Continue directly into patient registration using the authenticated session.
      navigate('/patient/registration', { replace: true, state: { registrationDefaults: { phone: formData.mobileNumber, dateOfBirth: formData.dateOfBirth } } });
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

  const field = (name, label, type = 'text', placeholder = '') => <label className="field"><span>{label}</span><input name={name} type={type} value={formData[name]} onChange={handleChange} placeholder={placeholder} required autoComplete={({fullName:'name',email:'email',mobileNumber:'tel',dateOfBirth:'bday',password:'new-password',confirmPassword:'new-password'})[name]} minLength={type === 'password' ? 15 : undefined} /></label>;

  return <PortalShell role="patient" activeStep={0}>
    <form onSubmit={handleNext} className="registration-form">
      <p className="registration-form-eyebrow">YOUR REGISTRATION</p>
      <h2>Let’s start with you.</h2>
      <p className="registration-subtitle">Create your account to begin your registration.</p>
      {error && <div className="registration-error" role="alert">{error}</div>}
      <fieldset className="registration-fields" disabled={isSubmitting}>
        {field('fullName', 'Full name')}
        <div className="registration-field-grid">{field('email', 'Email address', 'email', 'you@example.com')}{field('mobileNumber', 'Mobile number', 'tel')}</div>
        <div className="registration-field-grid">{field('password', 'Password · at least 15 characters', 'password', 'Enter your password')}{field('confirmPassword', 'Confirm password', 'password', 'Enter your password')}</div>
        <div className="registration-field-grid">{field('dateOfBirth', 'Date of birth', 'date')}<label className="field"><span>Gender</span><select name="gender" value={formData.gender} onChange={handleChange} required><option value="">Select an option</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></label></div>
        <label className="registration-choice"><input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} required /><span><strong>I agree to the Terms &amp; Conditions.</strong><small>Read the linked policy below before agreeing.</small></span></label>
        <label className="registration-choice"><input type="checkbox" name="agreePrivacy" checked={formData.agreePrivacy} onChange={handleChange} required /><span><strong>I agree to the Privacy Policy.</strong><small>Read the linked policy below before agreeing.</small></span></label>
      </fieldset>
      <footer className="registration-form-footer"><span className="registration-footnote">Review your details before continuing.</span><div><button className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create account'}</button></div></footer>
    </form>
  </PortalShell>;
};

export default PatientSignupWizard;
