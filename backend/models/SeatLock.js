const mongoose = require('mongoose');

const SeatLockSchema = new mongoose.Schema({
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    seatNumber: { type: Number, required: true },
    lockerId: { type: String, required: true }, // unique session/user ID
    createdAt: { type: Date, default: Date.now, expires: 300 } // Auto-delete after 300 seconds (5 mins)
});

// Compound index to prevent duplicate locks on the same seat
SeatLockSchema.index({ busId: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('SeatLock', SeatLockSchema);
