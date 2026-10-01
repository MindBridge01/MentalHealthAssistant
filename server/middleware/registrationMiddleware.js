const { getRegistrationStatus } = require('../models/registrationModel');

async function requireApprovedPatient(req, res, next) {
  if (req.user?.role !== 'patient') return next();
  try {
    if (await getRegistrationStatus(req.user._id) !== 'approved') {
      return res.status(403).json({ error: 'Your patient registration must be approved before using this feature.', code: 'REGISTRATION_REQUIRED' });
    }
    return next();
  } catch {
    return res.status(503).json({ error: 'Unable to check registration status. Please try again.' });
  }
}
module.exports = { requireApprovedPatient };
