const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['Booking', 'Payment', 'Bus Issue', 'Other'], default: 'Other' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
    attachments: [{ type: String }] // URLs to images or documents
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
