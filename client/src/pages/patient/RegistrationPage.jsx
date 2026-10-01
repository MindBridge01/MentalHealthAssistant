import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/apiClient';
import './registration.css';

const STEPS = [
  { title: 'Your details', description: 'A little introduction', icon: 'person_outline' },
  { title: 'Your care', description: 'Support on your terms', icon: 'favorite_border' },
  { title: 'Stay connected', description: 'Contact preferences', icon: 'chat_bubble_outline' },
  { title: 'Review & submit', description: 'You’re in control', icon: 'task_alt' },
];
const EMPTY = { name: '', preferredName: '', dateOfBirth: '', gender: '', phone: '', language: 'English',
  city: '', previousCare: 'prefer-not-to-say', careContext: '', contactName: '', contactRelationship: '',
  contactPhone: '', privacyAccepted: false, supportAcknowledged: false, emailReminders: false };
const STATUS = {
  submitted: { title: 'Your registration is with us.', label: 'Awaiting review', icon: 'hourglass_top',
    copy: 'An administrator will check your registration details. You can return here to check the progress of your application.' },
  needs_information: { title: 'A little more information.', label: 'Action needed', icon: 'edit_note',
    copy: 'Please read the request below, update your details, and submit your application again.' },
  declined: { title: 'An update on your registration.', label: 'Review completed', icon: 'info_outline',
    copy: 'Read the explanation below. You can correct your details or add clarification and resubmit for another review.' },
  approved: { title: 'Welcome to your care space.', label: 'Registration approved', icon: 'verified',
    copy: 'Your registration has been approved. Your MindBridge dashboard is ready.' },
};

function Field({ label, optional, children }) {
  return <label className="field"><span>{label}{optional && <small className="registration-optional">Optional</small>}</span>{children}</label>;
}

export default function RegistrationPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...EMPTY, name: user?.name || '' });
  const [step, setStep] = useState(0);
  const [application, setApplication] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef(null);
  const headingRef = useRef(null);
  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  async function load() {
    setLoading(true); setError(''); setLoadFailed(false);
    try {
      const result = await apiRequest('/api/registration/me');
      setApplication(result.application);
      if (result.application) setForm((previous) => ({ ...previous, ...result.application.details }));
    } catch (err) { setError(err.message); setLoadFailed(true); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!loading) headingRef.current?.focus(); }, [step, loading, editing]);

  function validateStep() {
    if (!formRef.current.reportValidity()) return false;
    if (step === 0) {
      const birth = new Date(`${form.dateOfBirth}T00:00:00`);
      const today = new Date();
      const adultDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      if (!Number.isFinite(birth.getTime()) || birth > adultDate || birth.getFullYear() < 1900) {
        setError('This university prototype supports adults aged 18 and over. Please check your date of birth.'); return false;
      }
      if (!/^\+?[0-9 ()-]{7,25}$/.test(form.phone)) {
        setError('Please enter a valid contact number.'); return false;
      }
    }
    if (step === 2 && (form.contactName || form.contactRelationship || form.contactPhone) &&
      (!form.contactName.trim() || !form.contactRelationship.trim() || !/^\+?[0-9 ()-]{7,25}$/.test(form.contactPhone))) {
      setError('Complete all three trusted-contact fields, or leave them empty.'); return false;
    }
    return true;
  }

  async function submit(event) {
    event.preventDefault(); setError('');
    if (!validateStep()) return;
    if (step < 3) { setStep(step + 1); return; }
    setSaving(true);
    try {
      const result = await apiRequest('/api/registration/me', { method: 'POST', body: form });
      setApplication(result.application); setEditing(false);
      await refreshUser();
    } catch (err) {
      setError(err.message);
      const first = Object.keys(err.payload?.fields || {})[0];
      if (['name', 'dateOfBirth', 'phone', 'gender', 'language', 'city', 'preferredName'].includes(first)) setStep(0);
      else if (['previousCare', 'careContext'].includes(first)) setStep(1);
      else if (first?.startsWith('contact')) setStep(2);
    } finally { setSaving(false); }
  }

  const textInput = (key, extra = {}) => <input value={form[key]} onChange={(e) => update(key, e.target.value)} {...extra} />;
  const status = application && STATUS[application.status];

  return <main className="registration-page">
    <header className="registration-topbar">
      <Link to="/" className="registration-brand"><span className="registration-brand-mark material-icons" aria-hidden="true">spa</span>MindBridge<span className="registration-brand-divider" />Your care starts here</Link>
      <button type="button" className="registration-text-button" onClick={async () => { await logout(); navigate('/login'); }}>Sign out <span aria-hidden="true">↗</span></button>
    </header>
    <div className="registration-intro">
      <span className="registration-eyebrow">A SMALL STEP TOWARDS FEELING BETTER</span>
      <h1>Let’s get to know you.</h1>
      <p>A few details to help us create a support space that feels right for you.</p>
    </div>
    {loading ? <div className="registration-status" role="status">Preparing your registration…</div> : loadFailed ?
      <div className="registration-status"><p role="alert">{error}</p><button className="primary-button" onClick={load}>Try again</button></div> :
      status && !editing ? <section className="registration-status">
        <span className="material-icons registration-status-icon" aria-hidden="true">{status.icon}</span>
        <span className="registration-pill">{status.label}</span>
        <h2>{status.title}</h2><p>{status.copy}</p>
        <p className="registration-reference">Submitted {new Date(application.submittedAt).toLocaleDateString()} · Reference {application.userId.slice(-8).toUpperCase()}</p>
        {application.reviewNote && <div className="registration-review-note"><strong>Message from the review team</strong><p>{application.reviewNote}</p></div>}
        <div className="registration-status-actions">
          {application.status === 'approved' ? <button className="primary-button" onClick={async () => { await refreshUser(); navigate('/patient/dashboard'); }}>Open my dashboard <span aria-hidden="true">→</span></button> :
            ['needs_information', 'declined'].includes(application.status) ? <button className="primary-button" onClick={() => { setEditing(true); setStep(0); }}>Update my application</button> : null}
          <button className="registration-secondary" onClick={load}>Refresh status</button>
        </div>
        {error && <p role="alert">{error}</p>}
        <p className="registration-footnote">Review is administrative, not a diagnosis. This page is not monitored for emergency requests.</p>
      </section> : <div className="registration-layout">
        <aside className="registration-sidebar">
          <div className="registration-step-heading">YOUR REGISTRATION <span>{step + 1} / 4</span></div>
          <ol className="registration-steps">
            {STEPS.map((item, index) => <li key={item.title} aria-current={step === index ? 'step' : undefined} className={step === index ? 'is-current' : index < step ? 'is-complete' : ''}>
              <span className="registration-step-icon material-icons" aria-hidden="true">{index < step ? 'check' : item.icon}</span>
              <div><strong>{item.title}</strong><small>{item.description}</small></div>
            </li>)}
          </ol>
          <div className="registration-reassurance"><span className="material-icons" aria-hidden="true">lock_outline</span><h3>Your story stays yours.</h3><p>Admins review registration details. Optional health context is kept out of their review queue.</p></div>
          <p className="registration-demo-note">University prototype · Ages 18+<br />Please use fictional information for demonstrations.</p>
        </aside>
        <form ref={formRef} onSubmit={submit} className="registration-form">
          <div className="registration-form-eyebrow">STEP 0{step + 1}<span>{step === 1 ? 'Optional care context' : 'Patient registration'}</span></div>
          <h2 tabIndex="-1" ref={headingRef}>{['First, the basics.', 'Your experience matters.', 'Choose how we connect.', 'One last look.'][step]}</h2>
          <p className="registration-subtitle">{['Tell us what to call you and how to reach you. Fields marked optional can be left blank.', 'You do not need a diagnosis or a previous doctor’s report to register.', 'Choose your preferences. Adding a trusted person does not give them access to your records.', 'Check your details and read the notes below before sending your application.'][step]}</p>
          <fieldset disabled={saving} className="registration-fields">
            {step === 0 && <>
              <div className="registration-field-grid"><Field label="Full name">{textInput('name', { required: true, minLength: 2, maxLength: 120, autoComplete: 'name', placeholder: 'Your full name' })}</Field><Field label="Preferred name" optional>{textInput('preferredName', { maxLength: 80, autoComplete: 'nickname', placeholder: 'What should we call you?' })}</Field></div>
              <div className="registration-field-grid"><Field label="Date of birth">{textInput('dateOfBirth', { type: 'date', required: true, min: '1900-01-01', max: new Date().toISOString().slice(0, 10), autoComplete: 'bday' })}</Field><Field label="Gender" optional><select value={form.gender} onChange={(e) => update('gender', e.target.value)}><option value="">Select an option</option>{['Woman', 'Man', 'Non-binary', 'Prefer not to say'].map((value) => <option key={value}>{value}</option>)}</select></Field></div>
              <div className="registration-field-grid"><Field label="Contact number">{textInput('phone', { type: 'tel', required: true, maxLength: 25, autoComplete: 'tel', placeholder: '+94 7X XXX XXXX' })}</Field><Field label="Preferred language"><select value={form.language} onChange={(e) => update('language', e.target.value)}>{['English', 'Sinhala', 'Tamil'].map((value) => <option key={value}>{value}</option>)}</select></Field></div>
              <div className="registration-field-grid"><Field label="Email address"><input type="email" value={user?.email || ''} readOnly aria-describedby="registration-email-note" /></Field><Field label="City / town" optional>{textInput('city', { maxLength: 120, autoComplete: 'address-level2', placeholder: 'Your city or town' })}</Field></div>
              <p id="registration-email-note" className="registration-footnote">Your email comes from your account. Contact verification is not part of this prototype yet.</p>
            </>}
            {step === 1 && <>
              <fieldset className="registration-choice-group"><legend>Have you previously met a mental-health professional?</legend>
                {[['yes', 'Yes, I have', 'I have received professional support before.'], ['no', 'This is my first step', 'I am exploring support for the first time.'], ['prefer-not-to-say', 'Prefer not to say', 'I would rather discuss this with my clinician.']].map(([value, title, copy]) => <label key={value} className={`registration-choice ${form.previousCare === value ? 'is-selected' : ''}`}><input type="radio" name="previousCare" value={value} checked={form.previousCare === value} onChange={() => update('previousCare', value)} /><span><strong>{title}</strong><small>{copy}</small></span></label>)}
              </fieldset>
              <Field label="Anything you would like to share?" optional><textarea rows="5" maxLength={2000} value={form.careContext} onChange={(e) => update('careContext', e.target.value)} placeholder="Share only what you feel comfortable sharing. You can also leave this blank." /></Field>
              <div className="registration-inline-note"><span className="material-icons" aria-hidden="true">description</span><p>No documents are required for registration. Medical-report uploads will be added in a separate secure records feature.</p></div>
            </>}
            {step === 2 && <>
              <label className="registration-choice"><input type="checkbox" checked={form.emailReminders} onChange={(e) => update('emailReminders', e.target.checked)} /><span><strong>Appointment email reminders</strong><small>Save my preference for reminders when the email service is enabled. No emails are sent by this registration feature yet.</small></span></label>
              <div className="registration-section-heading"><h3>A trusted contact</h3><span className="registration-pill">Optional</span></div>
              <p className="registration-footnote">Add someone you feel safe contacting. We will not contact them automatically or share your medical information.</p>
              <Field label="Contact’s name" optional>{textInput('contactName', { maxLength: 120, placeholder: 'Full name' })}</Field>
              <div className="registration-field-grid"><Field label="Relationship" optional>{textInput('contactRelationship', { maxLength: 80, placeholder: 'For example, friend or sibling' })}</Field><Field label="Contact’s phone" optional>{textInput('contactPhone', { type: 'tel', maxLength: 25, placeholder: '+94 7X XXX XXXX' })}</Field></div>
            </>}
            {step === 3 && <>
              <div className="registration-summary"><div><h3>Your registration details</h3><button type="button" className="registration-text-button" onClick={() => setStep(0)}>Edit details</button></div><dl>{[['Full name', form.name], ['Date of birth', form.dateOfBirth], ['Contact number', form.phone], ['Language', form.language], ['Email reminders', form.emailReminders ? 'Requested' : 'Not requested'], ['Trusted contact', form.contactName || 'Not added']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div>
              <div className="registration-privacy-note"><h3>How your information is used</h3><p>Your registration details are stored to process your application. Administrators see identity and contact details for administrative review, but not your optional care context or trusted-contact details. This submission does not authorize treatment, family notifications, AI processing, or research use.</p><p>This university prototype has no automated emergency response. Use fictional data for demonstrations.</p></div>
              <label className="registration-choice"><input type="checkbox" required checked={form.privacyAccepted} onChange={(e) => update('privacyAccepted', e.target.checked)} /><span><strong>I have read how my registration information is used.</strong><small>I agree to submit these details for registration review.</small></span></label>
              <label className="registration-choice"><input type="checkbox" required checked={form.supportAcknowledged} onChange={(e) => update('supportAcknowledged', e.target.checked)} /><span><strong>I understand the limits of this service.</strong><small>MindBridge does not provide an emergency response or replace professional diagnosis and treatment.</small></span></label>
            </>}
          </fieldset>
          {error && <div className="registration-error" role="alert">{error}</div>}
          <footer className="registration-form-footer"><span className="registration-footnote">{step === 3 ? 'You can check your status after submitting.' : 'Your details are saved when you submit.'}</span><div>{step > 0 && <button type="button" disabled={saving} className="registration-secondary" onClick={() => { setError(''); setStep(step - 1); }}>Back</button>}<button type="submit" disabled={saving} className="primary-button">{saving ? 'Submitting…' : step === 3 ? 'Submit registration' : 'Continue'} {!saving && <span aria-hidden="true">→</span>}</button></div></footer>
        </form>
      </div>}
    <footer className="registration-bottom"><span className="material-icons" aria-hidden="true">favorite_border</span> A little support. A step forward. At your pace.</footer>
  </main>;
}
