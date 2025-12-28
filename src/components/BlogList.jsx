import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../utils/api';

function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await API.get('/blogs');
        setBlogs(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load blog posts. Please try again later.');
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const getTranslatedTitle = (blog) => {
    const langKey = `title_${currentLang}`;
    return blog[langKey] || blog.title;
  };

  const getTranslatedContent = (blog) => {
    const langKey = `content_${currentLang}`;
    return blog[langKey] || blog.content;
  };

  if (loading) return <p>Loading blog posts...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogs.map((blog) => (
        <div
          key={blog._id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
        >
          <div className="p-4">
            <Link to={`/blog/${blog._id}`}>
              <h2 className="text-xl font-bold text-gray-800 mb-2 hover:text-blue-600 transition-colors">
                {getTranslatedTitle(blog)}
              </h2>
            </Link>
            <p className="text-gray-600 mb-4">{getTranslatedContent(blog).substring(0, 150)}...</p>
            <Link
              to={`/blog/${blog._id}`}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Read More
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default BlogList;
