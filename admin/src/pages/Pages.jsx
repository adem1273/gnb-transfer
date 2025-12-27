import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import API from '../utils/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

function Pages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'published', 'draft'
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    sections: [],
    seo: {
      title: '',
      description: '',
    },
    published: false,
  });
  const [newSection, setNewSection] = useState({
    type: 'text',
    content: '',
  });

  useEffect(() => {
    fetchPages();
  }, [filter]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const filterParam = filter === 'all' ? '' : `?published=${filter === 'published'}`;
      const res = await API.get(`/admin/pages${filterParam}`);
      setPages(res.data.data.pages || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch pages');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    try {
      await API.delete(`/admin/pages/${id}`);
      setPages(pages.filter((page) => page._id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete page');
    }
  };

  const handleEdit = (page) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug || '',
      title: page.title || '',
      sections: page.sections || [],
      seo: page.seo || { title: '', description: '' },
      published: page.published || false,
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingPage(null);
    setFormData({
      slug: '',
      title: '',
      sections: [],
      seo: {
        title: '',
        description: '',
      },
      published: false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPage) {
        const res = await API.put(`/admin/pages/${editingPage._id}`, formData);
        const updatedPage = res.data.data;
        setPages(pages.map((p) => (p._id === editingPage._id ? updatedPage : p)));
      } else {
        const res = await API.post('/admin/pages', formData);
        const newPage = res.data.data;
        setPages([newPage, ...pages]);
      }
      setShowForm(false);
      setEditingPage(null);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || 'Failed to save page';
      alert(errorMsg);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPage(null);
  };

  const addSection = () => {
    if (!newSection.content.trim()) {
      alert('Section content cannot be empty');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, { ...newSection }],
    }));
    setNewSection({ type: 'text', content: '' });
  };

  const removeSection = (index) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const updateSection = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      ),
    }));
  };

  const filteredPages = pages;

  if (loading) return <p className="p-4">Loading pages...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header title="Pages" />
        <div className="p-4 max-w-6xl mx-auto">
          <Helmet>
            <title>GNB Transfer Admin | Pages</title>
          </Helmet>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Page Management</h2>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Create Page
            </button>
          </div>

          {/* Filter */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded ${
                filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-3 py-1 rounded ${
                filter === 'published' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-3 py-1 rounded ${
                filter === 'draft' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Drafts
            </button>
          </div>

          {showForm && (
            <div className="mb-6 p-4 border rounded bg-gray-50">
              <h3 className="text-xl font-bold mb-4">
                {editingPage ? 'Edit Page' : 'Create Page'}
              </h3>
              <form onSubmit={handleSubmit}>
                {/* Basic Info */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="url-friendly-slug"
                    required
                    pattern="[a-z0-9-]+"
                    title="Only lowercase letters, numbers, and hyphens allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL-friendly identifier (lowercase, hyphens only)
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>

                {/* SEO Section */}
                <div className="mb-4 p-3 bg-white rounded border">
                  <h4 className="font-medium mb-2">SEO Settings</h4>
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={formData.seo.title}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seo: { ...formData.seo, title: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border rounded"
                      maxLength={60}
                      placeholder="Max 60 characters"
                    />
                    <p className="text-xs text-gray-500">{formData.seo.title.length}/60</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">SEO Description</label>
                    <textarea
                      value={formData.seo.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seo: { ...formData.seo, description: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border rounded"
                      rows="2"
                      maxLength={160}
                      placeholder="Max 160 characters"
                    />
                    <p className="text-xs text-gray-500">{formData.seo.description.length}/160</p>
                  </div>
                </div>

                {/* Sections */}
                <div className="mb-4 p-3 bg-white rounded border">
                  <h4 className="font-medium mb-2">Content Sections</h4>

                  {formData.sections.map((section, index) => (
                    <div key={index} className="mb-3 p-3 bg-gray-50 rounded border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">
                          Section {index + 1} - {section.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSection(index)}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mb-2">
                        <label className="block text-xs font-medium mb-1">Type</label>
                        <select
                          value={section.type}
                          onChange={(e) => updateSection(index, 'type', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="markdown">Markdown</option>
                          <option value="image">Image Reference</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Content</label>
                        <textarea
                          value={section.content}
                          onChange={(e) => updateSection(index, 'content', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                          rows="3"
                        />
                        {section.type === 'image' && (
                          <p className="text-xs text-gray-500 mt-1">
                            Enter Media ID or image URL
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add New Section */}
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <h5 className="text-sm font-medium mb-2">Add New Section</h5>
                    <div className="flex gap-2 mb-2">
                      <select
                        value={newSection.type}
                        onChange={(e) => setNewSection({ ...newSection, type: e.target.value })}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="text">Text</option>
                        <option value="markdown">Markdown</option>
                        <option value="image">Image Reference</option>
                      </select>
                      <button
                        type="button"
                        onClick={addSection}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        Add Section
                      </button>
                    </div>
                    <textarea
                      value={newSection.content}
                      onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                      rows="2"
                      placeholder="Enter section content..."
                    />
                  </div>
                </div>

                {/* Publish Toggle */}
                <div className="mb-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Publish page</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {editingPage ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Pages Table */}
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Slug</th>
                <th className="border p-2">Title</th>
                <th className="border p-2">Sections</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Updated</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="border p-4 text-center text-gray-500">
                    No pages found
                  </td>
                </tr>
              ) : (
                filteredPages.map((page) => (
                  <tr key={page._id}>
                    <td className="border p-2 font-mono text-sm">{page.slug}</td>
                    <td className="border p-2">{page.title}</td>
                    <td className="border p-2 text-center">{page.sections?.length || 0}</td>
                    <td className="border p-2 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          page.published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {page.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="border p-2 text-sm">
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="border p-2">
                      <button
                        onClick={() => handleEdit(page)}
                        className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(page._id)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Pages;
