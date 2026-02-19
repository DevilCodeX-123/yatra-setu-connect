const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Signup Route
router.post('/signup', async (req, res) => {
    console.log("POST /api/users/signup", req.body);

    // Fail fast if database is not connected
    if (mongoose.connection.readyState !== 1) {
        console.error("❌ Database not connected (readyState: " + mongoose.connection.readyState + ")");
        return res.status(503).json({ message: "Database connection in progress. Please try again in a moment." });
    }

    try {
        const { name, email, password, age, gender, isPhysicallyAbled } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        user = new User({
            name,
            email,
            password: hashedPassword,
            age,
            gender,
            isPhysicallyAbled, // Note: Ensure this is in the model if you want to save it
            walletBalance: 0,
            role: 'Passenger'
        });

        await user.save();
        res.status(201).json({ message: 'User created successfully', userId: user._id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    console.log("POST /api/users/login", req.body.email);
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Return user data (excluding password)
        const userData = user.toObject();
        delete userData.password;

        res.json(userData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Get user profile (Demo mode)
router.get('/profile', async (req, res) => {
    try {
        let user = await User.findOne({ email: 'john.doe@government.in' });
        if (!user) {
            user = new User({
                name: 'John Doe',
                email: 'john.doe@government.in',
                password: 'password123',
                phone: '+91 98765 43210',
                role: 'Passenger',
                walletBalance: 1350,
                identityVerified: true,
                savedPassengers: [
                    { name: "Anita Doe", age: 32, gender: "Female", relation: "Spouse", status: "Verified" }
                ]
            });
            await user.save();
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user transactions
router.get('/transactions', async (req, res) => {
    try {
        const user = await User.findOne({ email: 'john.doe@government.in' });
        const transactions = await Transaction.find({ user: user._id }).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Top up wallet
router.post('/wallet/topup', async (req, res) => {
    const { amount, source } = req.body;
    try {
        const user = await User.findOne({ email: 'john.doe@government.in' });
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

        res.json({ user, transaction });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add passenger
router.post('/passengers', async (req, res) => {
    try {
        const user = await User.findOne({ email: 'john.doe@government.in' });
        user.savedPassengers.push(req.body);
        await user.save();
        res.json(user.savedPassengers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
