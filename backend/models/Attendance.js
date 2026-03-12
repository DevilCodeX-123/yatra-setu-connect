const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    employeeSubdocId: { type: String }, // bus.employees subdoc _id (for non-registered drivers)
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employeeName: { type: String }, // snapshot for display
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    checkIn: { type: Date },
    checkOut: { type: Date },
    hoursWorked: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 }, // hours beyond standard shift
    present: { type: Boolean, default: true },
    dailySalary: { type: Number, default: 0 },   // snapshot of per-day salary at time of record
    overtimeRatePerHour: { type: Number, default: 0 }, // per-hour overtime rate
    notes: { type: String },
}, { timestamps: true });

// Unique per employee (subdoc or user) per bus per date
AttendanceSchema.index({ employeeSubdocId: 1, bus: 1, date: 1 }, { unique: true, sparse: true });
AttendanceSchema.index({ employee: 1, bus: 1, date: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
