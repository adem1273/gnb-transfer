const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
const User = require('../models/User');

// Daha gelişmiş müşteri segmentasyonu
exports.getCustomerSegments = async (req, res) => {
    try {
        const users = await User.find();
        const segments = {
            vip: [],
            frequent: [],
            occasional: [],
            new: []
        };

        for (const user of users) {
            const bookingCount = await Booking.countDocuments({ email: user.email });
            if (bookingCount >= 10) segments.vip.push({ id: user._id, email: user.email, bookingCount });
            else if (bookingCount >= 5) segments.frequent.push({ id: user._id, email: user.email, bookingCount });
            else if (bookingCount >= 2) segments.occasional.push({ id: user._id, email: user.email, bookingCount });
            else segments.new.push({ id: user._id, email: user.email, bookingCount });
        }

        res.json(segments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to analyze customer segments.' });
    }
};

// Basit "popüler" tur öneri sistemi (en çok rezervasyon yapılan turları önerir)
exports.getTourRecommendations = async (req, res) => {
    try {
        const popularTours = await Booking.aggregate([
            { $group: { _id: '$tourId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'tours', localField: '_id', foreignField: '_id', as: 'tourDetails' } },
            { $unwind: '$tourDetails' },
            { $project: { _id: 0, tourId: '$_id', title: '$tourDetails.title', bookingCount: '$count' } }
        ]);
        
        res.json(popularTours);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch tour recommendations.' });
    }
};

// Admin asistanı için örnek fonksiyon
exports.getAdminAssistantResponse = async (req, res) => {
    const { command } = req.body;
    let result = '';

    // Basit komut işleme mantığı
    if (command.toLowerCase().includes('top 5 tours')) {
        const topTours = await Tour.find().sort({ price: -1 }).limit(5);
        result = "Top 5 most expensive tours: \n" + topTours.map(t => `${t.title} - $${t.price}`).join('\n');
    } else if (command.toLowerCase().includes('total users')) {
        const count = await User.countDocuments();
        result = `Total number of users: ${count}`;
    } else {
        result = "Command not recognized. Please try 'total users' or 'top 5 tours'.";
    }

    res.json({ result });
};

// Pazarlama önerileri için örnek fonksiyon
exports.getMarketingSuggestions = async (req, res) => {
    const totalBookings = await Booking.countDocuments();
    const suggestions = `Based on current data:
    1. Run a campaign targeting new users.
    2. Offer a discount on tours with low booking numbers.
    3. Promote the most popular tours to increase sales further.`;
    
    res.json({ suggestions });
};