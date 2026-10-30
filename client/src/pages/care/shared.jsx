import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BrandLogo from "../../components/BrandLogo.jsx";
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/apiClient';
import DashboardShell, { DashboardEmpty, DashboardHeading, DashboardIcon, DashboardMetric } from '../../components/dashboard/DashboardShell';
import './care.css';

export const api = (path,method='GET',body) => apiRequest('/api/care'+path,{method,...(body ? {body} : {})});
export const stamp = value => new Date(value).toLocaleString();
export function SlotTime({slot}) {
  return <span>{new Date(slot.starts_at).toLocaleString(undefined,{timeZone:slot.timezone})} – {new Date(slot.ends_at).toLocaleTimeString(undefined,{timeZone:slot.timezone,hour:'2-digit',minute:'2-digit'})} ({slot.timezone})</span>;
}
export function Demo({value}) { return value ? <p className="care-demo">Demonstration only — this is not a real medical appointment.</p> : null; }
export function Field({label,value,onChange,type='text',required=true,maxLength=250,...rest}) {
  return <label className="care-field"><span>{label}</span><input type={type} required={required} maxLength={maxLength} value={value ?? ''} onChange={event => onChange(event.target.value)} {...rest} /></label>;
}
export function Shell({title,children,className=""}){
  const {logout}=useAuth();
  return <div className={"care-workspace "+className}><header className="care-top"><Link to="/" aria-label="MindBridge home"><BrandLogo/></Link><div><Link to="/start">My workspace</Link><button onClick={logout}>Sign out</button></div></header><main className="care-main"><span className="care-eyebrow">YOUR CARE CONNECTIONS</span><h1>{title}</h1>{children}</main></div>;
}
export function useCareLoad(loader) {
  const loaderRef = useRef(loader);
  const [data,setData] = useState(null), [error,setError] = useState(''), [busy,setBusy] = useState(true);
  useEffect(() => { loaderRef.current = loader; });
  const reload = useCallback(async () => {
    setBusy(true);
    try { setData(await loaderRef.current()); setError(''); }
    catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  async function act(fn) {
    setBusy(true); setError('');
    try { await fn(); await reload(); }
    catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return { data,error,busy,reload,act };
}
export function Feedback({error,busy,reload}) {
  return <>{error && <div role="alert" className="care-error"><span>{error}</span>{reload && <button className="mb-button" onClick={reload}>Try again</button>}</div>}{busy && <p role="status" className="care-loading">Loading your workspace…</p>}</>;
}
export function BookingList({mode='patient'}) {
  const state = useCareLoad(() => api('/bookings'));
  return <BookingBoard mode={mode} state={state} />;
}
const inQueue = (booking,filter) => filter==='all' || (filter==='pending' ? ['pending','proposed'].includes(booking.status) : filter==='history' ? ['completed','cancelled','declined','expired','no_show'].includes(booking.status) : booking.status===filter);
export function BookingBoard({mode='patient',state,filter='all',title}) {
  const [alternatives,setAlternatives] = useState({}), [choices,setChoices] = useState({}), [search,setSearch] = useState(''), [status,setStatus] = useState('all');
  const action = (booking,action,slotId) => state.act(() => api('/bookings/'+booking.id,'PATCH',{action,version:booking.version,slotId}));
  const loadAlternatives = booking => state.act(async () => {
    const slots = await api('/slots/'+booking.professional_id);
    setAlternatives(current => ({...current,[booking.id]:slots.filter(slot => slot.hospital_id===booking.hospital_id)}));
  });
  const rows = state.data?.filter(booking => inQueue(booking,filter) && inQueue(booking,status) && [booking.professional_name,booking.patient_name,booking.hospital_name].some(value => String(value||'').toLowerCase().includes(search.toLowerCase())));
  return <section className="care-bookings"><div className="mb-panel-heading"><div><h2>{title || (mode==='hospital' ? 'Hospital booking requests' : 'Appointments')}</h2><p>Hospitals confirm requests and handle consultation payments.</p></div><button className="mb-button" disabled={state.busy} onClick={state.reload}><DashboardIcon name="refresh" />Refresh</button></div>
    <div className="care-booking-filters"><label className="care-search"><DashboardIcon name="search" /><input type="search" aria-label="Search appointments" placeholder={mode==='patient' ? 'Search professionals or locations' : 'Search patients, professionals, or locations'} value={search} onChange={event => setSearch(event.target.value)} /></label>{filter==='all' && <label className="care-status-filter"><span className="care-sr-only">Appointment status</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option><option value="pending">Needs a response</option><option value="confirmed">Confirmed</option><option value="history">Past decisions</option></select></label>}</div>
    <Feedback {...state} />
    {rows?.length===0 && !state.busy && !state.error && <div className="mb-panel"><DashboardEmpty icon="event_available" title={search || status!=='all' ? 'No matching appointments' : 'No appointments in this view'}>{search || status!=='all' ? 'Try a different search or status.' : 'Appointment requests will appear here when they are received.'}</DashboardEmpty></div>}
    <div className="care-list">{rows?.map(booking => <article className="care-card care-booking" key={booking.id}>
      <div className="care-heading"><div className="care-booking-person"><span className="care-session-icon"><DashboardIcon name={mode==='patient' ? 'medical_services' : 'person_outline'} /></span><div><p className="care-booking-label">{mode==='patient' ? 'Your professional' : 'Patient'}</p><h3>{mode==='patient' ? booking.professional_name : booking.patient_name}</h3>{mode!=='patient' && <p>{booking.professional_name}</p>}</div></div><span className={`mb-status mb-status--${booking.status}`}>{booking.status.replaceAll('_',' ')}</span></div>
      <div className="care-booking-details"><div><span><DashboardIcon name="calendar_month" />Appointment time</span><strong><SlotTime slot={booking} /></strong></div><div><span><DashboardIcon name="local_hospital" />Location</span><strong>{booking.hospital_name}</strong></div><div><span><DashboardIcon name="payments" />Consultation fee</span><strong>{booking.fee}</strong></div></div>
      {booking.demo && <Demo value />}
      {mode==='hospital' && <p className="care-help">Patient contact: {booking.patient_email}</p>}
      {['pending','proposed'].includes(booking.status) && <p className="care-request-note"><DashboardIcon name="schedule" /><span>Respond before {stamp(booking.expires_at)}. This appointment is not confirmed.</span></p>}
      <details><summary>Location, payment and instructions</summary><div className="care-instructions"><p>{booking.address}</p><p>{booking.payment_instructions}</p><p>{booking.arrival_instructions}</p><p>{booking.cancellation_instructions}</p><p>Hospital contact: {booking.public_phone}</p><small>Reference: {booking.id}</small></div></details>
      <div className="care-actions">
        {mode==='hospital' && booking.status==='pending' && <button className="mb-button mb-button--primary" disabled={state.busy} onClick={() => action(booking,'confirm')}><DashboardIcon name="check" />Confirm request</button>}
        {mode==='hospital' && ['pending','proposed'].includes(booking.status) && <><button className="mb-button" disabled={state.busy} onClick={() => loadAlternatives(booking)}>Suggest another slot</button><button className="mb-button mb-button--danger" disabled={state.busy} onClick={() => action(booking,'decline')}>Decline</button></>}
        {mode==='patient' && booking.status==='proposed' && <button className="mb-button mb-button--primary" disabled={state.busy} onClick={() => action(booking,'accept')}>Accept proposed time</button>}
        {['patient','hospital'].includes(mode) && ['pending','proposed','confirmed'].includes(booking.status) && new Date(booking.starts_at)>new Date() && <button className="mb-button" disabled={state.busy} onClick={() => { if(window.confirm('Cancel this appointment request?')) action(booking,'cancel'); }}>Cancel</button>}
        {mode==='hospital' && booking.status==='confirmed' && new Date(booking.ends_at)<=new Date() && <><button className="mb-button mb-button--primary" disabled={state.busy} onClick={() => action(booking,'complete')}>Mark completed</button><button className="mb-button" disabled={state.busy} onClick={() => action(booking,'no_show')}>Mark not attended</button></>}
      </div>
      {alternatives[booking.id] && ['pending','proposed'].includes(booking.status) && <div className="care-alternative"><label className="care-field"><span>Alternative slot</span><select value={choices[booking.id] || ''} onChange={event => setChoices({...choices,[booking.id]:event.target.value})}><option value="">Select an available slot</option>{alternatives[booking.id].map(slot => <option key={slot.id} value={slot.id}>{stamp(slot.starts_at)} — {slot.fee}</option>)}</select></label><button className="mb-button mb-button--primary" disabled={state.busy || !choices[booking.id]} onClick={() => action(booking,'propose',choices[booking.id])}>Send proposal</button>{!alternatives[booking.id].length && <p>No alternatives available. Ask the professional to add a slot.</p>}</div>}
    </article>)}</div>
    <p className="care-help care-booking-footnote">Email delivery does not confirm an appointment. Consultations and payments are arranged with the hospital.</p>
  </section>;
}
export function HospitalDashboard() {
  const [params,setParams] = useSearchParams();
  const views = [['overview','Overview','space_dashboard'],['pending','Requests to review','inbox'],['confirmed','Confirmed appointments','event_available'],['history','Past decisions','history']];
  const view = views.some(([key]) => key===params.get('view')) ? params.get('view') : 'overview';
  const navigate = next => { const query = new URLSearchParams(params); query.set('view',next); setParams(query); };
  const state = useCareLoad(() => api('/bookings'));
  const count = filter => state.data ? state.data.filter(item => inQueue(item,filter)).length : null;
  return <DashboardShell roleLabel="Hospital booking desk" title={views.find(([key]) => key===view)[1]} navigation={views.map(([key,label,icon]) => ({label,icon,active:key===view,onClick:() => navigate(key),count:key==='pending' ? count('pending') : undefined}))}
    sidebarNote={<><strong>A clear path to care.</strong>Confirm requests, coordinate appointment times, and keep patients informed.</>}>
    <DashboardHeading eyebrow="Your hospital, connected" title={view==='overview' ? 'Hospital booking desk' : views.find(([key]) => key===view)[1]} description="Coordinate appointment requests for your assigned hospital. Every decision stays connected to the patient and professional." actions={<button className="mb-button" disabled={state.busy} onClick={state.reload}><DashboardIcon name="refresh" />Refresh bookings</button>} />
    {view==='overview' && <><div className="mb-metrics"><DashboardMetric icon="inbox" label="Requests to review" value={state.busy ? '…' : count('pending')} hint="Pending requests and proposed times" onClick={() => navigate('pending')} /><DashboardMetric icon="event_available" label="Confirmed appointments" value={state.busy ? '…' : count('confirmed')} hint="Accepted appointment bookings" onClick={() => navigate('confirmed')} /><DashboardMetric icon="task_alt" label="Completed sessions" value={state.busy ? '…' : state.data?.filter(item => item.status==='completed').length} hint="Recorded completed appointments" onClick={() => navigate('history')} /></div><div className="care-queue-note"><span className="care-session-icon"><DashboardIcon name="fact_check" /></span><div><strong>A little coordination makes a difference.</strong><p>Check the allocated time and location before confirming. You can suggest another slot when plans change.</p></div></div></>}
    <BookingBoard mode="hospital" state={state} filter={view==='overview' ? 'pending' : view} title={view==='overview' ? 'Needs your attention' : undefined} />
  </DashboardShell>;
}
