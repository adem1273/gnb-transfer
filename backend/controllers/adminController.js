const User = require('../models/User');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');

// Tüm kullanıcıları listele (admin yetkisi gerekir)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
};

// Tüm turları listele (admin yetkisi gerekir)
exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find();
    res.json(tours);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tours.' });
  }
};

// Yeni tur oluştur (admin yetkisi gerekir)
exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json(newTour);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create tour.' });
  }
};

// Tur güncelle (admin yetkisi gerekir)
exports.updateTour = async (req, res) => {
  try {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTour) return res.status(404).json({ message: 'Tour not found.' });
    res.json(updatedTour);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update tour.' });
  }
};

// Tur sil (admin yetkisi gerekir)
exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) return res.status(404).json({ message: 'Tour not found.' });
    res.json({ message: 'Tour deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete tour.' });
  }
};

// Tüm rezervasyonları listele (admin yetkisi gerekir)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('tourId', 'title price');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings.' });
  }
};

// Kullanıcı sil (admin yetkisi gerekir)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user.' });
  }
};

// Rezervasyon sil (admin yetkisi gerekir)
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    res.json({ message: 'Booking deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete booking.' });
  }
};
