const mongoose = require('mongoose');

const SeatSchema = new mongoose.Schema({
    number: { type: Number, required: true },
    status: { type: String, enum: ['Available', 'Booked', 'Cash', 'Locked'], default: 'Available' },
    reservedFor: { type: String, enum: ['general', 'women', 'elderly', 'disabled'], default: 'general' },
    passenger: { type: String },
}, { _id: false });

const StopSchema = new mongoose.Schema({
    name: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    price: { type: Number, default: 0 },
    sequence: { type: Number },
}, { _id: false });

const BusSchema = new mongoose.Schema({
    busNumber: { type: String, required: true, unique: true },
    name: { type: String },
    operator: { type: String },
    type: { type: String, enum: ['AC', 'Non-AC', 'Express', 'Volvo', 'Ordinary', 'Sleeper'], default: 'Ordinary' },
    status: { type: String, enum: ['Active', 'Inactive', 'Maintenance'], default: 'Active' },
    totalSeats: { type: Number, default: 40 },
    seats: [SeatSchema],
    pricePerKm: { type: Number, default: 1.2 },
    activationCode: { type: String },
    km: { type: Number, default: 0 },
    rating: { type: Number, default: 4.0 },
    departureTime: { type: String },
    arrivalTime: { type: String },
    date: { type: String },
    route: {
        from: { type: String },
        to: { type: String },
        stops: [StopSchema],
    },
    liveLocation: {
        lat: { type: Number },
        lng: { type: Number },
        source: { type: String, enum: ['gps', 'driver', 'conductor', 'manual'] },
        updatedAt: { type: Date },
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Bus', BusSchema);


