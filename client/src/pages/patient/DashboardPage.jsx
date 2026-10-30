import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardEmpty, DashboardHeading, DashboardIcon, DashboardMetric } from '../../components/dashboard/DashboardShell';
import { getDashboardData } from '../../services/patientService';
import './dashboard.css';

const features = [
  ['AI chat', 'Make room for what’s on your mind.', '/patient/chat', 'chat_bubble_outline'],
  ['Take an assessment', 'Check in and explore your next step.', '/patient/assessments', 'psychology'],
  ['Explore activities', 'A little breathing, grounding, or reflection.', '/patient/activities', 'self_improvement'],
  ['Your community', 'Share experiences and find encouragement.', '/patient/community', 'diversity_3'],
  ['Find a professional', 'Explore doctors, counsellors, and psychologists.', '/patient/doctors', 'medical_services'],
  ['Your appointments', 'Follow requests and confirmed appointments.', '/patient/appointments', 'event_available'],
];
export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async signal => {
    setLoading(true); setError('');
    try { const response = await getDashboardData({ signal }); if (!signal?.aborted) setData(response); }
    catch (e) { if (!signal?.aborted) setError(e.message); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);
  const assessment = data?.latestAssessment;
  return <>
    <DashboardHeading eyebrow="Your wellbeing, at your pace" title="Your support hub" description={`Welcome back${user?.name ? ', ' + user.name.split(' ')[0] : ''}. A little space to check in, connect, and take your next step.`} actions={<Link className="mb-button mb-button--primary" to="/patient/chat"><DashboardIcon name="add" />Start a conversation</Link>} />
    {error && <div className="mb-error" role="alert"><span>{error}</span><button className="mb-button" onClick={() => load()}>Try again</button></div>}
    <div className="mb-metrics" aria-busy={loading}>
      <DashboardMetric icon="self_improvement" label="Activities to explore" value={loading ? '…' : data?.activityCount} hint="A few minutes for yourself" href="/patient/activities" />
      <DashboardMetric icon="event_available" label="Upcoming appointments" value={loading ? '…' : data?.upcomingAppointments?.length} hint="Your next confirmed appointments" href="/patient/appointments" />
      <DashboardMetric icon="medical_services" label="Professionals to explore" value={loading ? '…' : data?.doctorCount} hint="Find the right support for you" href="/patient/doctors" />
    </div>
    <section className="patient-welcome-panel"><div><p className="mb-eyebrow">A moment for you</p><h2>Small steps.<br />Meaningful progress.</h2><p>You don’t have to have it all figured out.<br />Start with how you’re feeling today.</p><Link to="/patient/assessments" className="mb-button mb-button--primary">Check in with yourself <DashboardIcon name="arrow_forward" /></Link></div><div className="patient-welcome-symbol" aria-hidden="true"><DashboardIcon name="spa" /></div></section>
    <section className="patient-tools" aria-labelledby="patient-tools-title"><div className="mb-panel-heading"><div><h2 id="patient-tools-title">What would support you today?</h2><p>Choose a place to begin.</p></div></div><div className="patient-feature-grid">{features.map(([title,description,href,icon]) => <Link className="patient-feature" key={href} to={href}><span className="patient-feature-icon"><DashboardIcon name={icon} /></span><div><h3>{title}</h3><p>{description}</p></div><DashboardIcon name="arrow_outward" /></Link>)}</div></section>
    <div className="mb-two-columns">
      <section className="mb-panel"><div className="mb-panel-heading"><div><h2>Your latest check-in</h2><p>A little perspective on your wellbeing.</p></div><span className="patient-feature-icon"><DashboardIcon name="psychology" /></span></div>
        {loading ? <p className="mb-loading" role="status">Loading your assessment…</p> : error && !data ? <p className="mb-loading">Your assessment is unavailable while dashboard data cannot be loaded.</p> : assessment ? <div className="patient-assessment"><span className="mb-status">{assessment.classification} support recommendation</span><p>{assessment.recommendation}</p><Link className="mb-button" to={`/patient/assessments/${assessment._id}`}>Review your result <DashboardIcon name="arrow_forward" /></Link></div> : <DashboardEmpty icon="psychology" title="Start with a check-in" action={<Link className="mb-button" to="/patient/assessments">Take an assessment <DashboardIcon name="arrow_forward" /></Link>}>A short assessment can help you reflect and explore the support that fits.</DashboardEmpty>}
      </section>
      <section className="mb-panel"><div className="mb-panel-heading"><div><h2>Coming up</h2><p>Your next confirmed appointments.</p></div><Link className="mb-button mb-button--text" to="/patient/appointments">View all <DashboardIcon name="arrow_forward" /></Link></div>
        {loading ? <p className="mb-loading" role="status">Loading appointments…</p> : error && !data ? <p className="mb-loading">Appointments could not be loaded.</p> : data?.upcomingAppointments?.length ? <div className="patient-appointments">{data.upcomingAppointments.map(a => <Link to="/patient/appointments" className="patient-appointment" key={a._id}><span className="patient-feature-icon"><DashboardIcon name="event_available" /></span><div><strong>{a.doctorName}</strong><p>{a.date} · {a.time}</p><span className="mb-status mb-status--confirmed">Confirmed</span></div><DashboardIcon name="chevron_right" /></Link>)}</div> : <DashboardEmpty icon="event_available" title="A little space in your calendar" action={<Link className="mb-button" to="/patient/doctors">Explore professionals</Link>}>Your confirmed appointments will appear here when you’re ready to connect.</DashboardEmpty>}
      </section>
    </div>
    {data?.communityHighlights?.length > 0 && <section className="mb-panel"><div className="mb-panel-heading"><div><h2>Around the community</h2><p>A shared space for everyday experiences.</p></div><Link className="mb-button mb-button--text" to="/patient/community">Visit community <DashboardIcon name="arrow_forward" /></Link></div><div className="patient-community-highlights">{data.communityHighlights.map(post => <Link to={`/patient/community/${post._id}`} key={post._id}><span className="patient-community-avatar"><DashboardIcon name="person_outline" /></span><div><strong>{post.name || 'Community member'}</strong><p>{post.caption}</p></div><DashboardIcon name="arrow_outward" /></Link>)}</div></section>}
  </>;
}
