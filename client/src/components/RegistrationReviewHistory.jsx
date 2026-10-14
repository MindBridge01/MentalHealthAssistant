import { useState } from 'react';
import { apiRequest } from '../lib/apiClient';

export default function RegistrationReviewHistory({ userId, version }) {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true); setError('');
    try { setEvents((await apiRequest(`/api/registration/applications/${encodeURIComponent(userId)}/history`)).events); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <details className="mt-4 border-t pt-3" onToggle={(event) => { if (event.currentTarget.open) load(); }}>
    <summary className="cursor-pointer text-sm">Review history · current version {version}</summary>
    {busy && <p role="status">Loading history…</p>}
    {error && <p role="alert">{error} <button type="button" onClick={load}>Retry</button></p>}
    {!busy && events && <ol className="space-y-3 mt-3">{events.map((event) => <li key={event.version} className="text-sm">
      <strong>{event.status.replaceAll('_', ' ')}</strong> · version {event.version}
      <p>{event.actor} · {new Date(event.at).toLocaleString()}</p>
      {event.note && <p className="whitespace-pre-wrap">{event.note}</p>}
    </li>)}</ol>}
  </details>;
}
