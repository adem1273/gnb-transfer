import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import { getSEOTranslations, generateServiceSchema } from '../utils/seoHelpers';
import { servicesPageImages, airportImages, fleetImages } from '../config/images';

/**
 * Services Page
 * Displays all services with professional images
 */
function Services() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const services = [
    {
      key: 'airportTransfer',
      image: servicesPageImages.airportTransfer,
      icon: '✈️',
      title: t('services.airportTransfer.title') || 'Airport Transfer',
      description:
        t('services.airportTransfer.description') ||
        'Comfortable and reliable airport pickup and drop-off services at Istanbul Airport and Sabiha Gökçen.',
      features: [
        t('services.features.flightTracking') || 'Real-time flight tracking',
        t('services.features.meetGreet') || 'Meet & greet service',
        t('services.features.support') || '24/7 customer support',
      ],
    },
    {
      key: 'cityTours',
      image: servicesPageImages.cityTours,
      icon: '🏛️',
      title: t('services.cityTours.title') || 'City Tours',
      description:
        t('services.cityTours.description') ||
        "Explore Istanbul and Turkey's most beautiful destinations with our guided tour services.",
      features: [
        t('services.features.multilingual') || 'Multilingual drivers',
        'Customizable itineraries',
        'Expert local knowledge',
      ],
    },
    {
      key: 'privateCharter',
      image: servicesPageImages.privateCharter,
      icon: '🚐',
      title: t('services.privateCharter.title') || 'Private Charter',
      description:
        t('services.privateCharter.description') ||
        'Exclusive vehicle hire for special occasions, events, and customized itineraries.',
      features: ['Luxury Mercedes fleet', 'Flexible scheduling', 'Dedicated chauffeur'],
    },
    {
      key: 'corporateTravel',
      image: servicesPageImages.corporateTravel,
      icon: '💼',
      title: t('services.corporateTravel.title') || 'Corporate Travel',
      description:
        t('services.corporateTravel.description') ||
        'Professional transportation solutions for business travelers and corporate events.',
      features: ['Corporate accounts', 'Invoice billing', 'Priority service'],
    },
  ];

  const features = [
    {
      icon: '📍',
      title: t('services.features.flightTracking') || 'Real-time Flight Tracking',
      description: 'We monitor your flight and adjust pickup time automatically.',
    },
    {
      icon: '👋',
      title: t('services.features.meetGreet') || 'Meet & Greet Service',
      description: 'Your driver will be waiting with a welcome sign at arrivals.',
    },
    {
      icon: '👶',
      title: t('services.features.childSeats') || 'Child & Baby Seats',
      description: 'Safe travel for the whole family with complimentary child seats.',
    },
    {
      icon: '🌍',
      title: t('services.features.multilingual') || 'Multilingual Drivers',
      description: 'Our drivers speak multiple languages for your convenience.',
    },
    {
      icon: '📞',
      title: t('services.features.support') || '24/7 Customer Support',
      description: 'Round-the-clock assistance whenever you need help.',
    },
    {
      icon: '💰',
      title: t('services.features.fixedPricing') || 'Fixed Transparent Pricing',
      description: 'No hidden fees or surge pricing. What you see is what you pay.',
    },
  ];

  // SEO data
  const seoData = getSEOTranslations('home', currentLang); // Using home as fallback
  const serviceSchema = generateServiceSchema({
    name: 'GNB Transfer Services',
    description:
      'Professional airport transfers, city tours, VIP transfers, and corporate travel solutions in Turkey',
    lang: currentLang,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Our Services | GNB Transfer"
        description="Explore GNB Transfer services - Airport transfers, city tours, private charter, and corporate travel solutions in Turkey."
        keywords="airport transfer, city tours, VIP transfer, corporate travel, private charter"
        type="website"
        jsonLd={serviceSchema}
      />

      {/* Hero Section */}
      <section className="relative h-[400px] overflow-hidden">
        <picture>
          <source type="image/webp" srcSet={airportImages[0].webp} />
          <img
            src={airportImages[0].src}
            srcSet={airportImages[0].srcSet}
            sizes="100vw"
            alt={t(airportImages[0].altKey)}
            className="w-full h-full object-cover"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-blue-600/60" />
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-white max-w-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {t('services.title') || 'Our Services'}
              </h1>
              <p className="text-xl text-blue-100">
                {t('services.subtitle') || 'Comprehensive transfer and tour solutions'}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid md:grid-cols-2 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {services.map((service, index) => (
              <motion.div
                key={service.key}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300"
                variants={fadeInUp}
                whileHover={{ y: -5 }}
              >
                {/* Service Image */}
                <div className="relative h-64 overflow-hidden">
                  <picture>
                    <source type="image/webp" srcSet={service.image.webp} />
                    <img
                      src={service.image.src}
                      srcSet={service.image.srcSet}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      alt={t(service.image.altKey)}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </picture>
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                    <span className="text-2xl">{service.icon}</span>
                    <span className="font-semibold text-gray-800">{service.title}</span>
                  </div>
                </div>

                {/* Service Content */}
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{service.description}</p>

                  {/* Features List */}
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <svg
                          className="w-4 h-4 text-green-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link to="/booking">
                    <motion.button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Book Now
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Why Choose GNB Transfer?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We go above and beyond to ensure your journey is comfortable, safe, and memorable.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="p-6 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors duration-300"
                variants={fadeInUp}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Fleet Preview Section */}
      <section className="py-16 md:py-24 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Premium Fleet</h2>
            <p className="text-lg text-gray-300">
              Travel in style with our luxury Mercedes vehicles
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fleetImages.slice(0, 4).map((image, index) => (
              <motion.div
                key={image.id}
                className="aspect-video rounded-lg overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <picture>
                  <source type="image/webp" srcSet={image.webp} />
                  <img
                    src={image.src}
                    srcSet={image.srcSet}
                    sizes="(max-width: 768px) 50vw, 25vw"
                    alt={t(image.altKey)}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </picture>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/tours">
              <motion.button
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View All Vehicles
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Book Your Transfer?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Experience premium transfer services with GNB Transfer. Book now and enjoy a
              comfortable journey.
            </p>
            <Link to="/booking">
              <motion.button
                className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Book Your Transfer Now
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default Services;
