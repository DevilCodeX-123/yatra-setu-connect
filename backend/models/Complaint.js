const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional if anonymous
    userName: { type: String },
    userPhone: { type: String },
    type: { type: String, enum: ['Complaint', 'Suggestion'], default: 'Complaint' },
    category: { type: String, enum: ['Driver Behavior', 'Bus Condition', 'Delay', 'Staff Behavior', 'AC/Heat', 'Cleanliness', 'Other'], default: 'Other' },
    description: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Reviewed', 'Resolved'], default: 'Pending' },
    response: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);
