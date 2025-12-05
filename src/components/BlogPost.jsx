import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import API from '../utils/api';
import { useTranslation } from 'react-i18next';

function BlogPost() {
  const { id } = useParams(); // This is the slug
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'tr';

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/blogs/slug/${id}?lang=${currentLang}`);
        const data = res.data?.data;
        setPost(data?.post || null);
        setRelatedPosts(data?.relatedPosts || []);
        setError('');
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError(t('blog.loadError') || 'Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, currentLang, t]);

  const handleShare = async (platform) => {
    const shareUrl = window.location.href;
    const shareTitle = post?.title || '';

    // Record share
    try {
      await API.post(`/blogs/${post._id}/share`, { platform });
    } catch (err) {
      console.error('Failed to record share:', err);
    }

    // Open share dialog
    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        alert(t('blog.linkCopied') || 'Link kopyalandı!');
        return;
      default:
        return;
    }
    window.open(url, '_blank', 'width=600,height=400');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLang === 'tr' ? 'tr-TR' : currentLang, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t('blog.notFound') || 'Yazı bulunamadı'}
        </h1>
        <Link
          to="/blog"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          {t('blog.backToBlog') || '← Blog\'a Dön'}
        </Link>
      </div>
    );
  }

  // SEO data
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gnbtransfer.com';
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const pageTitle = post.metaTitle || post.title;
  const pageDescription = post.metaDescription || post.excerpt || post.title;

  // JSON-LD Article structured data
  const jsonLdArticle = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: pageDescription,
    image: post.featuredImage,
    author: {
      '@type': 'Organization',
      name: post.author || 'GNB Transfer',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/images/gnb-logo.png`,
      },
    },
    publisher: {
      '@type': 'Organization',
      name: 'GNB Transfer',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/images/gnb-logo.png`,
      },
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    wordCount: post.content ? post.content.split(/\s+/).length : 0,
    inLanguage: currentLang,
  };

  // Breadcrumb JSON-LD
  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('header.home') || 'Ana Sayfa',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{pageTitle} | GNB Transfer Blog</title>
        <meta name="description" content={pageDescription} />
        <meta name="author" content={post.author || 'GNB Transfer'} />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={postUrl} />
        <meta property="og:image" content={post.featuredImage} />
        <meta property="og:site_name" content="GNB Transfer" />
        <meta property="og:locale" content={currentLang} />
        <meta property="article:published_time" content={post.publishedAt} />
        <meta property="article:modified_time" content={post.updatedAt || post.publishedAt} />
        <meta property="article:author" content={post.author || 'GNB Transfer'} />
        <meta property="article:section" content={post.category} />
        {post.tags?.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={post.featuredImage} />
        
        {/* Canonical */}
        <link rel="canonical" href={postUrl} />
        
        {/* Alternate languages */}
        {post.availableLanguages?.map((lang) => {
          const langSlug = post.translations?.[lang]?.slug;
          if (langSlug) {
            return (
              <link
                key={lang}
                rel="alternate"
                hrefLang={lang}
                href={`${siteUrl}/${lang !== 'tr' ? lang + '/' : ''}blog/${langSlug}`}
              />
            );
          }
          return null;
        })}
        
        {/* JSON-LD */}
        <script type="application/ld+json">{JSON.stringify(jsonLdArticle)}</script>
        <script type="application/ld+json">{JSON.stringify(jsonLdBreadcrumb)}</script>
      </Helmet>

      {/* Hero Image */}
      <div className="relative h-64 md:h-96 bg-gray-900">
        <img
          src={post.featuredImage}
          alt={post.title}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <article className="max-w-4xl mx-auto px-4 -mt-32 relative z-10">
        {/* Article Header */}
        <div className="bg-white rounded-xl shadow-xl p-6 md:p-10 mb-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-blue-600">{t('header.home') || 'Ana Sayfa'}</Link>
            <span className="mx-2">/</span>
            <Link to="/blog" className="hover:text-blue-600">Blog</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{post.title.substring(0, 30)}...</span>
          </nav>

          {/* Category */}
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">
            {post.category}
          </span>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center text-gray-500 text-sm gap-4 mb-6">
            <div className="flex items-center">
              <img
                src={post.authorAvatar || '/images/gnb-logo.png'}
                alt={post.author}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <p className="font-medium text-gray-900">{post.author || 'GNB Transfer'}</p>
                <p>{formatDate(post.publishedAt)}</p>
              </div>
            </div>
            {post.readingTime && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {post.readingTime} {t('blog.minRead') || 'dk okuma'}
              </span>
            )}
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {post.views} {t('blog.views') || 'görüntülenme'}
            </span>
          </div>

          {/* Share Buttons */}
          <div className="flex flex-wrap items-center gap-2 pb-6 border-b">
            <span className="text-gray-500 text-sm">{t('blog.share') || 'Paylaş'}:</span>
            <button
              onClick={() => handleShare('whatsapp')}
              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
              title="WhatsApp"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className="p-2 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors"
              title="Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              title="Facebook"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="p-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors"
              title="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
              title={t('blog.copyLink') || 'Linki Kopyala'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Article Content */}
          <div
            className="prose prose-lg max-w-none mt-8"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <span className="text-gray-500 text-sm mr-2">{t('blog.tags') || 'Etiketler'}:</span>
              {post.tags.map((tag, index) => (
                <Link
                  key={index}
                  to={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full mr-2 mb-2 hover:bg-gray-200"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* CTA Box */}
          {post.ctas && post.ctas.length > 0 && (
            <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-2">
                {t('blog.ctaBoxTitle') || 'VIP Transfer Rezervasyonu'}
              </h3>
              <p className="text-blue-100 mb-4">
                {t('blog.ctaBoxDescription') || `${post.pricingInfo?.startingPrice || 75}${post.pricingInfo?.currency || '$'}'dan başlayan fiyatlarla profesyonel transfer hizmeti!`}
              </p>
              {post.pricingInfo?.discountCode && (
                <p className="text-sm text-blue-200 mb-4">
                  {t('blog.discountCode') || 'İndirim Kodu'}: <strong className="text-white">{post.pricingInfo.discountCode}</strong>
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                {post.ctas.map((cta, index) => (
                  <Link
                    key={index}
                    to={cta.url}
                    className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
                      cta.style === 'whatsapp'
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : cta.style === 'secondary'
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : 'bg-white text-blue-600 hover:bg-gray-100'
                    }`}
                  >
                    {cta.text}
                  </Link>
                ))}
                {post.whatsappNumber && (
                  <a
                    href={`https://wa.me/${post.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Additional Images */}
          {post.images && post.images.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {t('blog.gallery') || 'Galeri'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {post.images.map((image, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.alt || `${post.title} - ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {image.caption && (
                      <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-sm p-2">
                        {image.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-10 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('blog.relatedPosts') || 'İlgili Yazılar'}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost._id}
                  to={`/blog/${relatedPost.slug}`}
                  className="group"
                >
                  <div className="aspect-video rounded-lg overflow-hidden mb-3">
                    <img
                      src={relatedPost.featuredImage}
                      alt={relatedPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {relatedPost.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(relatedPost.publishedAt)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to Blog */}
        <div className="text-center pb-12">
          <Link
            to="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('blog.backToBlog') || 'Blog\'a Dön'}
          </Link>
        </div>
      </article>
    </div>
  );
}

export default BlogPost;