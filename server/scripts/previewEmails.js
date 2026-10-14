const fs = require('node:fs');
const path = require('node:path');
const { renderEmail, TEMPLATES, LOGO_PATH } = require('../services/emailTemplates');
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
