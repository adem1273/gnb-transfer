import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import { getSEOTranslations, generateLocalBusinessSchema } from '../utils/seoHelpers';
import { aboutImages, driverImages, airportImages } from '../config/images';

/**
 * About Page
 * Displays company information with professional images
 */
function About() {
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
        staggerChildren: 0.1,
      },
    },
  };

  const stats = [
    { number: '10,000+', label: t('about.stats.happyCustomers') || 'Happy Customers' },
    { number: '25,000+', label: t('about.stats.completedTransfers') || 'Completed Transfers' },
    { number: '50+', label: t('about.stats.professionalDrivers') || 'Professional Drivers' },
    { number: '7+', label: t('about.stats.yearsExperience') || 'Years of Experience' },
  ];

  const values = [
    {
      icon: '🛡️',
      title: t('about.safety') || 'Safety First',
      description:
        t('about.safetyText') ||
        'Your safety is our top priority with fully insured vehicles and professional drivers.',
    },
    {
      icon: '✨',
      title: t('about.comfort') || 'Comfort',
      description:
        t('about.comfortText') ||
        'Travel in style with our luxury fleet equipped with premium amenities.',
    },
    {
      icon: '⏰',
      title: t('about.reliability') || 'Reliability',
      description:
        t('about.reliabilityText') ||
        '24/7 service with real-time flight tracking and punctual pickups.',
    },
  ];

  // SEO data
  const localBusinessSchema = generateLocalBusinessSchema(currentLang);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="About Us | GNB Transfer"
        description="Learn about GNB Transfer - Your trusted partner for premium airport transfers and tours in Turkey."
        keywords="about GNB transfer, professional drivers, luxury transfers, Turkey tours"
        type="website"
        jsonLd={localBusinessSchema}
      />

      {/* Hero Section */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        <picture>
          <source type="image/webp" srcSet={aboutImages.team.webp} />
          <img
            src={aboutImages.team.src}
            srcSet={aboutImages.team.srcSet}
            sizes="100vw"
            alt={t(aboutImages.team.altKey)}
            className="w-full h-full object-cover"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-center text-white px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              {t('about.title') || 'About GNB Transfer'}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto">
              {t('about.subtitle') || 'Your trusted partner for premium transfers in Turkey'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                {t('about.ourStory') || 'Our Story'}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                {t('about.ourStoryText') ||
                  'Founded with a passion for excellence, GNB Transfer has been providing premium airport transfer and tour services across Turkey since 2018. We believe every journey should be comfortable, safe, and memorable.'}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our team of professional drivers and dedicated customer service representatives work
                around the clock to ensure your travel experience exceeds expectations. From airport
                pickups to city tours, we handle every detail with care.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <picture>
                  <source type="image/webp" srcSet={aboutImages.office.webp} />
                  <img
                    src={aboutImages.office.src}
                    srcSet={aboutImages.office.srcSet}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    alt={t(aboutImages.office.altKey)}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </picture>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {stats.map((stat, index) => (
              <motion.div key={index} className="text-center text-white" variants={fadeInUp}>
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                <p className="text-blue-100">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <picture>
                  <source type="image/webp" srcSet={aboutImages.mission.webp} />
                  <img
                    src={aboutImages.mission.src}
                    srcSet={aboutImages.mission.srcSet}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    alt={t(aboutImages.mission.altKey)}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </picture>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                {t('about.ourMission') || 'Our Mission'}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                {t('about.ourMissionText') ||
                  'To deliver world-class transfer services with professional drivers, luxury vehicles, and exceptional customer care. We strive to make every trip a premium experience.'}
              </p>

              {/* Values */}
              <div className="space-y-6">
                {values.map((value, index) => (
                  <motion.div
                    key={index}
                    className="flex gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <div className="text-3xl">{value.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">{value.title}</h3>
                      <p className="text-gray-600">{value.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Professional Drivers Section */}
      <section className="py-16 md:py-24 bg-gray-100">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              {t('about.meetTeam') || 'Meet Our Professional Drivers'}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('about.teamDescription') ||
                'Our dedicated team of professionals is committed to providing you with the best travel experience.'}
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {driverImages.map((driver, index) => (
              <motion.div
                key={driver.id}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                variants={fadeInUp}
                whileHover={{ y: -5 }}
              >
                <div className="h-64 overflow-hidden">
                  <picture>
                    <source type="image/webp" srcSet={driver.webp} />
                    <img
                      src={driver.src}
                      srcSet={driver.srcSet}
                      sizes="(max-width: 768px) 100vw, 25vw"
                      alt={t(driver.altKey)}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </picture>
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-semibold text-gray-800">Professional Driver</h3>
                  <p className="text-sm text-gray-500">Experienced & Certified</p>
                  <div className="flex justify-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className="w-4 h-4 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.242 3.824a1 1 0 00.95.691h4.025c.969 0 1.371 1.24.588 1.81l-3.253 2.365a1 1 0 00-.362 1.118l1.242 3.824c.3.921-.755 1.688-1.54 1.118l-3.253-2.365a1 1 0 00-1.176 0l-3.253 2.365c-.784.57-1.838-.197-1.54-1.118l1.242-3.824a1 1 0 00-.362-1.118L3.257 9.252c-.783-.57-.38-1.81.588-1.81h4.025a1 1 0 00.95-.691l1.242-3.824z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Airport Coverage Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Airport Coverage</h2>
            <p className="text-lg text-gray-600">We serve all major airports in Istanbul</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {airportImages.slice(0, 2).map((airport, index) => (
              <motion.div
                key={airport.id}
                className="relative h-64 rounded-xl overflow-hidden shadow-lg"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <picture>
                  <source type="image/webp" srcSet={airport.webp} />
                  <img
                    src={airport.src}
                    srcSet={airport.srcSet}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    alt={t(airport.altKey)}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold">{airport.airportName}</h3>
                  <p className="text-gray-200">24/7 pickup & drop-off service</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
