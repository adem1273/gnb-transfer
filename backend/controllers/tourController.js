const Tour = require('../models/tour');
const Booking = require('../models/Booking');

// Tüm turları listele
exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find();
    res.json(tours);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tours.' });
  }
};

// ID'ye göre turu getir
exports.getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ message: 'Tour not found.' });
    res.json(tour);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tour.' });
  }
};

// Yeni tur oluştur (admin yetkisi gerekir)
exports.createTour = async (req, res) => {
  const { title, description, price, duration, discount, isCampaign, ...translations } = req.body;
  if (!title || !price || !duration) {
    return res.status(400).json({ message: 'Title, price and duration are required.' });
  }

  try {
    const tour = await Tour.create({ title, description, price, duration, discount, isCampaign, ...translations });
    res.status(201).json(tour);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create tour.' });
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

// Tur güncelle (admin yetkisi gerekir)
exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tour) return res.status(404).json({ message: 'Tour not found.' });
    res.json(tour);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update tour.' });
  }
};

// Kampanyalı turları listele
exports.getCampaignTours = async (req, res) => {
    try {
        const campaignTours = await Tour.find({ isCampaign: true });
        res.json(campaignTours);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch campaign tours.' });
    }
};

// En çok satan turları getir (Yeni)
exports.getMostPopularTours = async (req, res) => {
  try {
    const mostPopularTours = await Booking.aggregate([
      { $group: { _id: '$tourId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      { $lookup: { from: 'tours', localField: '_id', foreignField: '_id', as: 'tourDetails' } },
      { $unwind: '$tourDetails' },
      { $project: { _id: 0, ...'$tourDetails' } }
    ]);
    res.json(mostPopularTours);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch most popular tours.' });
  }
};

// İndirimli fiyatı hesaplayan ve döndüren bir yardımcı fonksiyon
const getDiscountedPrice = (price, discount) => {
    if (discount <= 0 || discount >= 100) {
        return price;
    }
    return price - (price * discount / 100);
};

// Bir turun indirimli fiyatını getiren rota
exports.getDiscountedPriceForTour = async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id);
        if (!tour) return res.status(404).json({ message: 'Tour not found.' });
        
        const discountedPrice = getDiscountedPrice(tour.price, tour.discount);
        res.json({ originalPrice: tour.price, discountedPrice, discount: tour.discount });
    } catch (err) {
        res.status(500).json({ message: 'Failed to calculate discounted price.' });
    }
};
