const fs = require('node:fs');
const path = require('node:path');
const { renderEmail, TEMPLATES, LOGO_PATH } = require('../services/emailTemplates');
const { renderOfficerInviteEmail } = require('../services/officerEmailTemplate');
const { renderCareEmail } = require('../services/careEmailDelivery');
const directory = path.join(__dirname, '../../email-preview');
fs.mkdirSync(directory, { recursive: true });
fs.copyFileSync(LOGO_PATH, path.join(directory, 'logo.png'));
for (const name of Object.keys(TEMPLATES)) {
  const email = renderEmail(name, { appOrigin: 'https://example.invalid', firstName: 'Alex', reference: 'DEMO-001',
    ...(name.startsWith('appointment_') ? { appointmentTime: '12 October 2026, 10:00 AM (Asia/Colombo)' } : {}) });
  fs.writeFileSync(path.join(directory, `${name}.html`), email.html.replace('cid:mindbridge-logo', 'logo.png'));
  fs.writeFileSync(path.join(directory, `${name}.txt`), email.text);
}
fs.writeFileSync(path.join(directory, 'index.html'), `<!doctype html><html lang="en"><title>MindBridge email previews</title><h1>Email previews</h1><p>Fictional examples. No emails are sent.</p><ul>${Object.keys(TEMPLATES).map((name) => `<li><a href="${name}.html">${name}</a></li>`).join('')}</ul></html>`);
console.log(`Email previews: ${directory}`);
const extra = {
  officer_invitation: renderOfficerInviteEmail({name:'Alex', hospitalName:'Demo Care Centre',inviteUrl:'https://example.invalid/accept-invitation#token=DEMO-ONLY',appOrigin:'https://example.invalid'}),
  hospital_booking: renderCareEmail({event:'pending',audience:'hospital',booking_id:'DEMO-001',timezone:'Asia/Colombo',starts_at:'2026-12-01T04:30:00Z',professional_name:'Demo professional',hospital_name:'Demo Care Centre',demo:true},'https://example.invalid'),
};
for (const [name,email] of Object.entries(extra)) {
  fs.writeFileSync(path.join(directory, `${name}.html`),email.html.replace('cid:mindbridge-logo','logo.png'));
  fs.writeFileSync(path.join(directory, `${name}.txt`),email.text);
}
fs.appendFileSync(path.join(directory,'index.html'),`<ul>${Object.keys(extra).map(name=>`<li><a href="${name}.html">${name}</a></li>`).join('')}</ul>`);
