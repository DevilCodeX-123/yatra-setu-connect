const mongoose = require('mongoose');

const BusSchema = new mongoose.Schema({
    busId: { type: String, required: true, unique: true },
    route: {
        from: { type: String, required: true },
        to: { type: String, required: true }
    },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    type: { type: String, required: true }, // Express, Ordinary, Volvo AC
    totalSeats: { type: Number, required: true, default: 42 },
    availableSeats: { type: Number, required: true, default: 42 },
    km: { type: Number },
    status: { type: String, default: 'On Time' } // On Time, Delayed, Full
}, { timestamps: true });

module.exports = mongoose.model('Bus', BusSchema);
