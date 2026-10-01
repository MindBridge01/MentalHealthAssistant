// Isolated UI fixture. No database, mail, environment files, or real patient data.
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
let application = null;
const user = { _id: 'demo-patient-0001', name: 'Demo Patient', email: 'patient@example.test', role: 'patient', onboardingCompleted: false };
const server = await createServer({
  configFile: false, envDir: false, server: { host: '127.0.0.1', port: 5178, strictPort: true },
  plugins: [react(), tailwind(), {
    name: 'registration-ui-fixture',
    transformIndexHtml(html) {
      return html.replace('<head>', `<head><script>localStorage.setItem('user', ${JSON.stringify(JSON.stringify(user))})</script>`);
    },
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next();
        res.setHeader('Content-Type', 'application/json');
        if (req.url === '/api/profile') return res.end(JSON.stringify({ ...user, registrationStatus: application?.status || 'not_submitted' }));
        if (req.url === '/api/registration/me') {
          if (req.method === 'POST') {
            let body = ''; for await (const chunk of req) body += chunk;
            application = { userId: user._id, details: JSON.parse(body), status: 'submitted', version: 1, submittedAt: new Date().toISOString(), reviewNote: '' };
          }
          return res.end(JSON.stringify({ application }));
        }
        res.statusCode = 404; res.end(JSON.stringify({ error: 'This endpoint is not included in the isolated UI preview.' }));
      });
    },
  }],
});
await server.listen();
console.log('Synthetic registration preview: http://127.0.0.1:5178/patient/onboarding');
