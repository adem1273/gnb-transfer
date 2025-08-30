const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
const User = require('../models/User');

// Admin AI Asistanı için daha dinamik ve birleşik fonksiyon
exports.getAdminAssistantResponse = async (req, res) => {
    const { command } = req.body;
    let result = '';

    try {
        if (!command) {
            return res.status(400).json({ message: 'Command is required.' });
        }

        // Komut işleme
        if (command.toLowerCase().includes('top tours')) {
            const topTours = await Booking.aggregate([
                { $group: { _id: '$tourId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 3 },
                { $lookup: { from: 'tours', localField: '_id', foreignField: '_id', as: 'tourDetails' } },
                { $unwind: '$tourDetails' },
                { $project: { _id: 0, title: '$tourDetails.title', bookings: '$count' } }
            ]);
            result = "Top 3 most booked tours:\n" + topTours.map(t => `- ${t.title} (${t.bookings} bookings)`).join('\n');
        } else if (command.toLowerCase().includes('total users')) {
            const count = await User.countDocuments();
            result = `Total number of users: ${count}`;
        } else if (command.toLowerCase().includes('revenue')) {
            const totalRevenue = await Booking.aggregate([
                { $lookup: { from: 'tours', localField: 'tourId', foreignField: '_id', as: 'tourDetails' } },
                { $unwind: '$tourDetails' },
                { $group: { _id: null, total: { $sum: '$tourDetails.price' } } }
            ]);
            result = `Total estimated revenue from bookings: $${totalRevenue[0]?.total || 0}`;
        } else {
            result = "Command not recognized. Try 'total users', 'top tours', or 'revenue'.";
        }

        res.json({ result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to process command.' });
    }
};

// Pazarlama önerilerini getir
exports.getMarketingSuggestions = async (req, res) => {
    try {
        const totalBookings = await Booking.countDocuments();
        const popularTours = await Booking.aggregate([
            { $group: { _id: '$tourId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
        const popularTourId = popularTours[0]?._id;
        const popularTour = await Tour.findById(popularTourId);

        let suggestions = "Based on current data, here are some marketing suggestions:\n";
        if (totalBookings > 5) {
            suggestions += `\n1. Run a campaign promoting the most popular tour: "${popularTour?.title || 'N/A'}".`;
        }
        if (totalBookings > 10) {
            suggestions += `\n2. Offer a loyalty discount to frequent bookers (those with more than 5 bookings).`;
        }
        suggestions += "\n3. Create blog content around popular destinations to attract organic traffic.";

        res.json({ suggestions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch marketing suggestions.' });
    }
};