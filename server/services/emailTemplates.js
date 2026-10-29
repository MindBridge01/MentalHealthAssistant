const {emailLayout, logoAttachments, LOGO_PATH} = require('./emailLayout');
const TEMPLATES = {
  patient_submitted_admin: ['New patient registration awaiting review', 'A patient registration has been submitted. Please sign in to review the application.', 'Review application', '/admin/dashboard?view=registrations'],
  professional_submitted_admin: ['New professional application awaiting verification', 'A professional application has been submitted. Please sign in to verify the credentials and review the application.', 'Review application', '/admin/dashboard?view=verification'],
  patient_received: ['We have received your MindBridge application', 'Your patient application has been received and is awaiting review. We will email you when there is an update.', 'View application status', '/patient/registration'],
  professional_received: ['We have received your MindBridge professional application', 'Your professional application is awaiting verification. We will email you when there is an update.', 'View application status', '/doctor/onboarding'],
  patient_approved: ['Your MindBridge registration is approved', 'Your registration has been approved. You can now access your patient dashboard and request appointments with available professionals.', 'Open my dashboard', '/patient/dashboard'],
  professional_approved: ['Your MindBridge professional account is approved', 'Your professional application has been approved. Sign in, complete your public profile, select an admin-linked hospital and add agreed appointment slots. Publish only when ready. Read the Profile setup guide in your dashboard.', 'Open professional dashboard', '/doctor/dashboard'],
  patient_needs_information: ['Action needed on your MindBridge application', 'Our review team needs additional information. Please sign in to read the request, update your details, and resubmit.', 'Update application', '/patient/registration'],
  professional_needs_information: ['Action needed on your professional application', 'Our review team needs additional information. Sign in to view the request and next steps.', 'View application', '/doctor/onboarding'],
  patient_declined: ['An update on your MindBridge application', 'Your application has been reviewed and has not been approved at this time. Please sign in to read the explanation and available next steps.', 'View review outcome', '/patient/registration'],
  professional_declined: ['An update on your professional application', 'Your application has not been approved at this time. Please sign in to read the explanation and available next steps.', 'View review outcome', '/doctor/onboarding'],
  appointment_requested_provider: ['New appointment request', 'You have a new appointment request. Sign in to accept, decline, or propose another time. This appointment is not confirmed yet.', 'Review request', '/doctor/dashboard'],
  appointment_requested_patient: ['Your appointment request has been received', 'Your request has been sent to the provider and is awaiting confirmation. We will notify you when the provider responds.', 'View request', '/patient/appointments'],
  appointment_confirmed: ['Your MindBridge appointment is confirmed', 'Your appointment has been confirmed. Sign in to view meeting arrangements, payment instructions, and cancellation options.', 'View appointment', '/patient/appointments'],
  appointment_declined: ['An update on your appointment request', 'The provider could not accept your requested time. Sign in to view the next steps or request another appointment.', 'View request', '/patient/appointments'],
  appointment_proposed: ['A new appointment time has been proposed', 'The provider has suggested another time. Please review and accept it before the appointment is confirmed.', 'Review proposed time', '/patient/appointments'],
  appointment_cancelled_patient: ['Your appointment has been cancelled', 'Your appointment has been cancelled. Sign in to view the update and available next steps.', 'View appointment', '/patient/appointments'],
  appointment_cancelled_provider: ['An appointment has been cancelled', 'An appointment has been cancelled. Sign in to view the update in your schedule.', 'View schedule', '/doctor/dashboard'],
  appointment_reminder_patient: ['Reminder: your upcoming appointment', 'This is a reminder about your confirmed appointment. Sign in to check the meeting details.', 'View appointment', '/patient/appointments'],
  appointment_reminder_provider: ['Reminder: your upcoming appointment', 'This is a reminder about your confirmed appointment. Sign in to view your schedule.', 'View schedule', '/doctor/dashboard'],
};

function renderEmail(template, { appOrigin, firstName, reference, appointmentTime, supportEmail } = {}) {
  const definition = TEMPLATES[template];
  if (!definition) throw new Error('Unknown email template');
  const origin = new URL(appOrigin);
  if (!['https:', 'http:'].includes(origin.protocol) || origin.username || origin.password) throw new Error('Invalid application origin');
  const [subject, message, action, route] = definition;
  const url = new URL(route, origin).href;
  const greeting = firstName ? `Hello ${String(firstName).slice(0, 80)},` : 'Hello,';
  const details = [reference && `Reference: ${String(reference).slice(0, 80)}`, appointmentTime && `When: ${String(appointmentTime).slice(0, 120)}`].filter(Boolean);
  const footer = 'MindBridge\nPlease do not reply with medical information.' + (supportEmail ? `\nSupport: ${supportEmail}` : '');
  const paragraphs = [greeting, message, ...details];
  if(template === 'professional_approved') paragraphs.push('Profile setup guide: '+new URL('/professional-setup-guide.html',origin).href);
  return {
    subject,
    text: [...paragraphs, `${action}: ${url}`, footer].join('\n\n'),
    html: emailLayout({title:subject, paragraphs, action, url, footer}),
    attachments: logoAttachments(),
  };
}
module.exports = { renderEmail, TEMPLATES, LOGO_PATH };
