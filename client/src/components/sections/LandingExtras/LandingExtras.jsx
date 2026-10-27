import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import forest from '../../../assets/landing-stock/forest.jpg';
import chatScreen from '../../../assets/product/ai-chat.png';

export function HowItWorks() {
  const steps = [
    ['Create your space', 'Set up your patient account so you can return to your dashboard, appointments, and conversations.'],
    ['Complete your setup', 'Tell us about the support you’re looking for. Professional bookings also require approved patient registration.'],
    ['Choose your next step', 'Start a conversation, explore an activity, connect with the community, or request an appointment.'],
  ];
  return (
    <section id="how-it-works" className="landing-how landing-section" aria-labelledby="landing-how-title">
      <p className="landing-section-label">01 / START WITH YOU</p>
      <div className="landing-section-heading">
        <h2 id="landing-how-title">Get started in three steps.</h2>
        <p>Create an account for saved history and appointments, or try public AI chat first.</p>
      </div>
      <div className="landing-how-photo" aria-hidden="true"><img src={forest} alt="" width="600" height="700" loading="lazy" /></div>
      <ol className="landing-step-grid">
        {steps.map(([title, description], index) => (
          <li className="landing-step" key={title}>
            <span className="landing-step-number">0{index + 1}</span>
            <h3>{title}</h3><p>{description}</p>
          </li>
        ))}
      </ol>
      <p className="landing-how-note">Just want to talk first? <Link to="/ai-chat">Try AI chat without an account <span aria-hidden="true">↗</span></Link></p>
    </section>
  );
}

const tourItems = [
  { id: 'chat', label: 'AI chat', eyebrow: 'PUBLIC AI CHAT', title: 'See the real chat interface.', description: 'This is the public MindBridge chat screen, captured without account or conversation data. You can open it and try it without signing up.', href: '/ai-chat', action: 'Open AI chat' },
  { id: 'appointments', label: 'Professional care', eyebrow: 'PROVIDER-CONFIRMED APPOINTMENTS', title: 'Know the booking process.', description: 'Sign in to review professional profiles, hospital locations, and appointment slots. Approved patient registration is required before requesting an appointment.', href: '/patient/doctors', action: 'Browse professionals' },
  { id: 'dashboard', label: 'Your account', eyebrow: 'YOUR SUPPORT SPACE', title: 'Keep your next steps together.', description: 'After signup and onboarding, your dashboard brings together activities, assessments, saved conversations, and upcoming appointments.', href: '/start', action: 'Open your support space' },
];

function InterfacePreview({ type }) {
  if (type === 'chat') return <figure className="landing-real-capture"><div><img src={chatScreen} alt="Actual public MindBridge AI chat page, showing its introduction and initial assistant message" width="1265" height="712" loading="lazy" /></div><figcaption>Actual product screen · no personal conversation data</figcaption><a href={chatScreen} target="_blank" rel="noopener noreferrer">View the full screenshot ↗</a></figure>;
  const items = type === 'appointments' ? [
    ['Review a professional', 'Check the listed qualification, specialty, languages, and hospital information.'],
    ['Choose an available slot', 'Review the location, fee, payment instructions, and cancellation information.'],
    ['Wait for confirmation', 'Submit a request after registration approval. The hospital confirms the appointment.'],
  ] : [
    ['Activities and assessments', 'Find available self-guided activities and check-ins.'],
    ['Saved conversations', 'Return to conversation history saved while signed in.'],
    ['Appointments', 'Review the status and details of your appointment requests.'],
  ];
  return <div className="landing-workflow-preview"><p>{type === 'appointments' ? 'How appointment requests work' : 'Included in your account'}</p><ol>{items.map(([title, text], index) => <li key={title}><span>0{index + 1}</span><div><h4>{title}</h4><p>{text}</p></div></li>)}</ol><small>{type === 'appointments' ? 'A request is not a confirmed appointment.' : 'Account access requires sign-in and onboarding.'}</small></div>;
}

export function ProductTour() {
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef([]);
  const item = tourItems[selected];
  const onTabKeyDown = (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (selected + 1) % tourItems.length;
    else if (event.key === 'ArrowLeft') next = (selected + tourItems.length - 1) % tourItems.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tourItems.length - 1;
    else return;
    event.preventDefault();
    setSelected(next);
    tabRefs.current[next]?.focus();
  };
  return (
    <section id="inside-mindbridge" className="landing-tour landing-section" aria-labelledby="landing-tour-title">
      <p className="landing-section-label">04 / INSIDE MINDBRIDGE</p>
      <div className="landing-section-heading"><h2 id="landing-tour-title">See the tools before you start.</h2><p>Explore the actual public chat screen and understand what the account and booking features offer.</p></div>
      <div className="landing-tour-tabs" role="tablist" aria-label="Explore MindBridge features" onKeyDown={onTabKeyDown}>
        {tourItems.map((tab, index) => <button key={tab.id} ref={el => { tabRefs.current[index] = el; }} type="button" role="tab" id={`landing-tour-tab-${tab.id}`} aria-controls={`landing-tour-panel-${tab.id}`} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)}>{tab.label}</button>)}
      </div>
      {tourItems.map((tab, index) => <div key={tab.id} id={`landing-tour-panel-${tab.id}`} role="tabpanel" aria-labelledby={`landing-tour-tab-${tab.id}`} hidden={selected !== index} tabIndex={0}>
        {selected === index && <div className="landing-tour-panel" key={item.id}>
          <div className="landing-tour-copy"><span>{item.eyebrow}</span><h3>{item.title}</h3><p>{item.description}</p><Link className="landing-text-link" to={item.href}>{item.action}<span aria-hidden="true">↗</span></Link></div>
          <InterfacePreview type={item.id} />
        </div>}
      </div>)}
    </section>
  );
}

const faqs = [
  ['How do I get started?', <>Create a <Link to="/signup/patient">patient account</Link>, complete the short onboarding steps, and choose what you need from your dashboard. You can also <Link to="/ai-chat">try AI chat</Link> before signing up.</>],
  ['Do I need an account to use MindBridge?', 'You can use public AI chat and the breathing timer without an account. Sign in for your dashboard, saved chat history, and community. Appointment requests also require approved patient registration.'],
  ['Is AI chat the same as talking to a professional?', 'AI chat is an automated tool for reflection, grounding, and supportive next steps. It does not diagnose conditions or replace a consultation with a qualified professional. Professional appointments are a separate part of MindBridge.'],
  ['How do professional appointments work?', <>After signing in and receiving patient registration approval, browse <Link to="/patient/doctors">professionals</Link>, review their profiles and available hospital slots, and send a request. The hospital confirms the appointment. Review the provider’s instructions before attending.</>],
  ['How much does a consultation cost?', 'Consultation fees and payment instructions are shown with the available appointment slots. Payments are handled directly by the provider; MindBridge does not collect consultation payments.'],
  ['Is MindBridge an emergency service?', 'No. AI chat, community posts, and appointment requests do not provide emergency response or continuous clinical monitoring. If there is immediate danger, contact local emergency services or go to the nearest emergency department.'],
  ['What can I do in the community?', 'After signing in, you can share reflections, read others’ posts, and interact through comments, likes, and saved posts. It’s a space for encouragement and connection.'],
];

export function LandingFAQ() {
  return (
    <section id="questions" className="landing-faq landing-section" aria-labelledby="landing-faq-title">
      <p className="landing-section-label">07 / A LITTLE CLARITY</p>
      <div className="landing-section-heading"><h2 id="landing-faq-title">Questions before you start.</h2><p>Get to know MindBridge before taking your next step.</p></div>
      <div className="landing-faq-list">
        {faqs.map(([question, answer], index) => <details className="landing-faq-item" key={question}><summary><span className="landing-faq-number">0{index + 1}</span><h3>{question}</h3><span className="landing-faq-toggle" aria-hidden="true">+</span></summary><div className="landing-faq-answer"><p>{answer}</p></div></details>)}
      </div>
    </section>
  );
}

export function FinalInvite() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="landing-invite landing-section" aria-labelledby="landing-invite-title">
      <p className="landing-section-label">08 / AT YOUR OWN PACE</p>
      <div className="landing-section-heading"><h2 id="landing-invite-title"><em>Your next chapter</em>starts with one step.</h2><p>Try public AI chat without an account, or create an account to access your support space.</p></div>
      <div className="landing-actions"><Link className="landing-button landing-button-primary" to={isAuthenticated ? '/start' : '/signup/patient'}>{isAuthenticated ? 'Open your support space' : 'Get started'}<span aria-hidden="true">↗</span></Link><Link className="landing-button" to="/ai-chat">Start a conversation<span aria-hidden="true">↗</span></Link></div>
      {!isAuthenticated && <p className="landing-invite-login">Already have an account? <Link to="/login">Log in</Link></p>}
    </section>
  );
}

export function EvidenceAndScope() {
  return <section id="service-scope" className="landing-approach landing-section" aria-labelledby="landing-approach-title">
    <p className="landing-section-label">05 / OUR APPROACH AND SERVICE SCOPE</p>
    <div className="landing-section-heading"><h2 id="landing-approach-title">Clear about what each tool offers.</h2><p>Self-guided support, automated conversations, and professional appointments serve different purposes.</p></div>
    <div className="landing-approach-grid">
      <article className="landing-approach-card"><span>01 / SELF-GUIDED ACTIVITIES</span><h3>Practice, without a promise of treatment.</h3><p>Activities offer a place to pause and reflect. The breathing timer introduces a gentle practice; it does not diagnose a condition or reproduce a clinical treatment protocol.</p><a className="landing-text-link" href="https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/" target="_blank" rel="noopener noreferrer">NHS breathing guidance ↗</a></article>
      <article className="landing-approach-card"><span>02 / AI-ASSISTED REFLECTION</span><h3>Automated, with clear limits.</h3><p>AI chat generates responses for reflection and general support. Responses can be wrong or incomplete. Individual clinical decisions belong with a qualified professional.</p><Link className="landing-text-link" to="/ai-chat">See the AI chat introduction ↗</Link></article>
      <article className="landing-approach-card"><span>03 / PROFESSIONAL CARE</span><h3>Review a profile before you book.</h3><p>Published profiles come from approved professional applications and active hospital affiliations. Check the listed qualifications, specialty, languages, and provider instructions before requesting an appointment.</p><Link className="landing-text-link" to="/patient/doctors">Review professional profiles ↗</Link></article>
    </div>
    <aside className="landing-scope-note"><strong>Not an emergency service.</strong><p>AI chat, community posts, and appointment requests do not provide emergency response or continuous clinical monitoring. If there is immediate danger, contact local emergency services or go to the nearest emergency department.</p></aside>
    <p className="landing-evidence-note">Reference reading explains an activity; it is not an endorsement or a clinical evaluation of MindBridge. Research on a technique does not establish the effectiveness of this platform.</p>
  </section>;
}
