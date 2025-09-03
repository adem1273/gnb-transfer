const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    title_ar: { type: String },
    title_ru: { type: String },
    title_es: { type: String },
    title_zh: { type: String },
    title_hi: { type: String },
    title_de: { type: String },
    title_it: { type: String },
    content: { type: String, required: true },
    content_ar: { type: String },
    content_ru: { type: String },
    content_es: { type: String },
    content_zh: { type: String },
    content_hi: { type: String },
    content_de: { type: String },
    content_it: { type: String },
    author: { type: String, default: 'GNB Transfer' },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);