const Review = require('../models/reviewModel');

// Tüm geri bildirimleri getir
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch reviews.' });
    }
};

// Yeni geri bildirim oluştur
exports.createReview = async (req, res) => {
    try {
        const { name, comment, rating } = req.body;
        if (!name || !comment || !rating) {
            return res.status(400).json({ message: 'Name, comment, and rating are required.' });
        }
        const newReview = await Review.create({ name, comment, rating });
        res.status(201).json(newReview);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create review.' });
    }
};

// Öne çıkan geri bildirimleri getir
exports.getFeaturedReviews = async (req, res) => {
    try {
        const reviews = await Review.find().sort({ rating: -1, createdAt: -1 }).limit(3);
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch featured reviews.' });
    }
};