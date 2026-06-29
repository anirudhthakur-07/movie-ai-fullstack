const mongoose = require("mongoose");

const searchHistorySchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

   query: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
},

    searchedAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 30
    }

});
searchHistorySchema.index(
    {
        userId: 1,
        query: 1
    },
    {
        unique: true
    }
);
module.exports =
mongoose.model(
    "SearchHistory",
    searchHistorySchema
);