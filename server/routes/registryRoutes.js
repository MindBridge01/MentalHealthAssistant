const express = require('express');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const { findUserById } = require('../models/userModel');
const store = require('../models/registryModel');
const { UUID, validateAssignment, validateReason, pagination } = require('../services/registryValidation');
const router = express.Router();
router.use(authenticateJWT());
router.use(async (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  try {
    // Do not trust an old JWT role after a provider or administrator has been demoted.
    const current = await findUserById(req.user._id);
    if (!current) return res.status(401).json({ error: 'Account no longer available.' });
    req.user.role = current.role;
    return next();
  } catch { return res.status(503).json({ error: 'Unable to verify registry access.' }); }
});
router.param('patientId', (req, res, next, id) => UUID.test(id) ? next() : res.status(400).json({ error: 'Invalid patient ID.' }));

function endpoint(fn) {
  return async (req, res) => {
    try { await fn(req, res); }
    catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : 'Unable to complete registry request.' }); }
  };
}
router.get('/me', authorizeRoles('patient'), endpoint(async (req, res) => {
  res.json({ patient: await store.readPatient(req.user) });
}));
router.get('/me/registration-history', authorizeRoles('patient'), endpoint(async (req, res) => {
  res.json({ revisions: await store.registrationHistory(req.user._id) });
}));
router.put('/me/reminder-consent', authorizeRoles('patient'), endpoint(async (req, res) => {
  if (typeof req.body?.enabled !== 'boolean') return res.status(400).json({ error: 'enabled must be a boolean.' });
  res.json({ consent: await store.changeReminderConsent(req.user, req.body.enabled) });
}));
router.get('/patients', authorizeRoles('admin', 'doctor'), endpoint(async (req, res) => {
  const paging = pagination(req.query);
  if (!paging) return res.status(400).json({ error: 'Use a limit between 1 and 100 and a non-negative offset.' });
  res.json(await store.listPatients(req.user, paging));
}));
router.get('/patients/:patientId', authorizeRoles('admin', 'doctor'), endpoint(async (req, res) => {
  res.json({ patient: await store.readPatient(req.user, req.params.patientId) });
}));
router.post('/patients/:patientId/care-team', authorizeRoles('admin'), endpoint(async (req, res) => {
  const error = validateAssignment(req.body);
  if (error) return res.status(400).json({ error });
  res.status(201).json({ assignment: await store.assignProvider(req.user, req.params.patientId, req.body) });
}));
router.patch('/patients/:patientId/care-team/:assignmentId/revoke', authorizeRoles('admin'), endpoint(async (req, res) => {
  if (!UUID.test(req.params.assignmentId)) return res.status(400).json({ error: 'Invalid assignment ID.' });
  const error = validateReason(req.body?.reason);
  if (error) return res.status(400).json({ error });
  res.json({ assignment: await store.revokeProvider(req.user, req.params.patientId, req.params.assignmentId, req.body.reason) });
}));
module.exports = router;
