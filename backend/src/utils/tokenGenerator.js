const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');

const ACCESS_TOKEN_TTL = '15m'; // 15 minutes
const REFRESH_TOKEN_TTL = '7d'; // 7 days
const REFRESH_TOKEN_SECONDS = 7 * 24 * 60 * 60;

const generateToken = async (user) => {
    // Payload for access token
    const accessPayload = {
        userId: user._id,
        email: user.email,
        username: user.username
    };
    // sign access token
    const accessToken = jwt.sign(
        accessPayload, 
        process.env.ACCESS_TOKEN_SECRET, 
        { expiresIn: ACCESS_TOKEN_TTL }
    );
    // sign refresh token
    const refreshToken = jwt.sign(
        { userId: user._id }, 
        process.env.REFRESH_TOKEN_SECRET, 
        { expiresIn: REFRESH_TOKEN_TTL }
    );
    
    // Store refresh token in Redis
    await redisClient.set(
        `refreshToken:${user._id}`,
        refreshToken,
        'EX',
        REFRESH_TOKEN_SECONDS
    );
    return { accessToken, refreshToken };
};

module.exports = { generateToken };
