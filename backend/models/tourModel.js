const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
    title: { type: String, required: true },
    title_ar: { type: String },
    title_ru: { type: String },
    title_es: { type: String },
    title_zh: { type: String },
    title_hi: { type: String },
    title_de: { type: String },
    title_it: { type: String },
    description: { type: String },
    description_ar: { type: String },
    description_ru: { type: String },
    description_es: { type: String },
    description_zh: { type: String },
    description_hi: { type: String },
    description_de: { type: String },
    description_it: { type: String },
    price: { type: Number, required: true },
    duration: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    isCampaign: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Tour', tourSchema);