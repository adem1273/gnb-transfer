import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import Loading from '../components/Loading';
import ImageUpload from '../components/ImageUpload';
import { ConfirmModal, LoadingButton } from '../components/ui';
import { useToast } from '../components/ui/ToastProvider';
import { handleError } from '../utils/errorHandler';

function BlogManager() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [filter, setFilter] = useState({ status: '', category: '' });

  // Confirmation modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [postToPublish, setPostToPublish] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [publishingPostId, setPublishingPostId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    category: 'general',
    tags: '',
    status: 'draft',
    seo: {
      metaTitle: '',
      metaDescription: '',
      focusKeyword: '',
    },
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.category) params.append('category', filter.category);

      const response = await API.get(`/blog?${params.toString()}`);
      setPosts(response.data.data.posts || []);
      setError('');
    } catch (err) {
      const { userMessage } = handleError(err, 'fetching blog posts');
      setError(userMessage);
      toast.error(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const payload = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (editingPost) {
        await API.patch(`/blog/${editingPost._id}`, payload);
        toast.success('Post updated successfully');
      } else {
        await API.post('/blog', payload);
        toast.success('Post created successfully');
      }

      setShowForm(false);
      setEditingPost(null);
      resetForm();
      fetchPosts();
    } catch (err) {
      const { userMessage } = handleError(err, 'saving post');
      setError(userMessage);
      toast.error(userMessage);
    }
  };

  const handleDeleteClick = (post) => {
    setPostToDelete(post);
    setDeleteModalOpen(true);
  };

  const deletePost = async () => {
    if (!postToDelete) return;

    setDeletingPostId(postToDelete._id);
    try {
      await API.delete(`/blog/${postToDelete._id}`);
      toast.success('Post deleted successfully');
      setDeleteModalOpen(false);
      setPostToDelete(null);
      fetchPosts();
    } catch (err) {
      const { userMessage } = handleError(err, 'deleting post');
      toast.error(userMessage);
    } finally {
      setDeletingPostId(null);
    }
  };

  const handlePublishClick = (post) => {
    setPostToPublish(post);
    setPublishModalOpen(true);
  };

  const togglePublish = async () => {
    if (!postToPublish) return;

    setPublishingPostId(postToPublish._id);
    try {
      const newStatus = postToPublish.status !== 'published';
      await API.patch(`/blog/${postToPublish._id}/publish`, { publish: newStatus });
      toast.success(
        postToPublish.status === 'published'
          ? 'Post unpublished successfully'
          : 'Post published successfully'
      );
      setPublishModalOpen(false);
      setPostToPublish(null);
      fetchPosts();
    } catch (err) {
      const { userMessage } = handleError(err, 'updating post status');
      toast.error(userMessage);
    } finally {
      setPublishingPostId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      category: 'general',
      tags: '',
      status: 'draft',
      seo: {
        metaTitle: '',
        metaDescription: '',
        focusKeyword: '',
      },
    });
  };

  const editPost = async (post) => {
    try {
      const response = await API.get(`/blog/${post._id}`);
      const fullPost = response.data.data;
      setEditingPost(fullPost);
      setFormData({
        title: fullPost.title,
        slug: fullPost.slug,
        excerpt: fullPost.excerpt || '',
        content: fullPost.content,
        featuredImage: fullPost.featuredImage || '',
        category: fullPost.category,
        tags: fullPost.tags?.join(', ') || '',
        status: fullPost.status,
        seo: {
          metaTitle: fullPost.seo?.metaTitle || '',
          metaDescription: fullPost.seo?.metaDescription || '',
          focusKeyword: fullPost.seo?.focusKeyword || '',
        },
      });
      setShowForm(true);
    } catch (err) {
      const { userMessage } = handleError(err, 'loading post');
      setError(userMessage);
      toast.error(userMessage);
    }
  };

  const generateSlug = (title) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);

  if (loading && !showForm) return <Loading message="Loading posts..." />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">📝 Blog & SEO Content Manager</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingPost(null);
            resetForm();
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          {showForm ? 'Cancel' : '+ New Post'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
          <button onClick={() => setSuccess('')} className="float-right font-bold">
            ×
          </button>
        </div>
      )}

      {/* Post Editor */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingPost ? 'Edit Post' : 'Create New Post'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      title: e.target.value,
                      slug: formData.slug || generateSlug(e.target.value),
                    });
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="auto-generated-from-title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="general">General</option>
                  <option value="travel">Travel</option>
                  <option value="tips">Tips</option>
                  <option value="news">News</option>
                  <option value="destinations">Destinations</option>
                  <option value="services">Services</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <ImageUpload
                  onImageUploaded={(url) => setFormData({ ...formData, featuredImage: url })}
                  currentImage={formData.featuredImage}
                  label="Featured Image"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="istanbul, airport, transfer"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full border rounded px-3 py-2 h-20"
                  placeholder="Brief summary for listings..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.excerpt.length}/500</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border rounded px-3 py-2 h-64 font-mono text-sm"
                  required
                  placeholder="Write your post content here... (HTML supported)"
                />
              </div>
            </div>

            {/* SEO Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-3">🔍 SEO Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Meta Title (max 70 chars)
                  </label>
                  <input
                    type="text"
                    value={formData.seo.metaTitle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, metaTitle: e.target.value },
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                    maxLength={70}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.seo.metaTitle.length}/70</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Focus Keyword</label>
                  <input
                    type="text"
                    value={formData.seo.focusKeyword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, focusKeyword: e.target.value },
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Meta Description (max 160 chars)
                  </label>
                  <textarea
                    value={formData.seo.metaDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, metaDescription: e.target.value },
                      })
                    }
                    className="w-full border rounded px-3 py-2 h-16"
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.seo.metaDescription.length}/160
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {editingPost ? 'Update' : 'Create'} Post
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingPost(null);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      {!showForm && (
        <div className="bg-white p-4 rounded-lg shadow flex gap-4 items-center">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">All Categories</option>
            <option value="general">General</option>
            <option value="travel">Travel</option>
            <option value="tips">Tips</option>
            <option value="news">News</option>
            <option value="destinations">Destinations</option>
            <option value="services">Services</option>
          </select>
          <button
            onClick={() => setFilter({ status: '', category: '' })}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      )}

      {/* Posts List */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Views
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{post.title}</div>
                    <div className="text-xs text-gray-500">/{post.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs bg-gray-100 rounded">{post.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : post.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{post.views || 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString()
                      : new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => editPost(post)}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      Edit
                    </button>
                    <LoadingButton
                      type="button"
                      onClick={() => handlePublishClick(post)}
                      loading={publishingPostId === post._id}
                      variant="secondary"
                      className="text-purple-600 hover:text-purple-800 mr-2 px-2 py-1 text-sm"
                    >
                      {post.status === 'published' ? 'Unpublish' : 'Publish'}
                    </LoadingButton>
                    <LoadingButton
                      type="button"
                      onClick={() => handleDeleteClick(post)}
                      loading={deletingPostId === post._id}
                      variant="danger"
                      className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
                    >
                      Delete
                    </LoadingButton>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No posts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Blog Post"
        message={`Are you sure you want to delete "${postToDelete?.title}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={deletePost}
        onCancel={() => {
          setDeleteModalOpen(false);
          setPostToDelete(null);
        }}
      />

      {/* Publish/Unpublish Confirmation Modal */}
      <ConfirmModal
        open={publishModalOpen}
        title={postToPublish?.status === 'published' ? 'Unpublish Post' : 'Publish Post'}
        message={
          postToPublish?.status === 'published'
            ? `Are you sure you want to unpublish "${postToPublish?.title}"? It will no longer be visible to the public.`
            : `Are you sure you want to publish "${postToPublish?.title}"? It will be visible to the public.`
        }
        confirmButtonText={postToPublish?.status === 'published' ? 'Unpublish' : 'Publish'}
        cancelButtonText="Cancel"
        onConfirm={togglePublish}
        onCancel={() => {
          setPublishModalOpen(false);
          setPostToPublish(null);
        }}
      />
    </div>
  );
}

export default BlogManager;
