import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/apiClient';

export default function RegistrationEmailStatus() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true); setError('');
    try { setJobs((await apiRequest('/api/registration/email-jobs')).jobs); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  useEffect(() => { load(); }, []);
  async function retry(id) {
    setBusy(true); setError('');
    try { await apiRequest(`/api/registration/email-jobs/${id}/retry`, { method: 'POST' }); await load(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <details className="mt-6 rounded-xl border p-4"><summary>Registration email delivery</summary>
    <p className="text-sm mt-3">Latest 25 notifications. “Sent” means accepted by the email server, not confirmed inbox delivery.</p>
    <button type="button" className="registration-text-button" onClick={load} disabled={busy}>Refresh delivery status</button>
    {error && <p role="alert">{error}</p>}
    <ul className="space-y-3 mt-3">{jobs.map((job) => <li key={job.id} className="text-sm border-b pb-2">
      {job.audience} · {job.event.replaceAll('_', ' ')} · <strong>{job.status}</strong> · {job.attempts} attempts
      <small className="block">{new Date(job.created_at).toLocaleString()}</small>
      {job.status === 'failed' && <button type="button" disabled={busy} onClick={() => retry(job.id)}>Retry email</button>}
    </li>)}</ul>
    {!busy && !jobs.length && <p>No notifications yet.</p>}
  </details>;
}
