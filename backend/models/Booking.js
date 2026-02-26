const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    pnr: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    passengers: [{
        name: { type: String },
        age: { type: Number },
        gender: { type: String },
        seatNumber: { type: String }
    }],
    bookingType: { type: String, enum: ['Seat', 'FullBus'], default: 'Seat' },
    rentalDetails: {
        startDate: { type: Date },
        endDate: { type: Date },
        startTime: { type: String },
        isRoundTrip: { type: Boolean, default: true },
        fromLocation: { type: String },
        destination: { type: String },
        purpose: { type: String },
        estimatedKm: { type: Number, default: 0 },
        hoursRequested: { type: Number, default: 24 },
        fuelPrice: { type: Number, default: 100 },
        calculatedFuelCost: { type: Number, default: 0 },
        returnCharge: { type: Number, default: 0 }
    },
    date: { type: Date, required: true },
    status: {
        type: String,
        required: true,
        default: 'Upcoming',
        enum: ['Upcoming', 'Completed', 'Cancelled', 'PendingOwner', 'Accepted', 'Rejected', 'Confirmed']
    },
    paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed', 'DepositPaid'], default: 'Pending' },
    isDepositPaid: { type: Boolean, default: false },
    amount: { type: Number, required: true },
    depositAmount: { type: Number },
    bookingSource: { type: String, enum: ['Online', 'Employee', 'Agent'], default: 'Online' },
    paymentMethod: { type: String, enum: ['Online', 'Cash', 'UPI'], default: 'Online' }
}, { timestamps: true });


module.exports = mongoose.model('Booking', BookingSchema);
