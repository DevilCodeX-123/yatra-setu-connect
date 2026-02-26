const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
    amount: { type: Number, required: true },
    category: {
        type: String,
        enum: ['Fuel', 'Toll', 'Maintenance', 'Salary', 'Other'],
        required: true
    },
    date: { type: Date, required: true },
    description: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed } // To store things like empId, month
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);
