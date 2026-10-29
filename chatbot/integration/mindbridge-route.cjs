// OPTIONAL integration example. This file is NOT installed in the existing app.
// Mount on the EXISTING backend after its live authentication and role/MFA checks.
const {
  createHmac
} = require('node:crypto');
module.exports = function chatbotTokenHandler({
  getAuthorizedIdentity,
  secret
}) {
  if (typeof secret !== 'string' || secret.length < 32) throw new Error('A dedicated chatbot signing secret is required.');
  return async function issueChatbotToken(req, res, next) {
    try {
      // This callback MUST revalidate the original session, current role,
      // patient approval, and administrator MFA from trusted server-side state.
      // Never read identity, approval or MFA values from the request body.
      const identity = await getAuthorizedIdentity(req);
      if (!identity || !['patient', 'admin'].includes(identity.role) || identity.role === 'patient' && identity.approved !== true || identity.role === 'admin' && identity.mfaVerified !== true) {
        return res.status(403).json({
          error: 'Approved patient or MFA-verified administrator access required.'
        });
      }
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        sub: String(identity.id),
        role: identity.role,
        mfa: identity.mfaVerified === true,
        iss: 'mindbridge',
        aud: 'mindbridge-chatbot',
        iat: now,
        exp: now + 300
      };
      const header = Buffer.from(JSON.stringify({
        alg: 'HS256',
        typ: 'JWT'
      })).toString('base64url');
      const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
      res.set('Cache-Control', 'no-store');
      res.json({
        token: `${header}.${body}.${signature}`
      });
    } catch (error) {
      next(error);
    }
  };
};
// Suggested mount: POST /api/auth/chatbot-token on the existing app.
// Apply its normal authentication, CSRF, and rate-limiting middleware.
// Reverse proxy this one path to the existing backend and /api/* to this service.
