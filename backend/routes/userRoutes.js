const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { verifyToken, requireAuth, JWT_SECRET } = require('../middleware/auth');

// Signup Route
router.post('/signup', async (req, res) => {
    console.log("POST /api/users/signup", req.body);

    // If DB is down, simulate success for demo
    if (mongoose.connection.readyState !== 1) {
        console.log("📢 DB down, performing Demo Signup");
        const demoUser = {
            id: 'demo-' + Date.now(),
            name: req.body.name || 'Demo User',
            email: req.body.email,
            role: req.body.role || 'Passenger',
            walletBalance: 0
        };
        const token = jwt.sign(demoUser, JWT_SECRET);
        return res.status(201).json({ token, user: demoUser, demo: true });
    }

    try {
        const { name, email, password, age, gender, isPhysicallyAbled, role, phone, upiId } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name, email, password: hashedPassword,
            age, gender, isPhysicallyAbled,
            phone, upiId,
            walletBalance: 0,
            role: role || 'Passenger'
        });

        await user.save();

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const userData = user.toObject();
        delete userData.password;

        res.status(201).json({ token, user: userData });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // If DB is down, perform Demo Login
    if (mongoose.connection.readyState !== 1) {
        console.log("📢 DB down, performing Demo Login");
        const demoUser = {
            id: 'demo-123',
            name: 'Yatra Setu Admin',
            email: email,
            role: email.includes('admin') ? 'Admin' : 'Passenger',
            walletBalance: 2500
        };
        const token = jwt.sign(demoUser, JWT_SECRET);
        return res.json({ token, user: demoUser, demo: true });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const userData = user.toObject();
        delete userData.password;

        res.json({ token, user: userData });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user profile
router.get('/profile', verifyToken, requireAuth, async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.json({ ...req.user, walletBalance: 2500, phone: '9988776655', upiId: 'demo@ybl' });
    }
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user transactions
router.get('/transactions', verifyToken, requireAuth, async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.json([
            { id: 't1', type: 'Credit', amount: 500, source: 'UPI', status: 'Success', createdAt: new Date() },
            { id: 't2', type: 'Debit', amount: 150, source: 'Bus Booking', status: 'Success', createdAt: new Date() }
        ]);
    }
    try {
        const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Top up wallet
router.post('/wallet/topup', verifyToken, requireAuth, async (req, res) => {
    const { amount, source } = req.body;
    if (mongoose.connection.readyState !== 1) {
        return res.json({ user: { walletBalance: 3000 }, transaction: { id: 'demo-t', amount, status: 'Success' } });
    }
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.walletBalance += Number(amount);
        await user.save();

        const transaction = new Transaction({
            user: user._id,
            type: 'Credit',
            amount: Number(amount),
            source: source || 'Added via UPI',
            status: 'Success'
        });
        await transaction.save();

        res.json({ user: { walletBalance: user.walletBalance }, transaction });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
