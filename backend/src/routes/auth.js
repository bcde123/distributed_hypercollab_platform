const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../utils/tokenGenerator');

// Register route
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email, password });
        await newUser.save();

        // Token generated immediately after registration
        const token = await generateToken(newUser);

        // Set Refresh Token in HTTP-only cookie
        res.cookie('jwt', token.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({ accessToken: token.accessToken,newUser });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
