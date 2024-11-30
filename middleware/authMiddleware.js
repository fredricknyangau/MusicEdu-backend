const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to verify JWT and extract user role
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Extract token from header

    if (!token) {
        console.log('Token is missing.');
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded user:", decoded);  // Log the decoded user for debugging
        req.user = decoded; // Store decoded token in req.user
        next();
    } catch (error) {
        console.error('Token verification error:', error);  // Log the error for debugging
        res.status(403).json({ message: 'Invalid token' });
    }
};

// Middleware to restrict access to admin role
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};

// Middleware to restrict access to user role
const authorizeUser = (req, res, next) => {
    if (req.user.role !== 'user') {
        return res.status(403).json({ message: 'Access denied. Users only.' });
    }
    next();
};

module.exports = {
    authenticateToken,
    authorizeAdmin,
    authorizeUser,
};
