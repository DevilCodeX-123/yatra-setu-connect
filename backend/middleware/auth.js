const jwt = require('jsonwebtoken');
const User = require('../models/User');
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
        console.error('🔒 Auth Error (Invalid Token):', err.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

/**
 * Require authentication (no anonymous access)
 */
const requireAuth = (req, res, next) => {
    if (!req.user) {
        console.warn('🔒 Auth Warning: Anonymous access attempt to protected route');
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
        console.warn('🔒 Auth Warning: No user in request for role-protected route');
        return res.status(401).json({ message: 'Authentication required' });
    }
    const userRole = req.user.role || '';
    const allowed = roles.some(r => userRole.includes(r));
    if (!allowed) {
        console.error(`🔒 Auth Error: Role mismatch. User role: "${userRole}", Expected one of: ${roles.join(', ')}`);
        return res.status(403).json({ message: `Access denied. Required role: ${roles.join(' or ')}` });
    }
    next();
};

/**
 * Resolves a demo user string ID to a persistent database ObjectId.
 * If the user is not a demo user, returns the original ID.
 */
const resolveUserId = async (reqUser) => {
    let owner = reqUser.id;
    if (String(owner).startsWith('demo-')) {
        let demoBackup = await User.findOne({ email: 'demo-owner@yatrasetu.in' });
        if (!demoBackup) {
            demoBackup = await User.create({
                name: "Demo User",
                email: "demo-owner@yatrasetu.in",
                password: "demo-password-123",
                role: "Owner",
                phone: "9988776655"
            });
        }
        return demoBackup._id;
    }
    return owner;
};

module.exports = { verifyToken, requireAuth, requireRole, resolveUserId, JWT_SECRET };
