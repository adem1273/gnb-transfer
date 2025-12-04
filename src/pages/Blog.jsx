import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Blog() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-gray-50">
            <Helmet>
                <title>GNB Transfer Blog | Latest News & Travel Guides</title>
                <meta name="description" content="Explore our latest blog posts about tours, transfers, and travel tips." />
            </Helmet>
            
            <div className="max-w-4xl mx-auto px-4 py-16">
                <div className="text-center">
                    {/* Construction Icon */}
                    <div className="flex justify-center mb-8">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg 
                                className="w-12 h-12 text-blue-600" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" 
                                />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        {t('blog.comingSoon') || 'Blog Yakında'}
                    </h1>
                    
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        {t('blog.underConstruction') || 'Bu sayfa yapım aşamasındadır. Yakında seyahat ipuçları, tur önerileri ve daha fazlası için blog yazılarımızı burada bulabileceksiniz.'}
                    </p>

                    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            {t('blog.whatToExpect') || 'Neler Bekliyorsunuz?'}
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6 text-left">
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-gray-600">{t('blog.feature1') || 'Seyahat İpuçları'}</span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-gray-600">{t('blog.feature2') || 'Destinasyon Rehberleri'}</span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-gray-600">{t('blog.feature3') || 'Özel Tur Önerileri'}</span>
                            </div>
                        </div>
                    </div>

                    <Link 
                        to="/"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        {t('blog.backToHome') || 'Anasayfaya Dön'}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Blog;