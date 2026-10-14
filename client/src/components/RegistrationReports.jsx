import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/apiClient';
import { apiUrl } from '../config/api';

export default function RegistrationReports({ onBusyChange = () => {} }) {
  const [documents, setDocuments] = useState([]);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function load() {
    setLoading(true); setError('');
    try {
      const result = await apiRequest('/api/registration/documents');
      setDocuments(result.documents); setAvailable(result.uploadsAvailable);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  async function perform(action) {
    setBusy(true); onBusyChange(true); setError(''); setMessage('');
    try { await action(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); onBusyChange(false); }
  }
  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || !/\.(pdf|png|jpe?g)$/i.test(file.name)) {
      setError('Choose a PDF, PNG or JPEG no larger than 5 MB.'); return;
    }
    await perform(async () => {
      const body = new FormData(); body.append('document', file);
      const result = await apiRequest('/api/registration/documents', { method: 'POST', body });
      setDocuments((old) => [result.document, ...old]);
      setMessage('Report securely saved. It has not been clinically verified.');
    });
  }
  async function download(document) {
    await perform(async () => {
      const response = await fetch(apiUrl(`/api/registration/documents/${document.id}`), { credentials: 'include' });
      if (!response.ok) throw new Error('Unable to download this report. Please refresh and try again.');
      const url = URL.createObjectURL(await response.blob());
      const anchor = window.document.createElement('a');
      anchor.href = url; anchor.download = document.filename; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }
  return <section className="registration-summary" aria-label="Optional medical reports">
    <h3>Medical reports <span className="registration-optional">Optional</span></h3>
    <p className="registration-footnote">Keep up to three existing reports here (PDF, PNG or JPEG; 5 MB each). Reports are saved immediately, separately from your application. Only you can download them in this registration flow; they are not shared with admins or the chatbot. You can remove them below.</p>
    <p className="registration-footnote">Patient supplied — not clinically verified. A report is never required to register.</p>
    {loading ? <p role="status">Loading reports…</p> : <>
      {!available && <p role="status">Uploads are currently unavailable. You can still complete registration without a report.</p>}
      <label className="field"><span>Add a report</span><input type="file" accept=".pdf,.png,.jpg,.jpeg" disabled={!available || busy || documents.length >= 3} onChange={upload} /></label>
      <ul>{documents.map((document) => <li key={document.id} className="registration-report-row">
        <span><strong>{document.filename}</strong><small> · {Math.ceil(document.size / 1024)} KB</small></span>
        <span><button type="button" className="registration-text-button" disabled={busy} onClick={() => download(document)}>Download</button>{' '}
          <button type="button" className="registration-text-button" disabled={busy} onClick={() => {
            if (window.confirm('Remove this report from your account?')) perform(async () => {
              await apiRequest(`/api/registration/documents/${document.id}`, { method: 'DELETE' });
              setDocuments((old) => old.filter((item) => item.id !== document.id)); setMessage('Report removed.');
            });
          }}>Remove</button></span>
      </li>)}</ul>
    </>}
    {busy && <p role="status">Processing report securely…</p>}
    {message && <p role="status">{message}</p>}
    {error && <div role="alert"><p>{error}</p><button type="button" disabled={busy} onClick={load}>Reload reports</button></div>}
  </section>;
}
