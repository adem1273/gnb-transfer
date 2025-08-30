const User = require('../models/userModel');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Anasayfa API
exports.getHome = (req, res) => {
    res.json({ message: 'Welcome to GNB Pro API Final Version' });
};

// Stripe ödeme oluştur
exports.createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency = 'usd' } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({ amount, currency });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};