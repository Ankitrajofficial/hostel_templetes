const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        if (!user.isActive) {
            return res.status(401).json({ message: 'Account is deactivated' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Check if user has required role
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Access denied. Insufficient permissions.' 
            });
        }
        next();
    };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: 'Access denied. Admin only.' 
        });
    }
    next();
};

// Check if user is admin or manager
const isAdminOrManager = (req, res, next) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ 
            message: 'Access denied. Admin or Manager only.' 
        });
    }
    next();
};

// Allow viewer to access admin panel (read-only)
const canAccessAdmin = (req, res, next) => {
    if (!['admin', 'manager', 'viewer'].includes(req.user.role)) {
        return res.status(403).json({ 
            message: 'Access denied.' 
        });
    }
    next();
};

// Block viewers from making changes (POST, PUT, DELETE, PATCH)
const blockViewerWrites = (req, res, next) => {
    if (req.user.role === 'viewer' && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        return res.status(403).json({ 
            message: 'Demo mode: Changes are not allowed. This is a read-only account.'
        });
    }
    next();
};

module.exports = { auth, requireRole, isAdmin, isAdminOrManager, canAccessAdmin, blockViewerWrites };
