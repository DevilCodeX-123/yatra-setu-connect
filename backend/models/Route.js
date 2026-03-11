const mongoose = require('mongoose');

const StopSchema = new mongoose.Schema({
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    order: { type: Number },
    priceFromPrev: { type: Number, default: 0 },   // ₹ from previous stop
    minsFromPrev: { type: Number, default: 0 },    // estimated travel mins from prev stop
    arrivalTime: { type: String, default: '' }    // HH:MM, computed on activation
}, { _id: false });

const VariantSchema = new mongoose.Schema({
    stops: [StopSchema],
    startTime: { type: String, default: '' },     // HH:MM, when the variant departs
    isLive: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    busAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', default: null },
    label: { type: String, default: '' }      // e.g. "A → B" or "B → A"
}, { _id: true });

const RouteSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.Mixed, required: true }, // Mixed to support both ObjectId and demo string IDs
    name: { type: String, default: '' },        // user-defined name for the route
    from: { type: String, required: true },
    to: { type: String, required: true },
    variants: [VariantSchema],                      // [0] = forward, [1] = reverse
    isBlocked: { type: Boolean, default: false },   // master block for whole route
}, { timestamps: true });

module.exports = mongoose.model('Route', RouteSchema);
