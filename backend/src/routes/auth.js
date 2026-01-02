const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../utils/tokenGenerator');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');

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

router.post('Refresh' , async (req, res) => {
    const cookies = req.cookies;

    // 1. Check for refresh token in cookies
    if(!cookies?.jwt) return res.status(401);

    const incomingRefreshToken = cookies.jwt;

    try {
        // 2. Verify incoming refresh token
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        // 3. Check token against Redis
        const storedRefreshToken = await redisClient.get(`refreshToken:${decoded.userId}`);

        // 4. If token mismatch, deny access
        if(!storedRefreshToken) {
            // Token not found in Redis or Expired
            return res.status(403).json({ message: 'Unauthorized: Token not found or expired' });
        }

        if(storedRefreshToken !== incomingRefreshToken) {
            // Token reuse detected
            // Critical: Invalidate all sessions for this user
            await redisClient.del(`refreshToken:${decoded.userId}`);
            return res.status(403).json({ message: 'Security Alert: Token reuse detected' });
        }

        // 5. Generate new tokens
        const userDummy = {
            _id: decoded.userId,
            email: decoded.email,
            username: decoded.username
        };
        const tokens = await generateToken(userDummy);

        // 6. Set new Refresh Token in HTTP-only cookie
        res.cookie('jwt', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // 7. Send new Access Token in response
        res.json({ accessToken: tokens.accessToken });
    }
    catch(err) {
        // Handle token expiration or invalid token
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
});

module.exports = router;
