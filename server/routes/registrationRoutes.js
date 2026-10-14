const express = require('express');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const { validateRegistration, validateDecision } = require('../services/registrationValidation');
const { getApplication, submitApplication, listApplications, reviewApplication, applicationHistory } = require('../models/registrationModel');
const { findUserById } = require('../models/userModel');
const { query } = require('../config/database');
const multer = require('multer');
const { documentType, scanDocument } = require('../services/registrationDocumentService');
const documents = require('../models/registrationDocumentModel');
const { authenticatedChatRateLimiter } = require('../middleware/rateLimitMiddleware');
const router = express.Router();
router.use(authenticateJWT());
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.use(async (req, res, next) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) return res.status(401).json({ error: 'Please sign in with an active account.' });
    req.user.role = user.role;
    next();
  } catch { res.status(503).json({ error: 'Account verification is temporarily unavailable.' }); }
});

router.get('/documents', authorizeRoles('patient'), async (req, res) => {
  try { res.json({ documents: await documents.listDocuments(req.user._id), uploadsAvailable: Boolean(process.env.REGISTRATION_CLAMSCAN_PATH) }); }
  catch { res.status(500).json({ error: 'Unable to load reports.' }); }
});
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 2 } }).single('document');
router.post('/documents', authorizeRoles('patient'), authenticatedChatRateLimiter, (req, res) => {
  upload(req, res, async (error) => {
    if (error) return res.status(400).json({ error: 'Upload one PDF, PNG or JPEG, up to 5 MB.' });
    const mediaType = documentType(req.file?.buffer);
    if (!mediaType) return res.status(400).json({ error: 'Choose a valid PDF, PNG or JPEG, up to 5 MB.' });
    try {
      await scanDocument(req.file.buffer);
      res.status(201).json({ document: await documents.addDocument(req.user._id, req.file, mediaType) });
    } catch (err) { res.status(err.status || 500).json({ error: err.status ? err.message : 'Unable to save the report.' }); }
  });
});
router.param('documentId', (_req, res, next, id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? next() : res.status(404).json({ error: 'Report not found.' }));
router.get('/documents/:documentId', authorizeRoles('patient'), async (req, res) => {
  try {
    const document = await documents.readDocument(req.user._id, req.params.documentId);
    if (!document) return res.status(404).json({ error: 'Report not found.' });
    res.set('Content-Type', document.mediaType);
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Security-Policy', "default-src 'none'; sandbox");
    res.set('Content-Disposition', `attachment; filename="report.${document.mediaType === 'application/pdf' ? 'pdf' : document.mediaType === 'image/png' ? 'png' : 'jpg'}"`);
    res.send(document.buffer);
  } catch { res.status(500).json({ error: 'Unable to download the report.' }); }
});
router.delete('/documents/:documentId', authorizeRoles('patient'), async (req, res) => {
  try {
    if (!await documents.removeDocument(req.user._id, req.params.documentId)) return res.status(404).json({ error: 'Report not found.' });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Unable to remove the report.' }); }
});

router.get('/me', authorizeRoles('patient'), async (req, res) => {
  try { res.json({ application: await getApplication(req.user._id) }); }
  catch { res.status(500).json({ error: 'Unable to load registration. Please try again.' }); }
});
router.post('/me', authorizeRoles('patient'), async (req, res) => {
  const { data, errors } = validateRegistration(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ error: Object.values(errors)[0], fields: errors });
  try {
    const application = await submitApplication(req.user._id, data);
    if (!application) return res.status(409).json({ error: 'This application has already been submitted. Refresh to see its status.' });
    return res.status(201).json({ application });
  } catch { return res.status(500).json({ error: 'Unable to submit registration. Your information has not been cleared; please retry.' }); }
});
router.get('/applications', authorizeRoles('admin'), async (req, res) => {
  const status = req.query.status || 'pending';
  const offset = Number(req.query.offset || 0);
  if (!['pending','submitted','needs_information','approved','declined'].includes(status) || !Number.isSafeInteger(offset) || offset < 0) return res.status(400).json({ error: 'Invalid application filter.' });
  try {
    const applications = await listApplications(status, offset);
    await req.logAuditEvent?.({ action: 'view_registrations', resourceType: 'patient_registration', metadata: { count: applications.length } });
    res.json({ applications });
  } catch { res.status(500).json({ error: 'Unable to load patient applications.' }); }
});
router.get('/email-jobs', authorizeRoles('admin'), async (_req, res) => {
  try {
    const result = await query(`SELECT id, audience, event, status, attempts, created_at, sent_at FROM registration_email_jobs ORDER BY created_at DESC LIMIT 25`);
    res.json({ jobs: result.rows });
  } catch { res.status(500).json({ error: 'Unable to load notification delivery.' }); }
});
router.get('/applications/:userId/history', authorizeRoles('admin'), async (req, res) => {
  try {
    const events = await applicationHistory(req.params.userId);
    await req.logAuditEvent?.({ action: 'view_registration_history', resourceType: 'patient_registration', resourceId: req.params.userId });
    res.json({ events });
  } catch { res.status(500).json({ error: 'Unable to load application history.' }); }
});
router.post('/email-jobs/:jobId/retry', authorizeRoles('admin'), async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.jobId)) return res.status(404).json({ error: 'Notification not found.' });
  try {
    const result = await query(`UPDATE registration_email_jobs SET status = 'pending', attempts = 0, available_at = NOW(), last_error = NULL
      WHERE id = $1 AND status = 'failed' RETURNING id`, [req.params.jobId]);
    if (!result.rows.length) return res.status(409).json({ error: 'Only failed notifications can be retried.' });
    await req.logAuditEvent?.({ action: 'retry_registration_email', resourceType: 'registration_email_job', resourceId: req.params.jobId });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Unable to retry notification.' }); }
});
router.patch('/applications/:userId', authorizeRoles('admin'), async (req, res) => {
  const error = validateDecision(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const application = await reviewApplication(req.params.userId, req.user._id, req.body);
    if (!application) return res.status(409).json({ error: 'This application changed or is no longer awaiting review. Refresh the list.' });
    res.json({ application });
  } catch { res.status(500).json({ error: 'Unable to save the review. Please try again.' }); }
});
module.exports = router;
