const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Credit', 'Debit'], required: true },
    amount: { type: Number, required: true },
    source: { type: String, required: true }, // e.g., 'Added via UPI', 'Bus Ticket - Mysuru'
    status: { type: String, enum: ['Success', 'Pending', 'Failed'], default: 'Success' },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
