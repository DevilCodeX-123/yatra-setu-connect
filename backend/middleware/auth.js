const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'yatra-setu-secret-key-2024';

/**
 * Verify JWT token from Authorization header
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        // Allow unauthenticated access to demo endpoints in development
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

/**
 * Require authentication (no anonymous access)
 */
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    next();
};

/**
 * Require specific roles
 * Usage: requireRole('Owner', 'Admin')
 */
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    const userRole = req.user.role || '';
    const allowed = roles.some(r => userRole.includes(r));
    if (!allowed) {
        return res.status(403).json({ message: `Access denied. Required role: ${roles.join(' or ')}` });
    }
    next();
};

module.exports = { verifyToken, requireAuth, requireRole, JWT_SECRET };
