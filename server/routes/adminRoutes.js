// routes/admin.js
const express = require('express');
const router = express.Router();
const {
  listPendingDoctors,
  approveDoctor,
  deleteUser,
  listUsers,
  findUserById,
  updateUser,
} = require('../models/userModel');
const { listAuditLogs } = require('../services/auditLogService');

// Import JWT middleware
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

const ALLOWED_ROLES = new Set(['patient', 'pending-doctor', 'doctor', 'admin']);

// 🔒 Protect all admin routes
router.use(authenticateJWT());
router.use(authorizeRoles('admin'));
router.use(async (req,res,next) => {
  try {
    const current = await findUserById(req.user._id);
    if (!current || current.role !== 'admin') return res.status(403).json({error:'Administrator access required.'});
    next();
  } catch { res.status(503).json({error:'Administrator access is unavailable.'}); }
});

// Operational views return administrative metadata, never clinical records or credentials.
const dashboard = require('../models/adminDashboardModel');
const dashboardHandler = fn => async (req,res) => {
  res.set('Cache-Control','no-store');
  try { res.json(await fn(req)); }
  catch(error) { res.status(error.status || 500).json({error:error.status ? error.message : 'Unable to load administrative data.'}); }
};
router.get('/dashboard',dashboardHandler(() => dashboard.summary()));
router.get('/directory',dashboardHandler(req => dashboard.directory(req.query)));
router.get('/appointment-list',dashboardHandler(req => dashboard.appointments(req.query)));
router.get('/email-delivery',dashboardHandler(req => dashboard.emails(req.query)));
router.get('/activity',dashboardHandler(req => dashboard.activity(req.query)));
router.post('/email-delivery/:id/retry',dashboardHandler(req => dashboard.retryEmail(req.params.id,req.user._id)));

// Legacy endpoints cannot bypass versioned credential review.
router.get('/pending-doctors', async (_req,res) => {
  try {
    const rows = await require('../models/professionalRegistrationModel').list();
    res.json(rows.map(row => ({_id:row.user_id,name:row.data.name,email:row.email,role:'pending-doctor'})));
  } catch { res.status(503).json({error:'Professional registration is unavailable.'}); }
});
router.post(['/approve-doctor','/reject-doctor'], (_req,res) => res.status(409).json({error:'Use the professional registration review dashboard.'}));

// ------------------- List users -------------------
router.get('/users', requirePermission('manage_users'), async (_req, res) => {
  try {
    const users = await listUsers();
    return res.json(users);
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.patch('/users/:userId/role', requirePermission('manage_users'), async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (role === 'admin') return res.status(409).json({error:'Administrator access must be provisioned privately, not through general role editing.'});
  if (role === 'doctor') return res.status(409).json({ error: 'Approve credentials through professional registration.' });
  if (!role) return res.status(400).json({ error: 'Missing role' });
  if (!ALLOWED_ROLES.has(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const existingUser = await findUserById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (existingUser.role === 'admin') return res.status(409).json({error:'Administrator roles require the private access-management process.'});
    const updatedUser = await updateUser(userId, { role, updatedAt: new Date() });
    await req.logAuditEvent?.({
      action: 'change_user_role',
      resourceType: 'user',
      resourceId: userId,
      metadata: {
        previousRole: existingUser.role,
        newRole: updatedUser.role,
        adminAction: true,
      },
    });

    return res.json({
      success: true,
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to change user role' });
  }
});

router.delete('/users/:userId', requirePermission('manage_users'), async (req, res) => {
  const { userId } = req.params;

  try {
    const existingUser = await findUserById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (existingUser.role === 'admin') return res.status(409).json({error:'Administrator accounts cannot be deleted through general user management.'});
    await deleteUser(userId);
    await req.logAuditEvent?.({
      action: 'delete_user',
      resourceType: 'user',
      resourceId: userId,
      metadata: {
        deletedRole: existingUser.role,
        adminAction: true,
      },
    });

    return res.json({ success: true });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.get('/audit-logs', requirePermission('view_audit_logs'), async (req, res) => {
  try {
    const logs = await listAuditLogs({
      userId: req.query.userId,
      action: req.query.action,
      resourceType: req.query.resourceType,
      resourceId: req.query.resourceId,
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit,
    });

    return res.json({ logs });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
