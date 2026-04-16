require('dotenv').config();
const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Login route
router.post('/login', authController.login);

// Register route
router.post('/register', authController.register);

// Refresh token route
router.post('/refresh', authController.refreshToken);

// Verify token route
router.get("/verify", verifyAccessToken, authController.verifyToken);

// Update Kyber public key
router.put("/publickey", verifyAccessToken, authController.updatePublicKey);

module.exports = router;
