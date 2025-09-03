const Booking = require('../models/Booking');
const Tour = require('../models/Tour');

// Yeni rezervasyon oluştur
exports.createBooking = async (req, res) => {
  const { name, email, tourId, paymentMethod } = req.body;
  
  if (!name || !email || !tourId) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const tour = await Tour.findById(tourId);
    if (!tour) return res.status(404).json({ message: 'Tour not found.' });

    const status = paymentMethod === 'cash' ? 'pending' : 'confirmed';

    const booking = await Booking.create({ name, email, tourId, paymentMethod, status });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create booking.', error: err.message });
  }
};

// Tüm rezervasyonları listele (Admin)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('tourId', 'title price');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings.' });
  }
};

// ID'ye göre rezervasyonu getir
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('tourId', 'title price');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch booking.' });
  }
};

// Rezervasyonu sil
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    res.json({ message: 'Booking deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete booking.' });
  }
};
