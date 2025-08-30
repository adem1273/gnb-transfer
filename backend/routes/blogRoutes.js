const express = require('express');
const router = express.Router();
const { 
  getAllBlogs, 
  getBlogById, 
  createBlog, 
  updateBlog, 
  deleteBlog 
} = require('../controllers/blogController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Herkesin erişebileceği blog rotaları
router.get('/', getAllBlogs);
router.get('/:id', getBlogById);

// Admin yetkisi gerektiren blog yönetimi rotaları
router.post('/', verifyToken, verifyAdmin, createBlog);
router.put('/:id', verifyToken, verifyAdmin, updateBlog);
router.delete('/:id', verifyToken, verifyAdmin, deleteBlog);

module.exports = router;