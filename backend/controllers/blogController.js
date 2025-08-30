const Blog = require('../models/blogModel');

// Tüm blog yazılarını listele
exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch blogs.' });
    }
};

// ID'ye göre tek bir blog yazısını getir
exports.getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog post not found.' });
        }
        res.json(blog);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch blog post.' });
    }
};

// Yeni blog yazısı oluştur (admin yetkisi gerekir)
exports.createBlog = async (req, res) => {
    const { title, content, isGeneratedByAI, target_location, ...translations } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required.' });
    }
    try {
        const blog = await Blog.create({ title, content, isGeneratedByAI, target_location, ...translations });
        res.status(201).json(blog);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create blog post.' });
    }
};

// Blog yazısını güncelle (admin yetkisi gerekir)
exports.updateBlog = async (req, res) => {
    try {
        const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!blog) {
            return res.status(404).json({ message: 'Blog post not found.' });
        }
        res.json(blog);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update blog post.' });
    }
};

// Blog yazısını sil (admin yetkisi gerekir)
exports.deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findByIdAndDelete(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog post not found.' });
        }
        res.json({ message: 'Blog post deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete blog post.' });
    }
};