const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get user profile (Demo mode)
router.get('/profile', async (req, res) => {
    try {
        // For demo, we'll just get the first user or a mock one
        let user = await User.findOne({ email: 'john.doe@government.in' });
        if (!user) {
            user = new User({
                name: 'John Doe',
                email: 'john.doe@government.in',
                phone: '+91 98765 43210',
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

// Update user profile
router.put('/profile', async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            { email: 'john.doe@government.in' },
            req.body,
            { new: true, upsert: true }
        );
        res.json(user);
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
