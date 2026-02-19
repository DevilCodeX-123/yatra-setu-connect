const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const Bus = require('../models/Bus');

// Get all bookings for the user
router.get('/', async (req, res) => {
    try {
        const user = await User.findOne({ email: 'john.doe@government.in' });
        const bookings = await Booking.find({ user: user._id }).populate('bus');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new booking
router.post('/', async (req, res) => {
    const { busId, passengerDetails, date, seatNumber, amount } = req.body;

    try {
        const user = await User.findOne({ email: 'john.doe@government.in' });
        const bus = await Bus.findById(busId);

        if (!bus || bus.availableSeats <= 0) {
            return res.status(400).json({ message: 'Bus not available' });
        }

        const pnr = 'YS' + Date.now().toString().slice(-10);

        const booking = new Booking({
            pnr,
            user: user._id,
            bus: bus._id,
            passengerDetails,
            date,
            seatNumber,
            amount
        });

        await booking.save();

        // Update bus availability
        bus.availableSeats -= 1;
        await bus.save();

        res.status(201).json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify ticket by PNR
router.get('/verify/:pnr', async (req, res) => {
    try {
        const booking = await Booking.findOne({ pnr: req.params.pnr }).populate('bus');
        if (!booking) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
