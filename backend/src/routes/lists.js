const express = require('express');
const router = express.Router({ mergeParams: true });
const { PERMISSIONS } = require('../constants/permissions');
const checkPermission = require('../middleware/rbac');
const { verifyAccessToken } = require('../middleware/auth');
const listsController = require('../controllers/listsController');

// Create a list
router.post(
  '/',
  verifyAccessToken,
  checkPermission(PERMISSIONS.CREATE_BOARD), // Assuming board creators can manage lists
  listsController.createList
);

// Update a list
router.put(
  '/:listId',
  verifyAccessToken,
  checkPermission(PERMISSIONS.UPDATE_BOARD),
  listsController.updateList
);

// Delete/Archive a list
router.delete(
  '/:listId',
  verifyAccessToken,
  checkPermission(PERMISSIONS.DELETE_BOARD),
  listsController.deleteList
);

module.exports = router;
