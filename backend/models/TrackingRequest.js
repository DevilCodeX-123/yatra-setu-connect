const mongoose = require('mongoose');

const TrackingRequestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
    message: { type: String },
    requestedAt: { type: Date, default: Date.now },
    handledAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('TrackingRequest', TrackingRequestSchema);
