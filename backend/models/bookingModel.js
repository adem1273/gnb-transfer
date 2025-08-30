const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
    date: { type: Date, default: Date.now },
    guests: { type: Number, default: 1 },
    // Yeni alan: Ödeme Yöntemi
    paymentMethod: { type: String, enum: ['cash', 'credit_card'], default: 'cash' }, 
    // Opsiyonel: Rezervasyon durumu
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }, 
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);