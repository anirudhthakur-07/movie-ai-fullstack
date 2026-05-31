const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    watchlist: [
        {
            tmdbId: Number,
            title: String,
            poster: String
        }
    ]
});

module.exports = mongoose.model('User', userSchema);