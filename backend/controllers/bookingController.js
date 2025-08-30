const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
// E-posta gönderme işlevi için nodemailer veya benzeri bir kütüphane kullanılabilir.
// Bu örnekte, e-posta gönderme fonksiyonunun var olduğu varsayılmıştır.
// const sendEmail = require('../utils/sendEmail');

// Yeni rezervasyon oluştur
exports.createBooking = async (req, res) => {
  const { name, email, tourId, paymentMethod } = req.body;
  
  if (!name || !email || !tourId) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found.' });
    }

    const status = paymentMethod === 'cash' ? 'pending' : 'confirmed';

    const booking = await Booking.create({ name, email, tourId, paymentMethod, status });

    // Kişiselleştirilmiş hoş geldin e-postası gönder
    // try {
    //     await sendEmail({
    //         to: email,
    //         subject: 'Rezervasyonunuz Onaylandı - GNB Transfer',
    //         html: `<h1>Merhaba ${name},</h1>
    //                <p>Rezervasyonunuz başarıyla oluşturuldu. Turunuz: ${tour.title}</p>
    //                <p>Size daha iyi hizmet verebilmek için sabırsızlanıyoruz.</p>`
    //     });
    // } catch (emailError) {
    //     console.error('Email sending failed:', emailError);
    //     // E-posta gönderilemese bile rezervasyonun başarılı olması önemlidir
    // }

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create booking.', error: err.message });
  }
};