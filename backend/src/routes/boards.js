const express = require('express');
const router = express.Router({ mergeParams: true }); // Essential for accessing workspaceId from parent route
const { PERMISSIONS } = require('../constants/permissions');
const checkPermission = require('../middleware/rbac');
const { verifyAccessToken } = require('../middleware/auth');
const boardsController = require('../controllers/boardsController');

router.delete(
    '/:boardId', 
    verifyAccessToken,                       // 1. Is user logged in?
    checkPermission(PERMISSIONS.DELETE_BOARD), // 2. Is user allowed to delete boards in THIS workspace?
    boardsController.deleteBoard
);

module.exports = router;