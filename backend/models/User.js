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
    password: { type: String, required: true },
    age: { type: Number },
    gender: { type: String },
    isPhysicallyAbled: { type: Boolean, default: false },
    phone: { type: String },
    role: { type: String, enum: ['Passenger', 'Employee', 'Admin', 'Owner', 'Owner+Employee'], default: 'Passenger' }, // Updated roles
    walletBalance: { type: Number, default: 0 },
    identityVerified: { type: Boolean, default: false },
    address: {
        city: { type: String },
        state: { type: String }
    },
    profileImage: { type: String },
    upiId: { type: String },
    activationCode: { type: String },
    assignedBus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
    savedPassengers: [PassengerSchema],
    pnrHistory: [{ type: String }]
}, {
    timestamps: true,
    bufferCommands: false // Disable buffering on this schema
});

module.exports = mongoose.model('User', UserSchema);
