const express = require('express');
const router = express.Router({ mergeParams: true });
const { PERMISSIONS } = require('../constants/permissions');
const checkPermission = require('../middleware/rbac');
const { verifyAccessToken } = require('../middleware/auth');
const tasksController = require('../controllers/tasksController');

// Create a task
router.post(
  '/lists/:listId',
  verifyAccessToken,
  checkPermission(PERMISSIONS.CREATE_TASK), 
  tasksController.createTask
);

// Update a task (rename, move, change status)
router.put(
  '/:taskId',
  verifyAccessToken,
  checkPermission(PERMISSIONS.UPDATE_TASK),
  tasksController.updateTask
);

// Delete a task
router.delete(
  '/:taskId',
  verifyAccessToken,
  checkPermission(PERMISSIONS.DELETE_TASK),
  tasksController.deleteTask
);

module.exports = router;
