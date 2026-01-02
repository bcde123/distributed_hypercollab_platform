const express = require('express');
const { verifyAccessToken } = require('../middleware/auth');
const router = express.Router();
const { checkPermission, PERMISSIONS } = require('../middleware/permissions');
const {verifyAccessToken} = require('../middleware/auth');

router.delete(
    '/:boardId', 
    verifyAccessToken,                       // 1. Is user logged in?
    checkPermission(PERMISSIONS.DELETE_BOARD), // 2. Is user allowed to delete boards in THIS workspace?
    (req, res) => {
        res.json({ message: "Board deleted" });
    }
);

module.exports = router;