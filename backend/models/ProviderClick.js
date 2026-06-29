const mongoose = require("mongoose");

const providerClickSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    movieId: Number,

    movieTitle: String,

    provider: String,

    genre: String,
clickedAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30
}
});

providerClickSchema.index({ userId: 1 });

module.exports =
mongoose.model(
    "ProviderClick",
    providerClickSchema
);