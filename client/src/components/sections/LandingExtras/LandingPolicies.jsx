import { useEffect, useRef } from 'react';

const policyDrafts = {
  privacy: {
    title: 'Privacy notice',
    intro: 'This draft describes how MindBridge’s current account, chat, community, and appointment features use information. It is not a certification or a completed legal compliance assessment.',
    sections: [
      ['Information you provide', 'Depending on the features you use, you may provide account and contact details, onboarding or registration information, chat messages, community posts, and appointment requests. Public AI chat can be opened without creating an account.'],
      ['AI conversations', 'Messages you submit are sent to MindBridge’s server and processed by the configured AI service to generate a response. Avoid including identifying or sensitive information that is not needed. Do not assume that public chat is anonymous or that messages cannot be processed or logged.'],
      ['Accounts and saved records', 'Signed-in chat can save conversation history to your account. Registration, profile, and appointment records are stored to support those features. Sign-in uses session cookies. The privacy notice must identify the actual service providers and retention periods before publication.'],
      ['Community and appointment information', 'Information you post in the community is shared with other community members. Appointment information is used by the relevant professional, hospital, and authorized administrative users to process and manage requests. Review the information you share before submitting it.'],
      ['Your choices', 'You can use public AI chat without creating an account, choose whether to post in the community, and choose whether to submit an appointment request. A verified contact and process for access, correction, deletion, and other applicable privacy requests must be provided by the service operator before publication.'],
      ['Details the operator must confirm', 'The legal identity and address of the operator, privacy contact, applicable jurisdictions and lawful bases, age and consent requirements, processor list, international data transfers, retention periods, request procedure, and any optional tracking must be confirmed before this draft is published as the final notice.'],
    ],
  },
  terms: {
    title: 'Terms of use',
    intro: 'These draft terms explain the intended use of MindBridge. They do not change the existing account or booking agreements and must be reviewed and completed by the service operator before publication.',
    sections: [
      ['Service scope', 'MindBridge provides AI-assisted reflection, self-guided activities, community features, and tools to request professional appointments. Automated responses and activities do not establish a clinician–patient relationship, provide a diagnosis, or replace individual professional care. MindBridge is not an emergency service.'],
      ['Accounts and responsible use', 'Provide accurate registration information and keep your account credentials secure. Do not impersonate another person, harass other members, upload unlawful content, or attempt to access another person’s records. Follow any consent and eligibility requirements shown during registration.'],
      ['AI and community content', 'AI can produce incomplete or incorrect responses. Community posts represent members’ experiences and are not professional advice. Consider the source and context of information before acting on it, and consult a qualified professional for individual clinical decisions.'],
      ['Professional appointments and payment', 'Professional profiles and available slots depend on participating providers. An appointment request is not confirmed until the hospital confirms it. Review the listed fee, payment, arrival, and cancellation instructions. Consultation payments are handled by the provider; MindBridge does not collect consultation payments. Approved patient registration is required to request an appointment.'],
      ['Availability and changes', 'Features and appointment availability can change. Do not rely on the platform for continuous monitoring, emergency response, or guaranteed access to a professional. Keep your provider’s confirmed appointment details and instructions.'],
      ['Details the operator must confirm', 'The contracting legal entity, contact information, eligibility and age rules, governing jurisdiction, applicable consumer rights, content permissions, account closure procedure, dispute process, and any limitations of responsibility need appropriate review before these terms are finalized.'],
    ],
  },
};

export default function LandingPolicies({ policy, onClose }) {
  const dialogRef = useRef(null);
  const draft = policyDrafts[policy];
  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, []);
  return <dialog ref={dialogRef} className="landing-policy-dialog" aria-labelledby="landing-policy-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="landing-policy-content"><header><div><p>MINDBRIDGE · PREPARED 25 OCTOBER 2026</p><h2 id="landing-policy-title">{draft.title}</h2></div><button autoFocus type="button" aria-label={`Close ${draft.title.toLowerCase()}`} onClick={onClose}>×</button></header>
      <p className="landing-policy-draft">Draft for owner review. Operator identity, privacy contact, retention periods, and applicable legal requirements must be confirmed before publication.</p>
      <p>{draft.intro}</p>
      {draft.sections.map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}
      <p className="landing-policy-reference">Reference: <a href="https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en" target="_blank" rel="noopener noreferrer">European Commission data-protection information</a> · <a href="https://www.hhs.gov/hipaa/for-individuals/index.html" target="_blank" rel="noopener noreferrer">HHS information about HIPAA</a></p>
      <button type="button" className="landing-button landing-button-primary" onClick={onClose}>Close notice</button>
    </div>
  </dialog>;
}
