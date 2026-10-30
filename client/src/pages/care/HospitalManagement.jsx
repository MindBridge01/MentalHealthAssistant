import React, { useState } from 'react';
import { api, Field, Feedback, useCareLoad, Demo, BookingList } from './shared';

const blank = {
  name: '',
  address: '',
  city: '',
  public_phone: '',
  website: '',
  officer_name: '',
  officer_email: '',
  officer_password: '',
  payment_method: 'at_location',
  payment_instructions: 'Pay directly at the hospital. MindBridge does not collect consultation payments.',
  arrival_instructions: '',
  cancellation_instructions: 'Contact the hospital to arrange cancellation.',
  agreement_reference: 'Demo arrangement — no real hospital',
  demo: true,
  active: true,
};

export default function HospitalManagement() {
  const state = useCareLoad(async () => ({
    hospitals: await api('/hospitals'),
    professionals: await api('/professionals'),
    affiliations: await api('/affiliations'),
    invitations: await api('/hospital-officers/invitations'),
  }));

  const [form, setForm] = useState(blank);
  const [id, setId] = useState(null);
  const [chosen, setChosen] = useState({});

  // Officer Invitation Form State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ hospitalId: '', name: '', email: '' });
  const [inviteFeedback, setInviteFeedback] = useState({ busy: false, error: '', success: '', link: '' });

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteFeedback({ busy: true, error: '', success: '', link: '' });
    try {
      const res = await api('/hospital-officers/invite', 'POST', inviteForm);
      setInviteFeedback({
        busy: false,
        error: '',
        success: `Invitation email queued for ${res.email}.`,

      });
      setInviteForm({ hospitalId: '', name: '', email: '' });
      state.reload();
    } catch (err) {
      setInviteFeedback({ busy: false, error: err.message, success: '', link: '' });
    }
  };

  const handleRevokeInvite = async (invitationId) => {
    if (!window.confirm('Are you sure you want to revoke this officer invitation?')) return;
    try {
      await api(`/hospital-officers/invitations/${invitationId}/revoke`, 'POST');
      state.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResendInvite = async (invitationId) => {
    try {
      await api(`/hospital-officers/invitations/${invitationId}/resend`, 'POST');
      alert('A new invitation email has been queued. The old link no longer works.');
      state.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="care-main care-embedded">
      <Feedback {...state} />

      {/* Top Banner Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="care-eyebrow">HOSPITALS & CLINICS</span>
          <h2 style={{ margin: '4px 0 0' }}>Medical centres & staff invitations</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--mb-muted)', fontSize: '14px' }}>
            Manage affiliated partner hospitals and securely invite dedicated booking officers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setInviteModalOpen(!inviteModalOpen);
            setInviteFeedback({ busy: false, error: '', success: '', link: '' });
          }}
          style={{ background: 'var(--mb-primary)', borderColor: 'var(--mb-primary)', fontWeight: '600' }}
        >
          {inviteModalOpen ? 'Close Invitation Panel' : '+ Invite Booking Officer'}
        </button>
      </div>

      {/* Officer Invitation Panel */}
      {inviteModalOpen && (
        <section className="care-card" style={{ borderColor: 'var(--mb-primary)', background: 'var(--mb-purple-50)' }}>
          <div className="care-heading">
            <h2 style={{ color: 'var(--mb-purple-600)', margin: 0 }}>Invite Hospital Booking Officer</h2>
            <span className="care-badge" style={{ background: 'var(--mb-purple-100)', color: 'var(--mb-purple-600)' }}>Single-Use Token</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--mb-muted)' }}>
            The officer receives a private invitation by email. The link can be used once and expires in 48 hours.
            The officer sets their own password and must enroll in Multi-Factor Authentication (MFA).
          </p>

          <form onSubmit={handleSendInvite} style={{ marginTop: '16px' }}>
            <div className="care-grid">
              <label className="care-field">
                Assigned Hospital / Centre
                <select
                  required
                  value={inviteForm.hospitalId}
                  onChange={(e) => setInviteForm({ ...inviteForm, hospitalId: e.target.value })}
                >
                  <option value="">Select hospital</option>
                  {state.data?.hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city})
                    </option>
                  ))}
                </select>
              </label>

              <Field
                label="Officer Full Name"
                required
                value={inviteForm.name}
                placeholder="e.g. Eleanor Vance"
                onChange={(v) => setInviteForm({ ...inviteForm, name: v })}
              />

              <Field
                label="Work Email Address"
                type="email"
                required
                value={inviteForm.email}
                placeholder="e.g. bookings@hospital.org"
                onChange={(v) => setInviteForm({ ...inviteForm, email: v })}
              />
            </div>

            {inviteFeedback.error && (
              <p className="care-error" style={{ margin: '14px 0' }}>
                {inviteFeedback.error}
              </p>
            )}

            {inviteFeedback.success && (
              <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '10px', padding: '14px', margin: '14px 0', color: '#14532d' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 'bold' }}>{inviteFeedback.success}</p>
                <p>The private setup link will be sent to the officer’s email address.</p>
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              <button disabled={inviteFeedback.busy || !inviteForm.hospitalId} type="submit">
                {inviteFeedback.busy ? 'Sending Invitation...' : 'Send Official Invitation'}
              </button>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                style={{ marginLeft: '10px', background: 'var(--mb-line)', color: 'var(--mb-ink)', borderColor: 'var(--mb-line)' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Staff Invitations Ledger */}
      {state.data?.invitations && state.data.invitations.length > 0 && (
        <section className="care-card">
          <div className="care-heading">
            <h2>Hospital Officer Invitations</h2>
            <span style={{ fontSize: '13px', color: 'var(--mb-subtle)' }}>
              {state.data.invitations.length} invitation(s) tracked
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--mb-subtle)' }}>
            Officer invitations are single-use. Once accepted, access is linked to the assigned hospital.
          </p>

          <div style={{ overflowX: 'auto', marginTop: '14px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--mb-line)', color: 'var(--mb-muted)' }}>
                  <th style={{ padding: '10px 8px' }}>Staff Name</th>
                  <th style={{ padding: '10px 8px' }}>Work Email</th>
                  <th style={{ padding: '10px 8px' }}>Assigned Hospital</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                  <th style={{ padding: '10px 8px' }}>Expires</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.data.invitations.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--mb-purple-50)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: '500' }}>{inv.name}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--mb-subtle)' }}>{inv.email}</td>
                    <td style={{ padding: '12px 8px' }}>{inv.hospital_name}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span
                        className="care-badge"
                        style={{
                          background:
                            inv.status === 'accepted'
                              ? '#dcfce7'
                              : inv.status === 'revoked'
                              ? '#fee2e2'
                              : '#fef3c7',
                          color:
                            inv.status === 'accepted'
                              ? '#166534'
                              : inv.status === 'revoked'
                              ? '#991b1b'
                              : '#92400e',
                        }}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--mb-subtle)' }}>
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      {inv.status === 'pending' && (
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleResendInvite(inv.id)}
                            style={{ fontSize: '11px', padding: '6px 10px', background: 'var(--mb-purple-50)', color: 'var(--mb-purple-600)', borderColor: 'var(--mb-purple-600)' }}
                          >
                            Resend
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokeInvite(inv.id)}
                            style={{ fontSize: '11px', padding: '6px 10px', background: '#fff1f2', color: '#be123c', borderColor: '#fecdd3' }}
                          >
                            Revoke
                          </button>
                        </div>
                      )}
                      {inv.status === 'accepted' && (
                        <span style={{ fontSize: '12px', color: '#16a34a' }}>✓ Activated</span>
                      )}
                      {inv.status === 'revoked' && (
                        <span style={{ fontSize: '12px', color: 'var(--mb-subtle)' }}>Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Hospital Add / Edit Form */}
      <form
        className="care-card"
        onSubmit={(e) => {
          e.preventDefault();
          state.act(async () => {
            await api('/hospitals' + (id ? '/' + id : ''), id ? 'PUT' : 'POST', form);
            setId(null);
            setForm(blank);
          });
        }}
      >
        <h2>{id ? 'Edit hospital' : 'Add hospital or medical centre'}</h2>
        <p>
          For demonstrations, use fictional details and a team-controlled booking email. Agreements are verified offline.
        </p>

        <div className="care-grid">
          {[
            ['name', 'Hospital / centre name'],
            ['address', 'Address'],
            ['city', 'City'],
            ['public_phone', 'Public booking phone'],
            ['website', 'Official HTTPS website'],


            ['agreement_reference', 'Offline agreement / demo reference'],
          ].map(([k, label]) => (
            <Field
              key={k}
              label={label}
              value={form[k]}
              required={k !== 'website'}
              type={k === 'officer_email' ? 'email' : 'text'}
              onChange={(v) => setForm({ ...form, [k]: v })}
            />
          ))}



          <label className="care-field">
            Payment arrangement
            <select
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
            >
              <option value="at_location">Pay at hospital / clinic</option>
              <option value="contact_provider">Contact provider to arrange external payment</option>
            </select>
          </label>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--mb-subtle)' }}>
          💡 Tip: Recommended workflow is creating the hospital and inviting the officer via the <strong>Invite Booking Officer</strong> panel above.
        </p>

        {[
          ['payment_instructions', 'Payment instructions'],
          ['arrival_instructions', 'Arrival instructions'],
          ['cancellation_instructions', 'Cancellation instructions'],
        ].map(([k, label]) => (
          <label className="care-field" key={k}>
            {label}
            <textarea
              required={k === 'payment_instructions'}
              maxLength={1500}
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            />
          </label>
        ))}

        <label className="care-check">
          <input
            type="checkbox"
            checked={form.demo}
            onChange={(e) => setForm({ ...form, demo: e.target.checked })}
          />
          Demo organisation — label all booking emails
        </label>

        <label className="care-check">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Active
        </label>

        <button disabled={state.busy}>Save hospital</button>
        {id && (
          <button
            type="button"
            onClick={() => {
              setId(null);
              setForm(blank);
            }}
          >
            Cancel editing
          </button>
        )}
      </form>

      {/* Hospital List and Affiliations */}
      {state.data?.hospitals.map((h) => (
        <section className="care-card" key={h.id}>
          <div className="care-heading">
            <h2>{h.name}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setInviteForm({ hospitalId: h.id, name: '', email: '' });
                  setInviteModalOpen(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{ background: 'var(--mb-purple-600)', borderColor: 'var(--mb-purple-600)', fontSize: '13px' }}
              >
                + Invite Officer
              </button>
              <button
                type="button"
                onClick={() => {
                  setId(h.id);
                  setForm({ ...h, officer_password: '' });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Edit
              </button>
            </div>
          </div>

          <Demo value={h.demo} />
          <p>
            {h.address} · {h.public_phone} · {h.active ? 'Active' : 'Inactive'}
          </p>
          <p>
            Booking officer: <strong>{h.officer_name}</strong> ({h.officer_email})
          </p>
          <p>Agreement reference: {h.agreement_reference}</p>

          <h3>Linked professionals</h3>
          {state.data.affiliations
            .filter((a) => a.hospital_id === h.id)
            .map((a) => (
              <div className="care-slot" key={a.professional_id}>
                <span>
                  {state.data.professionals.find((p) => p.id === a.professional_id)?.name || a.professional_id} ·{' '}
                  {a.active ? 'Active' : 'Inactive'}
                </span>
                <button
                  disabled={state.busy}
                  onClick={() =>
                    state.act(() =>
                      api('/hospitals/' + h.id + '/affiliations', 'PUT', {
                        professionalId: a.professional_id,
                        active: !a.active,
                      })
                    )
                  }
                >
                  {a.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}

          <div className="care-actions">
            <label>
              Verified professional
              <select
                value={chosen[h.id] || ''}
                onChange={(e) => setChosen({ ...chosen, [h.id]: e.target.value })}
              >
                <option value="">Select approved professional</option>
                {state.data.professionals.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name} — {p.profession}
                  </option>
                ))}
              </select>
            </label>
            <button
              disabled={state.busy || !chosen[h.id]}
              onClick={() =>
                state.act(() =>
                  api('/hospitals/' + h.id + '/affiliations', 'PUT', {
                    professionalId: chosen[h.id],
                    active: true,
                  })
                )
              }
            >
              Link verified affiliation
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}

export function CareOperations() {
  const s = useCareLoad(() => api('/email-jobs'));
  return (
    <div className="care-main care-embedded">
      <BookingList mode="admin" />
      <section className="care-card">
        <h2>Appointment email delivery</h2>
        <p>Sent means accepted by SMTP, not proof of inbox delivery. Superseded messages are skipped.</p>
        <button disabled={s.busy} onClick={s.reload}>
          Refresh delivery
        </button>
        <Feedback {...s} />
        {s.data?.map((j) => (
          <div className="care-slot" key={j.id}>
            <div>
              {j.event} · {j.audience} · <strong>{j.status}</strong>
              <small>
                {' '}
                {j.attempts} attempts · {j.booking_id}
              </small>
            </div>
            {j.status === 'failed' && (
              <button disabled={s.busy} onClick={() => s.act(() => api('/email-jobs/' + j.id + '/retry', 'POST'))}>
                Retry
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
