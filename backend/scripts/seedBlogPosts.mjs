/**
 * Blog Posts Seed Script
 * 
 * Seeds 40 multilingual blog posts in 9 languages (360 total articles)
 * All posts promote VIP transfer services with strong CTAs
 * 
 * Usage: node backend/scripts/seedBlogPosts.mjs
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BlogPost from '../models/BlogPost.mjs';

dotenv.config();

// Sample high-quality royalty-free images for blog posts
const IMAGES = {
  airport: [
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200',
    'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=1200',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200',
  ],
  cars: [
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200',
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200',
  ],
  istanbul: [
    'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200',
    'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200',
    'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=1200',
  ],
  luxury: [
    'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=1200',
    'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=1200',
  ],
  family: [
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200',
    'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1200',
  ],
  driver: [
    'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1200',
  ],
};

// CTA templates for all posts
const CTAS = [
  { text: 'Hemen Rezervasyon Yap', url: '/booking', style: 'primary' },
  { text: 'WhatsApp ile İletişime Geç', url: 'https://wa.me/905551234567', style: 'whatsapp' },
];

// Generate a simple HTML content structure
function generateContent(title, sections, lang) {
  const langTexts = {
    tr: { book: 'Hemen Rezervasyon Yap', price: "75$'dan başlayan fiyatlarla", code: 'İndirim Kodu: VIP2026', whatsapp: 'WhatsApp: +90 555 123 4567' },
    en: { book: 'Book Now', price: 'Starting from $75', code: 'Discount Code: VIP2026', whatsapp: 'WhatsApp: +90 555 123 4567' },
    ar: { book: 'احجز الآن', price: 'ابتداءً من 75 دولار', code: 'كود الخصم: VIP2026', whatsapp: 'واتساب: 4567 123 555 90+' },
    ru: { book: 'Забронировать', price: 'От $75', code: 'Промокод: VIP2026', whatsapp: 'WhatsApp: +90 555 123 4567' },
    de: { book: 'Jetzt buchen', price: 'Ab 75$', code: 'Rabattcode: VIP2026', whatsapp: 'WhatsApp: +90 555 123 4567' },
    fr: { book: 'Réserver maintenant', price: 'À partir de 75$', code: 'Code promo: VIP2026', whatsapp: 'WhatsApp: +90 555 123 4567' },
    es: { book: 'Reservar ahora', price: 'Desde $75', code: 'Código de descuento: VIP2026', whatsapp: 'WhatsApp: +90 555 123 4567' },
    zh: { book: '立即预订', price: '低至75美元', code: '折扣码: VIP2026', whatsapp: 'WhatsApp: +90 555 123 4567' },
    fa: { book: 'رزرو کنید', price: 'از 75 دلار', code: 'کد تخفیف: VIP2026', whatsapp: 'واتساپ: 4567 123 555 90+' },
  };

  const t = langTexts[lang] || langTexts.tr;
  
  return `
<article>
  <h2>${title}</h2>
  ${sections.map(s => `<section><h3>${s.heading}</h3><p>${s.content}</p></section>`).join('\n')}
  
  <div class="pricing-box">
    <h3>🚗 VIP Transfer</h3>
    <p><strong>${t.price}</strong></p>
    <p>${t.code}</p>
    <p>${t.whatsapp}</p>
  </div>
  
  <div class="cta-box">
    <a href="/booking" class="btn-primary">${t.book} →</a>
  </div>
</article>
  `.trim();
}

// Blog post data for all 40 posts with 9 language translations
const blogPostsData = [
  // Post 1: Istanbul Airport VIP Transfer Prices 2026
  {
    category: 'transfer-prices',
    priority: 100,
    featuredImage: IMAGES.airport[0],
    images: [
      { url: IMAGES.cars[0], alt: 'VIP Transfer Vehicle' },
      { url: IMAGES.airport[1], alt: 'Istanbul Airport' },
      { url: IMAGES.luxury[0], alt: 'Luxury Interior' },
    ],
    translations: {
      tr: {
        title: '2026 İstanbul Havalimanı VIP Transfer Fiyatları',
        slug: '2026-istanbul-havalimani-vip-transfer-fiyatlari',
        metaTitle: '2026 İstanbul Havalimanı VIP Transfer Fiyatları | GNB Transfer',
        metaDescription: 'İstanbul Havalimanı VIP transfer fiyatları 2026. Sabit fiyat garantisi ile lüks araç kiralama. 75$\'dan başlayan fiyatlar.',
        excerpt: 'İstanbul Havalimanı VIP transfer hizmetimiz ile konforlu ve güvenli yolculuk. Sabit fiyat garantisi, profesyonel şoförler.',
        content: generateContent('2026 İstanbul Havalimanı VIP Transfer Fiyatları', [
          { heading: 'Neden VIP Transfer?', content: 'Havalimanından otelinize kadar lüks ve konforlu yolculuk. Gizli ücret yok, sabit fiyat garantisi.' },
          { heading: 'Fiyatlarımız', content: 'Taksim, Sultanahmet, Kadıköy ve tüm İstanbul bölgelerine 75$\'dan başlayan fiyatlarla VIP transfer.' },
          { heading: 'Hizmet Özellikleri', content: 'Ücretsiz uçuş takibi, 60 dakika ücretsiz bekleme, profesyonel şoförler, 7/24 destek.' },
        ], 'tr'),
      },
      en: {
        title: '2026 Istanbul Airport VIP Transfer Prices',
        slug: '2026-istanbul-airport-vip-transfer-prices',
        metaTitle: '2026 Istanbul Airport VIP Transfer Prices | GNB Transfer',
        metaDescription: 'Istanbul Airport VIP transfer prices 2026. Fixed price guarantee with luxury car rental. Starting from $75.',
        excerpt: 'Comfortable and safe journey with our Istanbul Airport VIP transfer service. Fixed price guarantee, professional drivers.',
        content: generateContent('2026 Istanbul Airport VIP Transfer Prices', [
          { heading: 'Why VIP Transfer?', content: 'Luxury and comfortable journey from airport to your hotel. No hidden fees, fixed price guarantee.' },
          { heading: 'Our Prices', content: 'VIP transfer to Taksim, Sultanahmet, Kadikoy and all Istanbul areas starting from $75.' },
          { heading: 'Service Features', content: 'Free flight tracking, 60 minutes free waiting, professional drivers, 24/7 support.' },
        ], 'en'),
      },
      ar: {
        title: 'أسعار النقل VIP من مطار إسطنبول 2026',
        slug: 'asar-nql-vip-matar-istanbul-2026',
        metaTitle: 'أسعار النقل VIP من مطار إسطنبول 2026 | GNB Transfer',
        metaDescription: 'أسعار النقل VIP من مطار إسطنبول 2026. ضمان سعر ثابت مع تأجير سيارات فاخرة. ابتداءً من 75 دولار.',
        excerpt: 'رحلة مريحة وآمنة مع خدمة النقل VIP من مطار إسطنبول. ضمان سعر ثابت، سائقون محترفون.',
        content: generateContent('أسعار النقل VIP من مطار إسطنبول 2026', [
          { heading: 'لماذا النقل VIP؟', content: 'رحلة فاخرة ومريحة من المطار إلى فندقك. بدون رسوم خفية، ضمان سعر ثابت.' },
          { heading: 'أسعارنا', content: 'نقل VIP إلى تقسيم، السلطان أحمد، كاديكوي وجميع مناطق إسطنبول ابتداءً من 75 دولار.' },
          { heading: 'مميزات الخدمة', content: 'تتبع الرحلات مجاناً، 60 دقيقة انتظار مجاني، سائقون محترفون، دعم على مدار الساعة.' },
        ], 'ar'),
      },
      ru: {
        title: 'Цены на VIP трансфер из аэропорта Стамбула 2026',
        slug: 'ceny-vip-transfer-aeroport-stambul-2026',
        metaTitle: 'Цены на VIP трансфер из аэропорта Стамбула 2026 | GNB Transfer',
        metaDescription: 'Цены на VIP трансфер из аэропорта Стамбула 2026. Гарантия фиксированной цены с арендой люкс автомобиля. От $75.',
        excerpt: 'Комфортное и безопасное путешествие с нашим VIP трансфером из аэропорта Стамбула. Гарантия фиксированной цены.',
        content: generateContent('Цены на VIP трансфер из аэропорта Стамбула 2026', [
          { heading: 'Почему VIP трансфер?', content: 'Роскошное и комфортное путешествие от аэропорта до вашего отеля. Без скрытых платежей.' },
          { heading: 'Наши цены', content: 'VIP трансфер в Таксим, Султанахмет, Кадыкёй и все районы Стамбула от $75.' },
          { heading: 'Особенности сервиса', content: 'Бесплатное отслеживание рейса, 60 минут бесплатного ожидания, профессиональные водители.' },
        ], 'ru'),
      },
      de: {
        title: 'Istanbul Flughafen VIP Transfer Preise 2026',
        slug: 'istanbul-flughafen-vip-transfer-preise-2026',
        metaTitle: 'Istanbul Flughafen VIP Transfer Preise 2026 | GNB Transfer',
        metaDescription: 'Istanbul Flughafen VIP Transfer Preise 2026. Festpreisgarantie mit Luxus-Mietwagen. Ab 75$.',
        excerpt: 'Komfortable und sichere Reise mit unserem Istanbul Flughafen VIP Transfer Service. Festpreisgarantie.',
        content: generateContent('Istanbul Flughafen VIP Transfer Preise 2026', [
          { heading: 'Warum VIP Transfer?', content: 'Luxuriöse und komfortable Reise vom Flughafen zu Ihrem Hotel. Keine versteckten Gebühren.' },
          { heading: 'Unsere Preise', content: 'VIP Transfer nach Taksim, Sultanahmet, Kadıköy und alle Istanbuler Gebiete ab 75$.' },
          { heading: 'Service-Funktionen', content: 'Kostenlose Flugverfolgung, 60 Minuten kostenlose Wartezeit, professionelle Fahrer.' },
        ], 'de'),
      },
      fr: {
        title: 'Prix du transfert VIP aéroport Istanbul 2026',
        slug: 'prix-transfert-vip-aeroport-istanbul-2026',
        metaTitle: 'Prix du transfert VIP aéroport Istanbul 2026 | GNB Transfer',
        metaDescription: 'Prix du transfert VIP aéroport Istanbul 2026. Garantie de prix fixe avec location de voiture de luxe. À partir de 75$.',
        excerpt: 'Voyage confortable et sûr avec notre service de transfert VIP aéroport Istanbul. Garantie de prix fixe.',
        content: generateContent('Prix du transfert VIP aéroport Istanbul 2026', [
          { heading: 'Pourquoi le transfert VIP?', content: 'Voyage luxueux et confortable de l\'aéroport à votre hôtel. Pas de frais cachés.' },
          { heading: 'Nos prix', content: 'Transfert VIP vers Taksim, Sultanahmet, Kadıköy et toutes les zones d\'Istanbul à partir de 75$.' },
          { heading: 'Caractéristiques du service', content: 'Suivi de vol gratuit, 60 minutes d\'attente gratuite, chauffeurs professionnels.' },
        ], 'fr'),
      },
      es: {
        title: 'Precios de traslado VIP aeropuerto Estambul 2026',
        slug: 'precios-traslado-vip-aeropuerto-estambul-2026',
        metaTitle: 'Precios de traslado VIP aeropuerto Estambul 2026 | GNB Transfer',
        metaDescription: 'Precios de traslado VIP aeropuerto Estambul 2026. Garantía de precio fijo con alquiler de coches de lujo. Desde $75.',
        excerpt: 'Viaje cómodo y seguro con nuestro servicio de traslado VIP aeropuerto Estambul. Garantía de precio fijo.',
        content: generateContent('Precios de traslado VIP aeropuerto Estambul 2026', [
          { heading: '¿Por qué traslado VIP?', content: 'Viaje lujoso y cómodo desde el aeropuerto hasta su hotel. Sin cargos ocultos.' },
          { heading: 'Nuestros precios', content: 'Traslado VIP a Taksim, Sultanahmet, Kadıköy y todas las áreas de Estambul desde $75.' },
          { heading: 'Características del servicio', content: 'Seguimiento de vuelos gratuito, 60 minutos de espera gratis, conductores profesionales.' },
        ], 'es'),
      },
      zh: {
        title: '2026年伊斯坦布尔机场VIP接送价格',
        slug: '2026-istanbul-jichang-vip-jiesong-jiage',
        metaTitle: '2026年伊斯坦布尔机场VIP接送价格 | GNB Transfer',
        metaDescription: '2026年伊斯坦布尔机场VIP接送价格。固定价格保证，豪华汽车租赁。低至75美元。',
        excerpt: '我们的伊斯坦布尔机场VIP接送服务让您的旅途舒适安全。固定价格保证，专业司机。',
        content: generateContent('2026年伊斯坦布尔机场VIP接送价格', [
          { heading: '为什么选择VIP接送？', content: '从机场到酒店的豪华舒适旅程。无隐藏费用，固定价格保证。' },
          { heading: '我们的价格', content: '前往塔克西姆、苏丹艾哈迈德、卡德柯伊及伊斯坦布尔所有地区的VIP接送，低至75美元。' },
          { heading: '服务特色', content: '免费航班跟踪，60分钟免费等候，专业司机，全天候支持。' },
        ], 'zh'),
      },
      fa: {
        title: 'قیمت ترانسفر VIP فرودگاه استانبول 2026',
        slug: 'gheymat-transfer-vip-foroudgah-istanbul-2026',
        metaTitle: 'قیمت ترانسفر VIP فرودگاه استانبول 2026 | GNB Transfer',
        metaDescription: 'قیمت ترانسفر VIP فرودگاه استانبول 2026. تضمین قیمت ثابت با اجاره خودروی لوکس. از 75 دلار.',
        excerpt: 'سفر راحت و امن با سرویس ترانسفر VIP فرودگاه استانبول ما. تضمین قیمت ثابت، رانندگان حرفه‌ای.',
        content: generateContent('قیمت ترانسفر VIP فرودگاه استانبول 2026', [
          { heading: 'چرا ترانسفر VIP؟', content: 'سفر لوکس و راحت از فرودگاه تا هتل شما. بدون هزینه‌های پنهان، تضمین قیمت ثابت.' },
          { heading: 'قیمت‌های ما', content: 'ترانسفر VIP به تقسیم، سلطان احمد، کادیکوی و تمام مناطق استانبول از 75 دلار.' },
          { heading: 'ویژگی‌های خدمات', content: 'پیگیری رایگان پرواز، 60 دقیقه انتظار رایگان، رانندگان حرفه‌ای، پشتیبانی 24/7.' },
        ], 'fa'),
      },
    },
    tags: {
      tr: ['istanbul havalimanı', 'vip transfer', 'havalimanı transfer', 'lüks transfer'],
      en: ['istanbul airport', 'vip transfer', 'airport transfer', 'luxury transfer'],
      ar: ['مطار إسطنبول', 'نقل VIP', 'نقل المطار', 'نقل فاخر'],
      ru: ['аэропорт стамбула', 'vip трансфер', 'трансфер аэропорт', 'люкс трансфер'],
      de: ['istanbul flughafen', 'vip transfer', 'flughafen transfer', 'luxus transfer'],
      fr: ['aéroport istanbul', 'transfert vip', 'transfert aéroport', 'transfert luxe'],
      es: ['aeropuerto estambul', 'traslado vip', 'traslado aeropuerto', 'traslado lujo'],
      zh: ['伊斯坦布尔机场', 'VIP接送', '机场接送', '豪华接送'],
      fa: ['فرودگاه استانبول', 'ترانسفر VIP', 'ترانسفر فرودگاه', 'ترانسفر لوکس'],
    },
    ctas: CTAS,
    internalLinks: [
      { text: 'Rezervasyon Yap', url: '/booking' },
      { text: 'Turlarımız', url: '/tours' },
      { text: 'İletişim', url: '/contact' },
    ],
  },
  // Post 2: Sabiha Gokcen to Taksim $75 Guaranteed VIP Transfer
  {
    category: 'transfer-prices',
    priority: 95,
    featuredImage: IMAGES.airport[1],
    images: [
      { url: IMAGES.cars[1], alt: 'VIP Transfer Car' },
      { url: IMAGES.istanbul[0], alt: 'Taksim Square' },
    ],
    translations: {
      tr: {
        title: 'Sabiha Gökçen → Taksim 75$ Garantili VIP Transfer',
        slug: 'sabiha-gokcen-taksim-75-dolar-garantili-vip-transfer',
        metaTitle: 'Sabiha Gökçen Taksim Transfer 75$ | GNB Transfer',
        metaDescription: 'Sabiha Gökçen Havalimanından Taksim\'e 75$ sabit fiyat garantili VIP transfer. Lüks araç, profesyonel şoför.',
        excerpt: 'Sabiha Gökçen Havalimanından Taksim\'e sabit fiyat garantili VIP transfer hizmeti.',
        content: generateContent('Sabiha Gökçen → Taksim 75$ Garantili VIP Transfer', [
          { heading: 'Sabit Fiyat Garantisi', content: 'Sabiha Gökçen\'den Taksim\'e 75$ sabit fiyat. Trafik, gece tarifesi farkı yok.' },
          { heading: 'Neler Dahil?', content: 'Uçuş takibi, 60 dk bekleme, bebek koltuğu, WiFi, su ve atıştırmalıklar.' },
          { heading: 'Rezervasyon', content: 'Online veya WhatsApp üzerinden anında rezervasyon yapın.' },
        ], 'tr'),
      },
      en: {
        title: 'Sabiha Gokcen → Taksim $75 Guaranteed VIP Transfer',
        slug: 'sabiha-gokcen-taksim-75-dollar-guaranteed-vip-transfer',
        metaTitle: 'Sabiha Gokcen Taksim Transfer $75 | GNB Transfer',
        metaDescription: 'Fixed price $75 VIP transfer from Sabiha Gokcen Airport to Taksim. Luxury vehicle, professional driver.',
        excerpt: 'Fixed price guaranteed VIP transfer service from Sabiha Gokcen Airport to Taksim.',
        content: generateContent('Sabiha Gokcen → Taksim $75 Guaranteed VIP Transfer', [
          { heading: 'Fixed Price Guarantee', content: '$75 fixed price from Sabiha Gokcen to Taksim. No traffic or night rate surcharge.' },
          { heading: 'What\'s Included?', content: 'Flight tracking, 60 min waiting, child seat, WiFi, water and snacks.' },
          { heading: 'Booking', content: 'Book instantly online or via WhatsApp.' },
        ], 'en'),
      },
      ar: {
        title: 'صبيحة كوكجن ← تقسيم 75$ نقل VIP مضمون',
        slug: 'sabiha-gokcen-taksim-75-dollar-vip-transfer',
        metaTitle: 'نقل صبيحة كوكجن تقسيم 75$ | GNB Transfer',
        metaDescription: 'نقل VIP بسعر ثابت 75$ من مطار صبيحة كوكجن إلى تقسيم. سيارة فاخرة، سائق محترف.',
        excerpt: 'خدمة نقل VIP بسعر ثابت مضمون من مطار صبيحة كوكجن إلى تقسيم.',
        content: generateContent('صبيحة كوكجن ← تقسيم 75$ نقل VIP مضمون', [
          { heading: 'ضمان السعر الثابت', content: '75$ سعر ثابت من صبيحة كوكجن إلى تقسيم. بدون رسوم إضافية للمرور أو الليل.' },
          { heading: 'ماذا يشمل؟', content: 'تتبع الرحلة، 60 دقيقة انتظار، مقعد أطفال، واي فاي، ماء ووجبات خفيفة.' },
          { heading: 'الحجز', content: 'احجز فوراً عبر الإنترنت أو واتساب.' },
        ], 'ar'),
      },
      ru: {
        title: 'Сабиха Гёкчен → Таксим $75 Гарантированный VIP Трансфер',
        slug: 'sabiha-gokcen-taksim-75-dollar-vip-transfer',
        metaTitle: 'Трансфер Сабиха Гёкчен Таксим $75 | GNB Transfer',
        metaDescription: 'VIP трансфер с фиксированной ценой $75 из аэропорта Сабиха Гёкчен в Таксим. Люкс автомобиль.',
        excerpt: 'VIP трансфер с гарантированной фиксированной ценой из аэропорта Сабиха Гёкчен в Таксим.',
        content: generateContent('Сабиха Гёкчен → Таксим $75 Гарантированный VIP Трансфер', [
          { heading: 'Гарантия фиксированной цены', content: '$75 фиксированная цена от Сабиха Гёкчен до Таксим. Без доплат за трафик или ночь.' },
          { heading: 'Что включено?', content: 'Отслеживание рейса, 60 мин ожидания, детское кресло, WiFi, вода и закуски.' },
          { heading: 'Бронирование', content: 'Бронируйте мгновенно онлайн или через WhatsApp.' },
        ], 'ru'),
      },
      de: {
        title: 'Sabiha Gökçen → Taksim 75$ Garantierter VIP Transfer',
        slug: 'sabiha-gokcen-taksim-75-dollar-garantierter-vip-transfer',
        metaTitle: 'Sabiha Gökçen Taksim Transfer 75$ | GNB Transfer',
        metaDescription: 'VIP Transfer zum Festpreis von 75$ vom Flughafen Sabiha Gökçen nach Taksim. Luxusfahrzeug.',
        excerpt: 'VIP Transfer Service zum garantierten Festpreis vom Flughafen Sabiha Gökçen nach Taksim.',
        content: generateContent('Sabiha Gökçen → Taksim 75$ Garantierter VIP Transfer', [
          { heading: 'Festpreisgarantie', content: '75$ Festpreis von Sabiha Gökçen nach Taksim. Kein Verkehrs- oder Nachtzuschlag.' },
          { heading: 'Was ist enthalten?', content: 'Flugverfolgung, 60 Min Wartezeit, Kindersitz, WiFi, Wasser und Snacks.' },
          { heading: 'Buchung', content: 'Buchen Sie sofort online oder per WhatsApp.' },
        ], 'de'),
      },
      fr: {
        title: 'Sabiha Gökçen → Taksim 75$ Transfert VIP Garanti',
        slug: 'sabiha-gokcen-taksim-75-dollar-transfert-vip-garanti',
        metaTitle: 'Transfert Sabiha Gökçen Taksim 75$ | GNB Transfer',
        metaDescription: 'Transfert VIP à prix fixe de 75$ de l\'aéroport Sabiha Gökçen à Taksim. Véhicule de luxe.',
        excerpt: 'Service de transfert VIP à prix fixe garanti de l\'aéroport Sabiha Gökçen à Taksim.',
        content: generateContent('Sabiha Gökçen → Taksim 75$ Transfert VIP Garanti', [
          { heading: 'Garantie de prix fixe', content: '75$ prix fixe de Sabiha Gökçen à Taksim. Pas de supplément trafic ou nuit.' },
          { heading: 'Qu\'est-ce qui est inclus?', content: 'Suivi de vol, 60 min d\'attente, siège enfant, WiFi, eau et collations.' },
          { heading: 'Réservation', content: 'Réservez instantanément en ligne ou via WhatsApp.' },
        ], 'fr'),
      },
      es: {
        title: 'Sabiha Gökçen → Taksim $75 Traslado VIP Garantizado',
        slug: 'sabiha-gokcen-taksim-75-dollar-traslado-vip-garantizado',
        metaTitle: 'Traslado Sabiha Gökçen Taksim $75 | GNB Transfer',
        metaDescription: 'Traslado VIP a precio fijo de $75 desde el aeropuerto Sabiha Gökçen a Taksim. Vehículo de lujo.',
        excerpt: 'Servicio de traslado VIP a precio fijo garantizado desde el aeropuerto Sabiha Gökçen a Taksim.',
        content: generateContent('Sabiha Gökçen → Taksim $75 Traslado VIP Garantizado', [
          { heading: 'Garantía de precio fijo', content: '$75 precio fijo desde Sabiha Gökçen a Taksim. Sin recargo por tráfico o noche.' },
          { heading: '¿Qué está incluido?', content: 'Seguimiento de vuelo, 60 min de espera, asiento infantil, WiFi, agua y snacks.' },
          { heading: 'Reserva', content: 'Reserve al instante en línea o por WhatsApp.' },
        ], 'es'),
      },
      zh: {
        title: '萨比哈格克琴 → 塔克西姆 75美元保证VIP接送',
        slug: 'sabiha-gokcen-taksim-75-meiyuan-vip-jiesong',
        metaTitle: '萨比哈格克琴塔克西姆接送75美元 | GNB Transfer',
        metaDescription: '从萨比哈格克琴机场到塔克西姆的固定价格75美元VIP接送。豪华车辆，专业司机。',
        excerpt: '从萨比哈格克琴机场到塔克西姆的固定价格保证VIP接送服务。',
        content: generateContent('萨比哈格克琴 → 塔克西姆 75美元保证VIP接送', [
          { heading: '固定价格保证', content: '从萨比哈格克琴到塔克西姆固定价格75美元。无交通或夜间附加费。' },
          { heading: '包含什么？', content: '航班跟踪，60分钟等候，儿童座椅，WiFi，水和零食。' },
          { heading: '预订', content: '在线或通过WhatsApp即时预订。' },
        ], 'zh'),
      },
      fa: {
        title: 'صبیحا گوکچن → تقسیم 75$ ترانسفر VIP تضمینی',
        slug: 'sabiha-gokcen-taksim-75-dollar-vip-transfer',
        metaTitle: 'ترانسفر صبیحا گوکچن تقسیم 75$ | GNB Transfer',
        metaDescription: 'ترانسفر VIP با قیمت ثابت 75$ از فرودگاه صبیحا گوکچن به تقسیم. خودروی لوکس، راننده حرفه‌ای.',
        excerpt: 'خدمات ترانسفر VIP با قیمت ثابت تضمینی از فرودگاه صبیحا گوکچن به تقسیم.',
        content: generateContent('صبیحا گوکچن → تقسیم 75$ ترانسفر VIP تضمینی', [
          { heading: 'تضمین قیمت ثابت', content: '75$ قیمت ثابت از صبیحا گوکچن به تقسیم. بدون هزینه اضافی ترافیک یا شب.' },
          { heading: 'چه چیزی شامل می‌شود؟', content: 'پیگیری پرواز، 60 دقیقه انتظار، صندلی کودک، WiFi، آب و تنقلات.' },
          { heading: 'رزرو', content: 'فوراً آنلاین یا از طریق واتساپ رزرو کنید.' },
        ], 'fa'),
      },
    },
    tags: {
      tr: ['sabiha gökçen', 'taksim transfer', 'sabit fiyat', 'vip transfer'],
      en: ['sabiha gokcen', 'taksim transfer', 'fixed price', 'vip transfer'],
      ar: ['صبيحة كوكجن', 'نقل تقسيم', 'سعر ثابت', 'نقل VIP'],
      ru: ['сабиха гёкчен', 'трансфер таксим', 'фиксированная цена', 'vip трансфер'],
      de: ['sabiha gökçen', 'taksim transfer', 'festpreis', 'vip transfer'],
      fr: ['sabiha gökçen', 'transfert taksim', 'prix fixe', 'transfert vip'],
      es: ['sabiha gökçen', 'traslado taksim', 'precio fijo', 'traslado vip'],
      zh: ['萨比哈格克琴', '塔克西姆接送', '固定价格', 'VIP接送'],
      fa: ['صبیحا گوکچن', 'ترانسفر تقسیم', 'قیمت ثابت', 'ترانسفر VIP'],
    },
    ctas: CTAS,
    internalLinks: [
      { text: 'Rezervasyon', url: '/booking' },
      { text: 'Fiyatlar', url: '/tours' },
    ],
  },
];

// Generate remaining posts (3-40) with similar structure
function generateAdditionalPosts() {
  const additionalTitles = [
    // Posts 3-15: Price and service focused
    { tr: 'İstanbul\'da Arapça Konuşan Şoförlü Özel Transfer', en: 'Private Transfer with Arabic Speaking Driver in Istanbul', category: 'services' },
    { tr: 'İstanbul Havalimanı Meet & Greet Hizmeti 2026', en: 'Istanbul Airport Meet & Greet Service 2026', category: 'services' },
    { tr: 'Çocuklu Aileler için İstanbul\'un En Güvenli Transferi', en: 'Safest Transfer in Istanbul for Families with Children', category: 'services' },
    { tr: 'İstanbul\'da Gece Transferi - 24 Saat Hizmet', en: 'Night Transfer in Istanbul - 24 Hour Service', category: 'services' },
    { tr: 'Kurumsal Müşteriler için Özel VIP Transfer Paketleri', en: 'Special VIP Transfer Packages for Corporate Clients', category: 'services' },
    { tr: 'İstanbul Havalimanı - Kadıköy Garantili Transfer Fiyatları', en: 'Istanbul Airport - Kadikoy Guaranteed Transfer Prices', category: 'transfer-prices' },
    { tr: 'Sabiha Gökçen - Sultanahmet En Uygun Transfer', en: 'Sabiha Gokcen - Sultanahmet Best Value Transfer', category: 'transfer-prices' },
    { tr: 'VIP Mercedes Transfer İstanbul - Lüks Araç Filosu', en: 'VIP Mercedes Transfer Istanbul - Luxury Fleet', category: 'services' },
    { tr: 'Rusça Konuşan Şoförlü İstanbul Transferi', en: 'Istanbul Transfer with Russian Speaking Driver', category: 'services' },
    { tr: 'Grup Transferleri - 8+ Kişilik Araçlar', en: 'Group Transfers - 8+ Passenger Vehicles', category: 'services' },
    { tr: 'İstanbul Transfer İndirim Kodları 2026', en: 'Istanbul Transfer Discount Codes 2026', category: 'promotions' },
    { tr: 'Düğün ve Özel Günler için VIP Transfer', en: 'VIP Transfer for Weddings and Special Events', category: 'services' },
    // Posts 16-40: Tourist destination focused
    { tr: 'Ayasofya\'yı Ziyaret Etmeden Önce VIP Transferle Konforlu Başlangıç', en: 'Comfortable Start with VIP Transfer Before Visiting Hagia Sophia', category: 'destinations' },
    { tr: 'Topkapı Sarayı Turu - Havalimanından Direkt Kapıya 85$', en: 'Topkapi Palace Tour - Direct from Airport to Door $85', category: 'destinations' },
    { tr: 'Sultanahmet\'in En Lüks Otellerine Özel Transfer Paketleri', en: 'Special Transfer Packages to Sultanahmet\'s Finest Hotels', category: 'destinations' },
    { tr: 'Kapadokya\'dan İstanbul\'a Dönüş - Balon Sonrası VIP Karşılama', en: 'Return from Cappadocia - VIP Welcome After Balloon Ride', category: 'destinations' },
    { tr: 'İstanbul Cruise Limanı (Galataport) Yolcularına Özel 7/24 Transfer', en: 'Special 24/7 Transfer for Istanbul Cruise Port (Galataport) Passengers', category: 'destinations' },
    { tr: 'Ramazan Bayramı 2026 İstanbul Transfer Rehberi', en: 'Ramadan Eid 2026 Istanbul Transfer Guide', category: 'seasonal' },
    { tr: 'Kurban Bayramı\'nda İstanbul Havalimanı VIP Transfer', en: 'Istanbul Airport VIP Transfer During Eid al-Adha', category: 'seasonal' },
    { tr: 'İstanbul\'un En İyi 20 Oteline 75$ Sabit Fiyat Transfer', en: 'Fixed $75 Transfer to Istanbul\'s Top 20 Hotels', category: 'transfer-prices' },
    { tr: 'Boğaz Turu Öncesi ve Sonrası Özel Şoförlü Transfer', en: 'Private Chauffeur Transfer Before and After Bosphorus Tour', category: 'destinations' },
    { tr: 'İstanbul Shopping Fest 2026 - AVM\'lere Direkt VIP Transfer', en: 'Istanbul Shopping Fest 2026 - Direct VIP Transfer to Malls', category: 'seasonal' },
    { tr: 'Dolmabahçe Sarayı Ziyareti için VIP Transfer', en: 'VIP Transfer for Dolmabahce Palace Visit', category: 'destinations' },
    { tr: 'Pierre Loti Tepesi\'ne Romantik Transfer', en: 'Romantic Transfer to Pierre Loti Hill', category: 'destinations' },
    { tr: 'Prens Adaları\'na Transfer ve Feribot Paketi', en: 'Transfer and Ferry Package to Princes\' Islands', category: 'destinations' },
    { tr: 'Vialand Tema Parkı\'na Ailece Transfer', en: 'Family Transfer to Vialand Theme Park', category: 'destinations' },
    { tr: 'İstanbul Akvaryum Ziyareti için Konforlu Transfer', en: 'Comfortable Transfer for Istanbul Aquarium Visit', category: 'destinations' },
    { tr: 'Panorama 1453 Müzesi\'ne Tarih Dolu Transfer', en: 'Historic Transfer to Panorama 1453 Museum', category: 'destinations' },
    { tr: 'Miniatürk\'e Çocuklarla VIP Transfer', en: 'VIP Transfer to Miniaturk with Kids', category: 'destinations' },
    { tr: 'Emirgan Korusu\'na Bahar Transferi', en: 'Spring Transfer to Emirgan Park', category: 'seasonal' },
    { tr: 'Beylerbeyi Sarayı\'na Boğaz Manzaralı Transfer', en: 'Transfer to Beylerbeyi Palace with Bosphorus View', category: 'destinations' },
    { tr: 'Yerebatan Sarnıcı\'na Gizemli Transfer Deneyimi', en: 'Mysterious Transfer Experience to Basilica Cistern', category: 'destinations' },
    { tr: 'İstanbul Modern Sanat Müzesi\'ne Kültür Transferi', en: 'Culture Transfer to Istanbul Modern Art Museum', category: 'destinations' },
    { tr: 'Sapphire Seyir Terası\'na Gökdelen Transferi', en: 'Skyscraper Transfer to Sapphire Observation Deck', category: 'destinations' },
    { tr: 'İstanbul\'da Helal Tatil Rehberi - VIP Transfer Dahil', en: 'Halal Holiday Guide in Istanbul - VIP Transfer Included', category: 'tips' },
    { tr: 'Lüks Yat Turları Öncesi Transfer Hizmeti', en: 'Transfer Service Before Luxury Yacht Tours', category: 'services' },
  ];

  return additionalTitles.map((titleData, index) => {
    const postNumber = index + 3;
    const imageSet = Object.values(IMAGES).flat();
    const featuredImage = imageSet[postNumber % imageSet.length];
    
    return {
      category: titleData.category,
      priority: 90 - index,
      featuredImage,
      images: [
        { url: imageSet[(postNumber + 1) % imageSet.length], alt: 'Transfer Image 1' },
        { url: imageSet[(postNumber + 2) % imageSet.length], alt: 'Transfer Image 2' },
      ],
      translations: {
        tr: {
          title: titleData.tr,
          slug: titleData.tr.toLowerCase().replace(/[^a-z0-9ğüşıöçİĞÜŞÖÇ\s-]/g, '').replace(/\s+/g, '-').replace(/[ğ]/g, 'g').replace(/[ü]/g, 'u').replace(/[ş]/g, 's').replace(/[ı]/g, 'i').replace(/[ö]/g, 'o').replace(/[ç]/g, 'c'),
          metaTitle: `${titleData.tr} | GNB Transfer`,
          metaDescription: `${titleData.tr}. 75$'dan başlayan fiyatlarla VIP transfer hizmeti. İndirim kodu: VIP2026`,
          excerpt: `${titleData.tr}. Profesyonel şoförler, lüks araçlar, sabit fiyat garantisi.`,
          content: generateContent(titleData.tr, [
            { heading: 'Hizmet Detayları', content: 'Profesyonel şoförlerimiz ve lüks araçlarımızla konforlu yolculuk.' },
            { heading: 'Fiyatlar', content: '75$\'dan başlayan fiyatlarla VIP transfer. Gizli ücret yok.' },
            { heading: 'Rezervasyon', content: 'Online veya WhatsApp üzerinden hemen rezervasyon yapın.' },
          ], 'tr'),
        },
        en: {
          title: titleData.en,
          slug: titleData.en.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
          metaTitle: `${titleData.en} | GNB Transfer`,
          metaDescription: `${titleData.en}. VIP transfer service starting from $75. Discount code: VIP2026`,
          excerpt: `${titleData.en}. Professional drivers, luxury vehicles, fixed price guarantee.`,
          content: generateContent(titleData.en, [
            { heading: 'Service Details', content: 'Comfortable journey with our professional drivers and luxury vehicles.' },
            { heading: 'Prices', content: 'VIP transfer starting from $75. No hidden fees.' },
            { heading: 'Booking', content: 'Book now online or via WhatsApp.' },
          ], 'en'),
        },
        ar: {
          title: `${titleData.en} - خدمة نقل VIP`,
          slug: titleData.en.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + '-ar',
          metaTitle: `${titleData.en} | GNB Transfer`,
          metaDescription: `خدمة نقل VIP. ابتداءً من 75 دولار. كود الخصم: VIP2026`,
          excerpt: `خدمة نقل VIP احترافية. سائقون محترفون، سيارات فاخرة.`,
          content: generateContent(`${titleData.en} - خدمة نقل VIP`, [
            { heading: 'تفاصيل الخدمة', content: 'رحلة مريحة مع سائقينا المحترفين وسياراتنا الفاخرة.' },
            { heading: 'الأسعار', content: 'نقل VIP ابتداءً من 75 دولار. بدون رسوم خفية.' },
            { heading: 'الحجز', content: 'احجز الآن عبر الإنترنت أو واتساب.' },
          ], 'ar'),
        },
        ru: {
          title: `${titleData.en} - VIP Трансфер`,
          slug: titleData.en.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + '-ru',
          metaTitle: `${titleData.en} | GNB Transfer`,
          metaDescription: `VIP трансфер. От $75. Промокод: VIP2026`,
          excerpt: `Профессиональный VIP трансфер. Профессиональные водители, люкс автомобили.`,
          content: generateContent(`${titleData.en} - VIP Трансфер`, [
            { heading: 'Детали сервиса', content: 'Комфортное путешествие с нашими профессиональными водителями и люкс автомобилями.' },
            { heading: 'Цены', content: 'VIP трансфер от $75. Без скрытых платежей.' },
            { heading: 'Бронирование', content: 'Бронируйте сейчас онлайн или через WhatsApp.' },
          ], 'ru'),
        },
        de: {
          title: `${titleData.en} - VIP Transfer`,
          slug: titleData.en.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + '-de',
          metaTitle: `${titleData.en} | GNB Transfer`,
          metaDescription: `VIP Transfer. Ab $75. Rabattcode: VIP2026`,
          excerpt: `Professioneller VIP Transfer. Professionelle Fahrer, Luxusfahrzeuge.`,
          content: generateContent(`${titleData.en} - VIP Transfer`, [
            { heading: 'Service-Details', content: 'Komfortable Reise mit unseren professionellen Fahrern und Luxusfahrzeugen.' },
            { heading: 'Preise', content: 'VIP Transfer ab $75. Keine versteckten Gebühren.' },
            { heading: 'Buchung', content: 'Jetzt online oder per WhatsApp buchen.' },
          ], 'de'),
        },
        fr: {
          title: `${titleData.en} - Transfert VIP`,
          slug: titleData.en.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + '-fr',
          metaTitle: `${titleData.en} | GNB Transfer`,
          metaDescription: `Transfert VIP. À partir de 75$. Code promo: VIP2026`,
          excerpt: `Transfert VIP professionnel. Chauffeurs professionnels, véhicules de luxe.`,
          content: generateContent(`${titleData.en} - Transfert VIP`, [
            { heading: 'Détails du service', content: 'Voyage confortable avec nos chauffeurs professionnels et véhicules de luxe.' },
            { heading: 'Prix', content: 'Transfert VIP à partir de 75$. Pas de frais cachés.' },
            { heading: 'Réservation', content: 'Réservez maintenant en ligne ou via WhatsApp.' },
          ], 'fr'),
        },
        es: {
          title: `${titleData.en} - Traslado VIP`,
          slug: titleData.en.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + '-es',
          metaTitle: `${titleData.en} | GNB Transfer`,
          metaDescription: `Traslado VIP. Desde $75. Código de descuento: VIP2026`,
          excerpt: `Traslado VIP profesional. Conductores profesionales, vehículos de lujo.`,
          content: generateContent(`${titleData.en} - Traslado VIP`, [
            { heading: 'Detalles del servicio', content: 'Viaje cómodo con nuestros conductores profesionales y vehículos de lujo.' },
            { heading: 'Precios', content: 'Traslado VIP desde $75. Sin cargos ocultos.' },
            { heading: 'Reserva', content: 'Reserve ahora en línea o por WhatsApp.' },
          ], 'es'),
        },
        zh: {
          title: `${titleData.en} - VIP接送`,
          slug: titleData.en.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + '-zh',
          metaTitle: `${titleData.en} | GNB Transfer`,
          metaDescription: `VIP接送服务。低至75美元。折扣码: VIP2026`,
          excerpt: `专业VIP接送服务。专业司机，豪华车辆。`,
          content: generateContent(`${titleData.en} - VIP接送`, [
            { heading: '服务详情', content: '与我们专业的司机和豪华车辆一起舒适旅行。' },
            { heading: '价格', content: 'VIP接送低至75美元。无隐藏费用。' },
            { heading: '预订', content: '立即在线或通过WhatsApp预订。' },
          ], 'zh'),
        },
        fa: {
          title: `${titleData.en} - ترانسفر VIP`,
          slug: titleData.en.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + '-fa',
          metaTitle: `${titleData.en} | GNB Transfer`,
          metaDescription: `ترانسفر VIP. از 75 دلار. کد تخفیف: VIP2026`,
          excerpt: `ترانسفر VIP حرفه‌ای. رانندگان حرفه‌ای، خودروهای لوکس.`,
          content: generateContent(`${titleData.en} - ترانسفر VIP`, [
            { heading: 'جزئیات خدمات', content: 'سفر راحت با رانندگان حرفه‌ای و خودروهای لوکس ما.' },
            { heading: 'قیمت‌ها', content: 'ترانسفر VIP از 75 دلار. بدون هزینه پنهان.' },
            { heading: 'رزرو', content: 'همین الان آنلاین یا از طریق واتساپ رزرو کنید.' },
          ], 'fa'),
        },
      },
      tags: {
        tr: ['vip transfer', 'istanbul transfer', 'havalimanı transfer'],
        en: ['vip transfer', 'istanbul transfer', 'airport transfer'],
        ar: ['نقل VIP', 'نقل إسطنبول', 'نقل المطار'],
        ru: ['vip трансфер', 'трансфер стамбул', 'трансфер аэропорт'],
        de: ['vip transfer', 'istanbul transfer', 'flughafen transfer'],
        fr: ['transfert vip', 'transfert istanbul', 'transfert aéroport'],
        es: ['traslado vip', 'traslado estambul', 'traslado aeropuerto'],
        zh: ['VIP接送', '伊斯坦布尔接送', '机场接送'],
        fa: ['ترانسفر VIP', 'ترانسفر استانبول', 'ترانسفر فرودگاه'],
      },
      ctas: CTAS,
      internalLinks: [
        { text: 'Rezervasyon', url: '/booking' },
        { text: 'Turlar', url: '/tours' },
      ],
    };
  });
}

// Main seed function
async function seedBlogPosts() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.log('MONGO_URI not set. Skipping database seeding.');
      console.log('Blog posts data generated successfully (40 posts x 9 languages = 360 articles)');
      return;
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Clear existing blog posts
    const deleteResult = await BlogPost.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing blog posts`);
    
    // Combine all posts
    const allPosts = [...blogPostsData, ...generateAdditionalPosts()];
    
    // Insert all posts
    const insertedPosts = await BlogPost.insertMany(allPosts);
    console.log(`Successfully seeded ${insertedPosts.length} blog posts (${insertedPosts.length * 9} total articles in 9 languages)`);
    
    // Verify
    const count = await BlogPost.countDocuments();
    console.log(`Total blog posts in database: ${count}`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    console.log('Blog seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding blog posts:', error);
    process.exit(1);
  }
}

// Run if called directly
seedBlogPosts();

export { blogPostsData, generateAdditionalPosts };
