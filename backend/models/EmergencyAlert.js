const mongoose = require('mongoose');

const EmergencyAlertSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' }, // Optional if alert is outside a bus
    type: { type: String, enum: ['SOS', 'Medical', 'Security', 'Accident'], required: true },
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        address: { type: String }
    },
    status: { type: String, enum: ['Active', 'Dispatched', 'Resolved', 'False Alarm'], default: 'Active' },
    notifiedContacts: [{
        name: { type: String },
        phone: { type: String },
        notifiedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('EmergencyAlert', EmergencyAlertSchema);
