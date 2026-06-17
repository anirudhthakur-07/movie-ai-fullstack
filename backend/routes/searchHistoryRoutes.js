const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const SearchHistory =
require("../models/SearchHistory");


router.post("/history", auth, async (req, res) => {

    try {

        const { query } = req.body;

        console.log("USER ID:", req.userId);
        console.log("QUERY:", query);
    if (!query) {

    return res.status(400).json({
        error: "Query required"
    });
}

await SearchHistory.findOneAndUpdate(
    {
        userId: req.userId,
        query: query.trim().toLowerCase()
    },
    {
        $set: {
            query: query.trim().toLowerCase(),
            searchedAt: new Date()
        }
    },
    {
        upsert: true,
        new: true
    }
);
        console.log("SEARCH SAVED");

        res.json({
            success: true
        });

    } catch (err) {

        console.error("SEARCH HISTORY ERROR:");
        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
});
router.get("/history", auth, async (req, res) => {

    try {

        const history =
        await SearchHistory
        .find({
            userId: req.userId
        })
        .sort({
            searchedAt: -1
        })
        .limit(10);

        res.json(history);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Failed"
        });
    }
});
module.exports = router;