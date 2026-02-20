const mongoose = require('mongoose');

const BusSchema = new mongoose.Schema({
    busNumber: { type: String, required: true, unique: true }, // Renamed from busId
    operator: { type: String, required: true, default: 'Yatra Setu' }, // Added operator
    route: {
        from: { type: String, required: true },
        to: { type: String, required: true },
        stops: [{
            name: { type: String, required: true },
            lat: { type: Number, required: true },
            lng: { type: Number, required: true }
        }]
    },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    type: { type: String, required: true }, // Express, Ordinary, Volvo AC
    price: { type: Number, required: true, default: 0 }, // Added price
    totalSeats: { type: Number, required: true, default: 42 },
    availableSeats: { type: Number, required: true, default: 42 },
    amenities: [{ type: String }], // Added amenities (WiFi, AC, Charging, etc.)
    km: { type: Number },
    status: { type: String, default: 'On Time' }, // On Time, Delayed, Full
    liveLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        lastUpdated: { type: Date }
    } // Added live location tracking
}, { timestamps: true });

module.exports = mongoose.model('Bus', BusSchema);
