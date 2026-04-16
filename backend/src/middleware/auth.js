const jwt = require('jsonwebtoken');

const verifyAccessToken = (req, res, next) => {

    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access Denied' });
    }
    const token = authHeader && authHeader.split(' ')[1];
    try{
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // console.log("DECODED:", decoded);
        req.user = {
            id: decoded.userId,
            userId: decoded.userId
        };
        next();
    } catch(err) {
        if(err.name === 'TokenExpiredError') {
            return res.status(403).json({ 
                message: 'Unauthorized: Token has expired',
                code: 'TOKEN_EXPIRED' 
            });
        }
        return res.status(403).json({ message: 'Unauthorized: Invalid token' });
    }
};

module.exports = { verifyAccessToken };