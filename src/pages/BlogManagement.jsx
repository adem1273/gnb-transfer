import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import API from '../utils/api';
import ImageUpload from '../components/ImageUpload';

const SUPPORTED_LANGUAGES = ['tr', 'en', 'ar', 'ru', 'de', 'fr', 'es', 'zh', 'fa'];
const LANGUAGE_NAMES = {
  tr: 'Türkçe',
  en: 'English',
  ar: 'العربية',
  ru: 'Русский',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  zh: '中文',
  fa: 'فارسی',
};

const CATEGORIES = [
  { id: 'transfer-prices', label: 'Transfer Fiyatları' },
  { id: 'destinations', label: 'Destinasyonlar' },
  { id: 'services', label: 'Hizmetler' },
  { id: 'tips', label: 'Seyahat İpuçları' },
  { id: 'news', label: 'Haberler' },
  { id: 'promotions', label: 'Kampanyalar' },
  { id: 'seasonal', label: 'Sezonluk' },
];

function BlogManagement() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [activeTab, setActiveTab] = useState('tr');
  const [filter, setFilter] = useState({ status: '', category: '' });

  // Form state
  const [formData, setFormData] = useState({
    translations: SUPPORTED_LANGUAGES.reduce(
      (acc, lang) => ({
        ...acc,
        [lang]: { title: '', slug: '', metaTitle: '', metaDescription: '', excerpt: '', content: '' },
      }),
      {}
    ),
    featuredImage: '',
    images: [],
    category: 'services',
    tags: SUPPORTED_LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang]: [] }), {}),
    status: 'draft',
    ctas: [{ text: 'Hemen Rezervasyon Yap', url: '/booking', style: 'primary' }],
    pricingInfo: { startingPrice: 75, currency: '$', discountCode: 'VIP2026' },
    whatsappNumber: '+905551234567',
    priority: 0,
  });

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.category) params.append('category', filter.category);

      const res = await API.get(`/blogs/admin/all?${params.toString()}`);
      setPosts(res.data?.data?.posts || []);
      setError('');
    } catch (err) {
      setError('Blog yazıları yüklenemedi');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (lang, value) => {
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: {
          ...prev.translations[lang],
          title: value,
          slug: generateSlug(value),
        },
      },
    }));
  };

  const handleTranslationChange = (lang, field, value) => {
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: {
          ...prev.translations[lang],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPost) {
        await API.put(`/blogs/${editingPost._id}`, formData);
      } else {
        await API.post('/blogs', formData);
      }
      setShowModal(false);
      resetForm();
      fetchPosts();
    } catch (err) {
      setError('Blog yazısı kaydedilemedi');
      console.error('Error saving post:', err);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      translations: post.translations || {},
      featuredImage: post.featuredImage || '',
      images: post.images || [],
      category: post.category || 'services',
      tags: post.tags || {},
      status: post.status || 'draft',
      ctas: post.ctas || [{ text: 'Hemen Rezervasyon Yap', url: '/booking', style: 'primary' }],
      pricingInfo: post.pricingInfo || { startingPrice: 75, currency: '$', discountCode: 'VIP2026' },
      whatsappNumber: post.whatsappNumber || '+905551234567',
      priority: post.priority || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu blog yazısını silmek istediğinize emin misiniz?')) return;
    try {
      await API.delete(`/blogs/${id}`);
      fetchPosts();
    } catch (err) {
      setError('Blog yazısı silinemedi');
      console.error('Error deleting post:', err);
    }
  };

  const resetForm = () => {
    setEditingPost(null);
    setFormData({
      translations: SUPPORTED_LANGUAGES.reduce(
        (acc, lang) => ({
          ...acc,
          [lang]: { title: '', slug: '', metaTitle: '', metaDescription: '', excerpt: '', content: '' },
        }),
        {}
      ),
      featuredImage: '',
      images: [],
      category: 'services',
      tags: SUPPORTED_LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang]: [] }), {}),
      status: 'draft',
      ctas: [{ text: 'Hemen Rezervasyon Yap', url: '/booking', style: 'primary' }],
      pricingInfo: { startingPrice: 75, currency: '$', discountCode: 'VIP2026' },
      whatsappNumber: '+905551234567',
      priority: 0,
    });
    setActiveTab('tr');
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
        {status === 'draft' ? 'Taslak' : status === 'published' ? 'Yayında' : 'Arşiv'}
      </span>
    );
  };

  return (
    <div className="p-6">
      <Helmet>
        <title>Blog Yönetimi | GNB Transfer Admin</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📝 Blog Yönetimi</h1>
          <p className="text-gray-600 mt-1">9 dilde blog yazıları oluşturun ve yönetin</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Yazı
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
        <select
          value={filter.status}
          onChange={(e) => setFilter((prev) => ({ ...prev, status: e.target.value }))}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Tüm Durumlar</option>
          <option value="draft">Taslak</option>
          <option value="published">Yayında</option>
          <option value="archived">Arşiv</option>
        </select>
        <select
          value={filter.category}
          onChange={(e) => setFilter((prev) => ({ ...prev, category: e.target.value }))}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Tüm Kategoriler</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
        <div className="ml-auto text-gray-600">
          Toplam: <strong>{posts.length}</strong> yazı
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Posts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Henüz blog yazısı yok</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Başlık
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Görüntüleme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {post.featuredImage && (
                        <img
                          src={post.featuredImage}
                          alt=""
                          className="w-10 h-10 rounded object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {post.translations?.tr?.title || 'Başlıksız'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {post.translations?.tr?.slug || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {CATEGORIES.find((c) => c.id === post.category)?.label || post.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(post.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <span
                          key={lang}
                          className={`px-1.5 py-0.5 text-xs rounded ${
                            post.translations?.[lang]?.title
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {lang.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{post.views || 0}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('tr-TR')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(post)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingPost ? 'Blog Yazısını Düzenle' : 'Yeni Blog Yazısı'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <form onSubmit={handleSubmit}>
                {/* Language Tabs */}
                <div className="mb-6">
                  <div className="flex gap-1 border-b">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setActiveTab(lang)}
                        className={`px-4 py-2 font-medium text-sm ${
                          activeTab === lang
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {LANGUAGE_NAMES[lang]}
                        {formData.translations?.[lang]?.title && (
                          <span className="ml-1 text-green-500">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Translation Fields */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Başlık ({LANGUAGE_NAMES[activeTab]}) *
                    </label>
                    <input
                      type="text"
                      value={formData.translations?.[activeTab]?.title || ''}
                      onChange={(e) => handleTitleChange(activeTab, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required={activeTab === 'tr'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      value={formData.translations?.[activeTab]?.slug || ''}
                      onChange={(e) => handleTranslationChange(activeTab, 'slug', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Başlık (SEO)
                    </label>
                    <input
                      type="text"
                      value={formData.translations?.[activeTab]?.metaTitle || ''}
                      onChange={(e) => handleTranslationChange(activeTab, 'metaTitle', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      maxLength={70}
                    />
                    <span className="text-xs text-gray-500">
                      {(formData.translations?.[activeTab]?.metaTitle || '').length}/70
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Açıklama (SEO)
                    </label>
                    <input
                      type="text"
                      value={formData.translations?.[activeTab]?.metaDescription || ''}
                      onChange={(e) =>
                        handleTranslationChange(activeTab, 'metaDescription', e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      maxLength={160}
                    />
                    <span className="text-xs text-gray-500">
                      {(formData.translations?.[activeTab]?.metaDescription || '').length}/160
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Özet
                  </label>
                  <textarea
                    value={formData.translations?.[activeTab]?.excerpt || ''}
                    onChange={(e) => handleTranslationChange(activeTab, 'excerpt', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={2}
                    maxLength={500}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İçerik ({LANGUAGE_NAMES[activeTab]}) *
                  </label>
                  <textarea
                    value={formData.translations?.[activeTab]?.content || ''}
                    onChange={(e) => handleTranslationChange(activeTab, 'content', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                    rows={12}
                    placeholder="HTML içerik yazabilirsiniz..."
                    required={activeTab === 'tr'}
                  />
                </div>

                <hr className="my-6" />

                {/* Common Fields */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="col-span-3">
                    <ImageUpload
                      onImageUploaded={(url) => setFormData((prev) => ({ ...prev, featuredImage: url }))}
                      currentImage={formData.featuredImage}
                      label="Öne Çıkan Görsel *"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durum
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="draft">Taslak</option>
                      <option value="published">Yayında</option>
                      <option value="archived">Arşiv</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Başlangıç Fiyatı ($)
                    </label>
                    <input
                      type="number"
                      value={formData.pricingInfo?.startingPrice || 75}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pricingInfo: { ...prev.pricingInfo, startingPrice: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      İndirim Kodu
                    </label>
                    <input
                      type="text"
                      value={formData.pricingInfo?.discountCode || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pricingInfo: { ...prev.pricingInfo, discountCode: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      WhatsApp Numarası
                    </label>
                    <input
                      type="text"
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="+905551234567"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingPost ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlogManagement;
