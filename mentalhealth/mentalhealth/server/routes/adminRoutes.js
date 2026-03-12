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

// ------------------- Get pending doctor applications -------------------
router.get('/pending-doctors', requirePermission('approve_doctor'), async (req, res) => {
  try {
    const pendingDoctors = await listPendingDoctors();
    res.json(pendingDoctors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending doctors' });
  }
});

// ------------------- Approve doctor application -------------------
router.post('/approve-doctor', requirePermission('approve_doctor'), async (req, res) => {
  const { doctorId } = req.body;
  if (!doctorId) return res.status(400).json({ error: 'Missing doctorId' });

  try {
    await approveDoctor(doctorId);
    await req.logAuditEvent?.({
      action: 'approve_doctor',
      resourceType: 'user',
      resourceId: doctorId,
      metadata: {
        targetRole: 'doctor',
        adminAction: true,
      },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve doctor' });
  }
});

// ------------------- Reject doctor application -------------------
router.post('/reject-doctor', requirePermission('reject_doctor'), async (req, res) => {
  const { doctorId } = req.body;
  if (!doctorId) return res.status(400).json({ error: 'Missing doctorId' });

  try {
    await deleteUser(doctorId);
    await req.logAuditEvent?.({
      action: 'reject_doctor',
      resourceType: 'user',
      resourceId: doctorId,
      metadata: {
        previousRole: 'pending-doctor',
        adminAction: true,
      },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject doctor' });
  }
});

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

  if (!role) return res.status(400).json({ error: 'Missing role' });
  if (!ALLOWED_ROLES.has(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const existingUser = await findUserById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

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
