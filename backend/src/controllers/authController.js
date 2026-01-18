const User = require('../models/User');
const { generateToken } = require('../utils/tokenGenerator');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');

// Login controller
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if user exists
        // We must explicitly .select('+password') because it is set to select: false in the schema
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 2. Validate password using the method defined in User model
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 3. Generate tokens
        const tokens = await generateToken(user);

        // 4. Set Refresh Token in HTTP-only cookie (same settings as register/refresh)
        res.cookie('jwt', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // 5. Respond with Access Token and user info
        // Remove password from user object before sending response
        user.password = undefined;
        
        res.json({ 
            accessToken: tokens.accessToken, 
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profile: user.profile
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Register controller
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email, password }); 
        await newUser.save();

        // Token generated immediately after registration
        const token = await generateToken(newUser);

        // Set Refresh Token in HTTP-only cookie
        res.cookie('jwt', token.refreshToken, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            secure: false,
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            accessToken: token.accessToken,
            user: {
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Refresh token controller
const refreshToken = async (req, res) => {
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
};

// Verify token controller
const verifyToken = (req, res) => {
    // If we reach here, token is valid
    res.status(200).json({
        authenticated: true,
        user: {
            userId: req.user.userId,
            email: req.user.email,
            username: req.user.username,
        },
    });
};

module.exports = {
    login,
    register,
    refreshToken,
    verifyToken
};
