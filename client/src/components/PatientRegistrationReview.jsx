import { useEffect, useState } from 'react';
import RegistrationReviewHistory from './RegistrationReviewHistory';
import RegistrationEmailStatus from './RegistrationEmailStatus';
import { apiRequest } from '../lib/apiClient';

export default function PatientRegistrationReview({ onReviewed }) {
  const [filter, setFilter] = useState('pending');
  const [offset, setOffset] = useState(0);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [notes, setNotes] = useState({});
  const [message, setMessage] = useState('');
  async function load() {
    setLoading(true); setError('');
    try { setApplications((await apiRequest(`/api/registration/applications?status=${filter}&offset=${offset}`)).applications); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [filter, offset]);
  async function decide(application, status) {
    const note = (notes[application.userId] || "").trim();
    if (status !== "approved" && note.length < 10) { setError("Explain the next step in at least 10 characters before sending this decision."); return; }
    if (!window.confirm(`Confirm ${status.replaceAll("_", " ")} for ${application.details.name}? The patient will be notified.`)) return;
    setBusy(application.userId); setError(''); setMessage('');
    try {
      await apiRequest(`/api/registration/applications/${application.userId}`, {
        method: 'PATCH', body: { status, note: notes[application.userId] || '', version: application.version },
      });
      setMessage('Review saved and an email notification queued. The patient can also see the decision on their registration page.');
      await load();
      onReviewed?.();
    } catch (err) { setError(err.message); }
    finally { setBusy(null); }
  }
  return <section className="w-full max-w-3xl rounded-3xl border border-[var(--color-border)] bg-white p-6 mb-6 shadow-soft">
    <div className="flex flex-wrap justify-between items-center gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">Patient registration</p><h3 className="font-display text-xl font-semibold mt-2">Applications to review</h3></div><button type="button" onClick={load} disabled={loading || Boolean(busy)} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm">Refresh</button></div>
    <p className="text-sm text-[var(--color-text-muted)] leading-7 mt-3">Review administrative eligibility and contact details. Health context and trusted-contact information are excluded. Give a clear, patient-facing explanation when requesting changes or declining.</p>
    <label className="field mt-4"><span>Application status</span><select disabled={loading || Boolean(busy)} value={filter} onChange={(event) => { setOffset(0); setFilter(event.target.value); }}>{[["pending", "Open applications"], ["submitted", "Awaiting review"], ["needs_information", "Waiting for patient"], ["approved", "Approved"], ["declined", "Declined"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    {error && <p role="alert" className="mt-4 rounded-xl bg-[var(--color-danger-soft)] p-3 text-[var(--color-danger)]">{error}</p>}
    {message && <p role="status" className="mt-4 rounded-xl bg-[var(--color-primary-soft)] p-3 text-sm">{message}</p>}
    {loading ? <p role="status" className="mt-5">Loading applications…</p> : applications.length === 0 ? <p className="mt-5 text-sm text-[var(--color-text-muted)]">You’re all caught up. No applications match this filter.</p> : <div className="mt-5 space-y-4">{applications.map((application) => <article key={application.userId} className="rounded-2xl border border-[var(--color-border)] p-5">
      <div className="flex justify-between gap-3 flex-wrap"><h4 className="font-semibold">{application.details.name}</h4><span className="text-xs rounded-full bg-[var(--color-primary-soft)] px-3 py-1">{({ submitted: 'Awaiting review', needs_information: 'Waiting for patient', approved: 'Approved', declined: 'Declined' })[application.status]}</span></div>
      <dl className="grid sm:grid-cols-2 gap-3 text-sm mt-4">{[['Reference', application.userId.slice(-8).toUpperCase()], ['City / town', application.details.city], ['Date of birth', application.details.dateOfBirth], ['Phone', application.details.phone], ['Language', application.details.language], ['Submitted', new Date(application.submittedAt).toLocaleDateString()]].map(([label, value]) => <div key={label}><dt className="text-xs text-[var(--color-text-muted)]">{label}</dt><dd className="mt-1">{value || '—'}</dd></div>)}</dl>
      {application.status === 'submitted' ? <><label className="field mt-4"><span>Message to patient</span><textarea maxLength={1000} rows={3} value={notes[application.userId] || ''} onChange={(e) => setNotes((old) => ({ ...old, [application.userId]: e.target.value }))} placeholder="Explain any missing details or administrative eligibility concerns. Do not include clinical judgments." /></label><p className="text-xs text-[var(--color-text-muted)] mt-2">Required for a request or decline; at least 10 characters.</p><div className="flex flex-wrap gap-2 mt-4"><button type="button" disabled={Boolean(busy)} className="primary-button" onClick={() => decide(application, 'approved')}>{busy === application.userId ? 'Saving…' : 'Approve'}</button><button type="button" disabled={Boolean(busy)} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm" onClick={() => decide(application, 'needs_information')}>Request information</button><button type="button" disabled={Boolean(busy)} className="rounded-xl border border-[var(--color-danger-border)] text-[var(--color-danger)] px-4 py-2 text-sm" onClick={() => decide(application, 'declined')}>Decline</button></div></> : <p className="text-sm text-[var(--color-text-muted)] mt-4 whitespace-pre-wrap">{application.reviewNote}</p>}
      <RegistrationReviewHistory key={`${application.userId}-${application.version}`} userId={application.userId} version={application.version} />
    </article>)}</div>}
    <div className="flex gap-4 mt-4"><button type="button" disabled={loading || Boolean(busy) || offset === 0} onClick={() => setOffset(Math.max(0, offset - 25))}>Previous</button><span>Page {offset / 25 + 1}</span><button type="button" disabled={loading || Boolean(busy) || applications.length < 25} onClick={() => setOffset(offset + 25)}>Next</button></div>
    <RegistrationEmailStatus />
  </section>;
}
