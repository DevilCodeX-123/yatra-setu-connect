const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    pnr: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    passengerDetails: {
        name: { type: String, required: true },
        age: { type: Number, required: true },
        gender: { type: String, required: true }
    },
    date: { type: Date, required: true },
    seatNumber: { type: String, required: true },
    status: { type: String, required: true, default: 'Upcoming' }, // Upcoming, Completed, Cancelled
    amount: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
