const express = require('express');
const router = express.Router({ mergeParams: true });
const { getWorkspaceAnalytics, getEngineHealth } = require('../controllers/analyticsController');
const { verifyAccessToken } = require('../middleware/auth');
const checkPermission = require('../middleware/rbac');
const { PERMISSIONS } = require('../constants/permissions');

// GET /api/workspaces/:workspaceId/analytics
// Supports ?days=7 (default) or ?days=30 for extended range
router.get('/', verifyAccessToken, checkPermission(PERMISSIONS.READ_ANALYTICS), getWorkspaceAnalytics);

// GET /api/workspaces/:workspaceId/analytics/health
// Returns the C++ engine heartbeat status
router.get('/health', verifyAccessToken, checkPermission(PERMISSIONS.READ_ANALYTICS), getEngineHealth);

module.exports = router;
