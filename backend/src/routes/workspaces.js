const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middleware/auth');
const workspacesController = require('../controllers/workspacesController');

// Create a new workspace
router.post('/workspaces', verifyAccessToken, workspacesController.createWorkspace);

// Get all workspaces for the authenticated user
router.get('/workspaces', verifyAccessToken, workspacesController.getAllWorkspaces);

// Generate invite link for a workspace
router.post('/workspaces/:workspaceId/invite', verifyAccessToken, workspacesController.generateInviteLink);

// Join workspace via invite link
router.post('/workspaces/join/:inviteToken', verifyAccessToken, workspacesController.joinWorkspace);

// Get invite link details (without authentication - for preview)
router.get('/workspaces/invite/:inviteToken', workspacesController.getInviteLinkDetails);

router.get("/workspaces/slug/:slug", verifyAccessToken,workspacesController.getWorkspaceBySlug);



module.exports = router;