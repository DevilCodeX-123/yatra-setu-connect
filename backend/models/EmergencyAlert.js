const mongoose = require('mongoose');

const EmergencyAlertSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Snapshot of current driver
    conductor: { type: String }, // Snapshot of conductor name
    description: { type: String },
    type: { type: String, enum: ['SOS', 'Medical', 'Security', 'Accident'], required: true },
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        address: { type: String }
    },
    status: { type: String, enum: ['Active', 'Dispatched', 'Resolved', 'False Alarm'], default: 'Active' },
    resolutionNotes: { type: String },
    notifiedContacts: [{
        name: { type: String },
        phone: { type: String },
        notifiedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('EmergencyAlert', EmergencyAlertSchema);
