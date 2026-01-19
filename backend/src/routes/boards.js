const express = require('express');
const router = express.Router({ mergeParams: true });
const { PERMISSIONS } = require('../constants/permissions');
const checkPermission = require('../middleware/rbac');
const { verifyAccessToken } = require('../middleware/auth');
const boardsController = require('../controllers/boardsController');

// Create a board
router.post(
  '/',
  verifyAccessToken,
  checkPermission(PERMISSIONS.CREATE_BOARD),
  boardsController.createBoard
);

// Get all boards in a workspace
router.get(
  '/',
  verifyAccessToken,
  checkPermission(PERMISSIONS.VIEW_CONTENT),
  boardsController.getBoardsByWorkspace
);

// Get FULL board (board + lists + tasks)
router.get(
  '/:boardId/full',
  verifyAccessToken,
  checkPermission(PERMISSIONS.VIEW_CONTENT),
  boardsController.getFullBoard
);

// Get a single board (lists included)
router.get(
  '/:boardId',
  verifyAccessToken,
  checkPermission(PERMISSIONS.VIEW_CONTENT),
  boardsController.getBoardById
);

// Update board
// router.put(
//   '/:boardId',
//   verifyAccessToken,
//   checkPermission(PERMISSIONS.UPDATE_BOARD),
//   boardsController.updateBoard
// );

// Close / archive board (soft delete)
router.patch(
  '/:boardId/close',
  verifyAccessToken,
  checkPermission(PERMISSIONS.DELETE_BOARD),
  boardsController.deleteBoard
);

module.exports = router;
