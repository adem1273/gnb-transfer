import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * OptimizedImage Component
 * Provides lazy loading, responsive images, and WebP support with fallbacks
 *
 * @param {string} src - Image source URL
 * @param {string} alt - Alternative text for accessibility
 * @param {string} className - CSS classes
 * @param {string} srcSet - Responsive image sources (optional)
 * @param {string} sizes - Image sizes for different viewports (optional)
 * @param {string} webpSrc - WebP format source (optional)
 * @param {string} loading - Loading strategy: 'lazy' (default) or 'eager'
 * @param {Function} onLoad - Callback when image loads
 * @param {Function} onError - Callback when image fails to load
 */
const OptimizedImage = ({
  src,
  alt,
  className = '',
  srcSet,
  sizes,
  webpSrc,
  loading = 'lazy',
  onLoad,
  onError,
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) onError(e);
  };

  // Fallback placeholder for broken images
  if (hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <picture>
      {/* WebP format for modern browsers */}
      {webpSrc && <source type="image/webp" srcSet={webpSrc} sizes={sizes} />}

      {/* Fallback to original format */}
      <img
        src={src}
        alt={alt}
        className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
        srcSet={srcSet}
        sizes={sizes}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        {...rest}
      />
    </picture>
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  srcSet: PropTypes.string,
  sizes: PropTypes.string,
  webpSrc: PropTypes.string,
  loading: PropTypes.oneOf(['lazy', 'eager']),
  onLoad: PropTypes.func,
  onError: PropTypes.func,
};

export default OptimizedImage;
