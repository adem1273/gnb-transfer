import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

// Section renderers
const HeroSection = ({ data }) => (
  <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
    <div className="container mx-auto px-4 text-center">
      <h1 className="text-4xl md:text-6xl font-bold mb-4">{data.title}</h1>
      {data.subtitle && <p className="text-xl md:text-2xl mb-8">{data.subtitle}</p>}
      {data.buttonText && data.buttonLink && (
        <Link
          to={data.buttonLink}
          className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          {data.buttonText}
        </Link>
      )}
    </div>
  </section>
);

const FeaturesSection = ({ data }) => (
  <section className="py-16 bg-gray-50">
    <div className="container mx-auto px-4">
      {data.title && <h2 className="text-3xl font-bold text-center mb-12">{data.title}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {data.features?.map((feature, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            {feature.icon && <div className="text-4xl mb-4">{feature.icon}</div>}
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const ToursSection = ({ data }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const limit = data.limit || 6;
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || '/api'}/tours?limit=${limit}`
        );
        const result = await response.json();
        if (result.success) {
          setTours(result.data.tours || result.data);
        }
      } catch (error) {
        console.error('Error fetching tours:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, [data.limit]);

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">Loading tours...</div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          {data.title || 'Our Tours'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tours.slice(0, data.limit || 6).map((tour) => (
            <div key={tour._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {tour.images && tour.images[0] && (
                <img
                  src={tour.images[0]}
                  alt={tour.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{tour.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{tour.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 font-bold">${tour.price}</span>
                  <Link
                    to={`/tours/${tour._id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = ({ data }) => (
  <section className="py-16 bg-gray-50">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-12">
        {data.title || 'What Our Customers Say'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {data.testimonials?.map((testimonial, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
            <div className="flex items-center">
              {testimonial.avatar && (
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
              )}
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                {testimonial.role && (
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CTASection = ({ data }) => (
  <section className="py-16 bg-blue-600 text-white">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">{data.title}</h2>
      {data.subtitle && <p className="text-xl mb-8">{data.subtitle}</p>}
      {data.buttonText && data.buttonLink && (
        <Link
          to={data.buttonLink}
          className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          {data.buttonText}
        </Link>
      )}
    </div>
  </section>
);

const StatsSection = ({ data }) => (
  <section className="py-16">
    <div className="container mx-auto px-4">
      {data.title && <h2 className="text-3xl font-bold text-center mb-12">{data.title}</h2>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {data.stats?.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
            <div className="text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const GallerySection = ({ data }) => (
  <section className="py-16 bg-gray-50">
    <div className="container mx-auto px-4">
      {data.title && <h2 className="text-3xl font-bold text-center mb-12">{data.title}</h2>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.images?.map((image, index) => (
          <div key={index} className="relative overflow-hidden rounded-lg aspect-square">
            <img
              src={image}
              alt={`Gallery ${index + 1}`}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  </section>
);

const TextSection = ({ data }) => (
  <section className="py-16">
    <div className="container mx-auto px-4 max-w-4xl">
      {data.title && <h2 className="text-3xl font-bold mb-6">{data.title}</h2>}
      <div className="prose prose-lg max-w-none">
        {data.content}
      </div>
    </div>
  </section>
);

const FAQSection = ({ data }) => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-3xl font-bold text-center mb-12">
          {data.title || 'Frequently Asked Questions'}
        </h2>
        <div className="space-y-4">
          {data.faqs?.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left p-4 font-semibold flex items-center justify-between hover:bg-gray-50"
              >
                <span>{faq.question}</span>
                <span className="text-2xl">{openIndex === index ? '−' : '+'}</span>
              </button>
              {openIndex === index && (
                <div className="p-4 pt-0 text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Section renderer mapping
const sectionRenderers = {
  hero: HeroSection,
  features: FeaturesSection,
  tours: ToursSection,
  testimonials: TestimonialsSection,
  cta: CTASection,
  stats: StatsSection,
  gallery: GallerySection,
  text: TextSection,
  faq: FAQSection,
};

const DynamicHomepage = () => {
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || '/api'}/home-layout`
        );

        if (response.status === 404) {
          // No active layout, use fallback
          setUseFallback(true);
          setLoading(false);
          return;
        }

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch homepage layout');
        }

        setLayout(result.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching homepage layout:', err);
        setError(err.message);
        setUseFallback(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLayout();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Fallback to static homepage if no layout or error
  if (useFallback || error || !layout) {
    return (
      <div>
        <Helmet>
          <title>GNB Transfer - Premium Transfer Services</title>
          <meta name="description" content="Book premium transfer services with GNB Transfer" />
        </Helmet>
        
        {/* Static fallback homepage - You can import your existing Home component here */}
        <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to GNB Transfer</h1>
            <p className="text-xl md:text-2xl mb-8">Premium Transfer Services</p>
            <Link
              to="/tours"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Explore Tours
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <Helmet>
        <title>{layout.seo?.title || 'GNB Transfer'}</title>
        <meta
          name="description"
          content={layout.seo?.description || 'Premium Transfer Services'}
        />
        {layout.seo?.keywords && layout.seo.keywords.length > 0 && (
          <meta name="keywords" content={layout.seo.keywords.join(', ')} />
        )}
        
        {/* JSON-LD Structured Data */}
        {layout.structuredData && Array.isArray(layout.structuredData) && layout.structuredData.length > 0 && (
          layout.structuredData.map((schema, index) => (
            <script key={index} type="application/ld+json">
              {JSON.stringify(schema)}
            </script>
          ))
        )}
      </Helmet>

      {layout.sections?.map((section, index) => {
        const SectionComponent = sectionRenderers[section.type];
        
        if (!SectionComponent) {
          console.warn(`Unknown section type: ${section.type}`);
          return null;
        }

        return <SectionComponent key={index} data={section.data} />;
      })}
    </div>
  );
};

export default DynamicHomepage;
