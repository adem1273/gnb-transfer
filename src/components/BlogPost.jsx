import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import API from '../utils/api';
import { useTranslation } from 'react-i18next';

function BlogPost() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await API.get(`/blogs/${id}`);
        setBlog(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load blog post.');
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  const getTranslatedTitle = (blog) => {
    const langKey = `title_${currentLang}`;
    return blog[langKey] || blog.title;
  };

  const getTranslatedContent = (blog) => {
    const langKey = `content_${currentLang}`;
    return blog[langKey] || blog.content;
  };

  if (loading) return <p className="text-center">Loading blog post...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!blog) return <p className="text-center">Blog post not found.</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Helmet>
        <title>{getTranslatedTitle(blog)} | GNB Transfer Blog</title>
        <meta name="description" content={getTranslatedContent(blog).substring(0, 160)} />
      </Helmet>
      <h1 className="text-3xl font-bold mb-4 text-gray-800">{getTranslatedTitle(blog)}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Published on {new Date(blog.createdAt).toLocaleDateString()} by {blog.author}
      </p>
      <div className="prose max-w-none text-gray-700">
        <p>{getTranslatedContent(blog)}</p>
      </div>
    </div>
  );
}

export default BlogPost;
