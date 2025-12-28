/**
 * SEO Helper Utilities
 * Generate JSON-LD structured data for various content types
 */

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://gnbtransfer.com';
const SITE_NAME = 'GNB Transfer';

/**
 * Generate LocalBusiness JSON-LD schema
 * Used on homepage and contact page
 */
export const generateLocalBusinessSchema = (lang = 'tr') => {
  const descriptions = {
    tr: "Türkiye'de profesyonel havalimanı transferi ve turizm hizmetleri",
    en: 'Professional airport transfer and tourism services in Turkey',
    ar: 'خدمات النقل من المطار والسياحة المهنية في تركيا',
    ru: 'Профессиональные услуги трансфера и туризма в Турции',
    de: 'Professionelle Flughafentransfer- und Tourismusdienstleistungen in der Türkei',
    fr: 'Services professionnels de transfert aéroport et de tourisme en Turquie',
    es: 'Servicios profesionales de traslado al aeropuerto y turismo en Turquía',
    zh: '土耳其专业机场接送和旅游服务',
    fa: 'خدمات حرفه‌ای ترانسفر فرودگاه و گردشگری در ترکیه',
    hi: 'तुर्की में पेशेवर हवाई अड्डा स्थानांतरण और पर्यटन सेवाएं',
    it: 'Servizi professionali di trasferimento aeroportuale e turismo in Turchia',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    description: descriptions[lang] || descriptions.en,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    image: `${SITE_URL}/images/og-image.jpg`,
    telephone: '+90-XXX-XXX-XXXX',
    email: 'info@gnbtransfer.com',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TR',
      addressLocality: 'Istanbul',
      addressRegion: 'Istanbul',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '41.0082',
      longitude: '28.9784',
    },
    priceRange: '$$',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
      },
    ],
    sameAs: [
      'https://www.facebook.com/gnbtransfer',
      'https://www.instagram.com/gnbtransfer',
      'https://twitter.com/gnbtransfer',
    ],
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/booking`,
      },
      result: {
        '@type': 'Reservation',
        name: 'Transfer Reservation',
      },
    },
  };
};

/**
 * Generate Article JSON-LD schema
 * Used for blog posts
 */
export const generateArticleSchema = ({
  title,
  description,
  slug,
  author,
  publishedTime,
  modifiedTime,
  image,
  lang = 'en',
}) => {
  const langPrefix = lang === 'tr' ? '' : `/${lang}`;
  const url = `${SITE_URL}${langPrefix}/blog/${slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: title,
    description,
    image: image || `${SITE_URL}/images/blog-default.jpg`,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      '@type': 'Person',
      name: author || SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    inLanguage: lang,
  };
};

/**
 * Generate FAQ JSON-LD schema
 * Used on booking/reservation page
 */
export const generateFAQSchema = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

/**
 * Generate Service JSON-LD schema
 * Used on services/tours page
 */
export const generateServiceSchema = ({
  name,
  description,
  provider = SITE_NAME,
  areaServed = 'Turkey',
  lang = 'en',
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name,
  description,
  provider: {
    '@type': 'Organization',
    name: provider,
    url: SITE_URL,
  },
  areaServed: {
    '@type': 'Place',
    name: areaServed,
  },
  serviceType: 'Transportation',
  inLanguage: lang,
});

/**
 * Generate BreadcrumbList JSON-LD schema
 * Used for navigation breadcrumbs
 */
export const generateBreadcrumbSchema = (breadcrumbs) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: `${SITE_URL}${crumb.path}`,
  })),
});

/**
 * Generate WebSite JSON-LD schema with search action
 * Used on homepage
 */
export const generateWebSiteSchema = (lang = 'tr') => {
  const names = {
    tr: 'GNB Transfer - Havalimanı Transferi ve Turizm',
    en: 'GNB Transfer - Airport Transfer & Tourism',
    ar: 'GNB Transfer - نقل المطار والسياحة',
    ru: 'GNB Transfer - Трансфер из аэропорта и туризм',
    de: 'GNB Transfer - Flughafentransfer & Tourismus',
    fr: 'GNB Transfer - Transfert Aéroport & Tourisme',
    es: 'GNB Transfer - Traslado Aeropuerto y Turismo',
    zh: 'GNB Transfer - 机场接送与旅游',
    fa: 'GNB Transfer - ترانسفر فرودگاه و گردشگری',
    hi: 'GNB Transfer - एयरपोर्ट ट्रांसफर और पर्यटन',
    it: 'GNB Transfer - Trasferimento Aeroportuale e Turismo',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: names[lang] || names.en,
    inLanguage: lang,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/tours?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
};

/**
 * Get SEO meta translations by language
 */
export const getSEOTranslations = (page, lang = 'tr') => {
  const seoData = {
    home: {
      tr: {
        title: 'GNB Transfer | Profesyonel Havalimanı Transferi ve Turizm Hizmetleri',
        description:
          "Türkiye'nin en güvenilir transfer hizmeti. Konforlu araçlar, deneyimli şoförler, 7/24 hizmet. Havalimanı transferi ve şehir turları için hemen rezervasyon yapın.",
        keywords:
          'havalimanı transferi, istanbul transfer, antalya transfer, turizm hizmetleri, vip transfer, özel araç kiralama',
      },
      en: {
        title: 'GNB Transfer | Professional Airport Transfer & Tourism Services',
        description:
          "Turkey's most reliable transfer service. Comfortable vehicles, experienced drivers, 24/7 service. Book now for airport transfers and city tours.",
        keywords:
          'airport transfer, istanbul transfer, antalya transfer, tourism services, vip transfer, private car rental',
      },
      ar: {
        title: 'GNB Transfer | خدمات النقل من المطار والسياحة المهنية',
        description:
          'أكثر خدمات النقل موثوقية في تركيا. مركبات مريحة، سائقون ذوو خبرة، خدمة على مدار الساعة. احجز الآن لنقل المطار وجولات المدينة.',
        keywords: 'نقل المطار، نقل اسطنبول، نقل أنطاليا، خدمات السياحة، نقل VIP، تأجير سيارة خاصة',
      },
      ru: {
        title: 'GNB Transfer | Профессиональные услуги трансфера и туризма',
        description:
          'Самая надежная служба трансфера в Турции. Комфортные автомобили, опытные водители, круглосуточное обслуживание. Забронируйте трансфер из аэропорта и экскурсии по городу.',
        keywords:
          'трансфер из аэропорта, трансфер Стамбул, трансфер Анталия, туристические услуги, VIP трансфер, аренда автомобиля',
      },
      de: {
        title: 'GNB Transfer | Professionelle Flughafentransfer & Tourismusdienstleistungen',
        description:
          'Der zuverlässigste Transferservice der Türkei. Komfortable Fahrzeuge, erfahrene Fahrer, 24/7 Service. Jetzt buchen für Flughafentransfers und Stadtrundfahrten.',
        keywords:
          'Flughafentransfer, Istanbul Transfer, Antalya Transfer, Tourismusdienstleistungen, VIP Transfer, Autovermietung',
      },
      fr: {
        title: 'GNB Transfer | Services professionnels de transfert aéroport et tourisme',
        description:
          'Le service de transfert le plus fiable de Turquie. Véhicules confortables, chauffeurs expérimentés, service 24h/24. Réservez maintenant pour les transferts aéroport et les visites de la ville.',
        keywords:
          'transfert aéroport, transfert Istanbul, transfert Antalya, services touristiques, transfert VIP, location de voiture',
      },
      es: {
        title: 'GNB Transfer | Servicios profesionales de traslado al aeropuerto y turismo',
        description:
          'El servicio de traslado más confiable de Turquía. Vehículos cómodos, conductores experimentados, servicio 24/7. Reserve ahora para traslados al aeropuerto y tours por la ciudad.',
        keywords:
          'traslado aeropuerto, traslado Estambul, traslado Antalya, servicios turísticos, traslado VIP, alquiler de coche',
      },
      zh: {
        title: 'GNB Transfer | 专业机场接送和旅游服务',
        description:
          '土耳其最可靠的接送服务。舒适的车辆，经验丰富的司机，24/7服务。立即预订机场接送和城市游览。',
        keywords: '机场接送，伊斯坦布尔接送，安塔利亚接送，旅游服务，VIP接送，租车',
      },
      fa: {
        title: 'GNB Transfer | خدمات حرفه‌ای ترانسفر فرودگاه و گردشگری',
        description:
          'قابل اعتمادترین سرویس ترانسفر ترکیه. وسایل نقلیه راحت، رانندگان با تجربه، خدمات 24/7. همین الان برای ترانسفر فرودگاه و تورهای شهری رزرو کنید.',
        keywords:
          'ترانسفر فرودگاه، ترانسفر استانبول، ترانسفر آنتالیا، خدمات گردشگری، ترانسفر VIP، اجاره خودرو',
      },
      hi: {
        title: 'GNB Transfer | पेशेवर हवाई अड्डा स्थानांतरण और पर्यटन सेवाएं',
        description:
          'तुर्की की सबसे भरोसेमंद स्थानांतरण सेवा। आरामदायक वाहन, अनुभवी ड्राइवर, 24/7 सेवा। हवाई अड्डा स्थानांतरण और शहर के दौरे के लिए अभी बुक करें।',
        keywords:
          'हवाई अड्डा स्थानांतरण, इस्तांबुल स्थानांतरण, अंटाल्या स्थानांतरण, पर्यटन सेवाएं, VIP स्थानांतरण, कार किराया',
      },
      it: {
        title: 'GNB Transfer | Servizi professionali di trasferimento aeroportuale e turismo',
        description:
          'Il servizio di trasferimento più affidabile della Turchia. Veicoli confortevoli, autisti esperti, servizio 24/7. Prenota ora per trasferimenti aeroportuali e tour della città.',
        keywords:
          'trasferimento aeroportuale, trasferimento Istanbul, trasferimento Antalya, servizi turistici, trasferimento VIP, noleggio auto',
      },
    },
    tours: {
      tr: {
        title: 'Turlar ve Geziler | GNB Transfer',
        description:
          "İstanbul, Antalya ve Türkiye'nin diğer şehirlerinde profesyonel tur hizmetleri. Özel turlar, grup turları ve şehir gezileri.",
        keywords: 'istanbul turu, antalya turu, şehir gezisi, özel tur, grup turu',
      },
      en: {
        title: 'Tours & Excursions | GNB Transfer',
        description:
          'Professional tour services in Istanbul, Antalya and other Turkish cities. Private tours, group tours and city tours.',
        keywords: 'istanbul tour, antalya tour, city tour, private tour, group tour',
      },
    },
    booking: {
      tr: {
        title: 'Rezervasyon Yap | GNB Transfer',
        description:
          'Online transfer rezervasyonu yapın. Anında onay, güvenli ödeme, en uygun fiyatlar. 7/24 müşteri desteği.',
        keywords: 'online rezervasyon, transfer rezervasyonu, havalimanı transfer rezervasyon',
      },
      en: {
        title: 'Make a Reservation | GNB Transfer',
        description:
          'Book your transfer online. Instant confirmation, secure payment, best prices. 24/7 customer support.',
        keywords: 'online booking, transfer reservation, airport transfer booking',
      },
    },
    blog: {
      tr: {
        title: 'Blog | GNB Transfer - Seyahat İpuçları ve Haberler',
        description:
          'Türkiye seyahat rehberi, transfer ipuçları, destinasyon önerileri ve turizm haberleri.',
        keywords: 'seyahat rehberi, türkiye turizm, transfer ipuçları, seyahat blog',
      },
      en: {
        title: 'Blog | GNB Transfer - Travel Tips & News',
        description:
          'Turkey travel guide, transfer tips, destination recommendations and tourism news.',
        keywords: 'travel guide, turkey tourism, transfer tips, travel blog',
      },
    },
    contact: {
      tr: {
        title: 'İletişim | GNB Transfer',
        description: 'Bize ulaşın. Sorularınız ve özel taleplarınız için 7/24 müşteri hizmetleri.',
        keywords: 'iletişim, müşteri hizmetleri, destek',
      },
      en: {
        title: 'Contact | GNB Transfer',
        description: 'Get in touch. 24/7 customer service for your questions and special requests.',
        keywords: 'contact, customer service, support',
      },
    },
  };

  // Return data for requested page and language, fallback to English if not found
  return seoData[page]?.[lang] || seoData[page]?.en || seoData.home.en;
};
