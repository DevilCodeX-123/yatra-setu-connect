const mongoose = require('mongoose');

const PassengerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    relation: { type: String },
    status: { type: String, default: 'Pending' }
});

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    walletBalance: { type: Number, default: 0 },
    identityVerified: { type: Boolean, default: false },
    savedPassengers: [PassengerSchema],
    pnrHistory: [{ type: String }] // Store PNR numbers of bookings
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
