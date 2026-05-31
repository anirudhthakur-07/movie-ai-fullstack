const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: String,
    year: String,
    poster: String,
    tmdbId: { type: Number, index: true },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 15
    }
});

module.exports = mongoose.model('Movie', movieSchema);