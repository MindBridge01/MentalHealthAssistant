const express = require('express');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const { validateRegistration, validateDecision } = require('../services/registrationValidation');
const { getApplication, submitApplication, listApplications, reviewApplication } = require('../models/registrationModel');
const router = express.Router();
router.use(authenticateJWT());
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

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
  try {
    const applications = await listApplications();
    await req.logAuditEvent?.({ action: 'view_registrations', resourceType: 'patient_registration', metadata: { count: applications.length } });
    res.json({ applications });
  } catch { res.status(500).json({ error: 'Unable to load patient applications.' }); }
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
