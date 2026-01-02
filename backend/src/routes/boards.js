const express = require('express');
const router = express.Router({ mergeParams: true }); // Essential for accessing workspaceId from parent route
const { PERMISSIONS } = require('../constants/permissions');
const checkPermission = require('../middleware/rbac');
const {verifyAccessToken} = require('../middleware/auth');
const Board = require('../models/Board');

router.delete(
    '/:boardId', 
    verifyAccessToken,                       // 1. Is user logged in?
    checkPermission(PERMISSIONS.DELETE_BOARD), // 2. Is user allowed to delete boards in THIS workspace?
    async (req, res) => {
        try {
            const { boardId, workspaceId } = req.params;

            // Delete the board ensuring it belongs to the workspace context
            const result = await Board.findOneAndDelete({ 
                _id: boardId, 
                workspace: workspaceId 
            });

            if (!result) {
                return res.status(404).json({ message: "Board not found" });
            }

            res.json({ message: "Board deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Server error during deletion" });
        }
    }
);

module.exports = router;