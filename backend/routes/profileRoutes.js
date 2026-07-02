const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
    buildUserProfile
} = require("../services/profileEngine");
const { generateProfileSummary } = require("../services/aiService");
const ProviderClick = require("../models/ProviderClick");
const User = require("../models/User");

router.get("/profile", auth, async (req, res) => {

    try {

        const profile =
            await buildUserProfile(req.userId);
            if (!profile) {
return res.json({
    profileStrength: "Low",
    activityLevel: "Casual",
    personality: "Movie Fan",
    status: "profile_missing"
});

}
        res.json(profile);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Profile failed"
        });
    }
});

// Update Profile Gender (for male/female avatar selection of active persona)
router.post("/profile/gender", auth, async (req, res) => {
    try {
        const { gender } = req.body;
        if (gender !== "male" && gender !== "female") {
            return res.status(400).json({ error: "Invalid gender choice" });
        }
        await User.updateOne({ _id: req.userId }, { $set: { gender } });
        res.json({ message: "Gender selection updated", gender });
    } catch (err) {
        console.error("Gender update error:", err);
        res.status(500).json({ error: "Failed to update profile gender" });
    }
});

// GET AI TASTE PROFILE SUMMARY (Gemini API)
router.get("/profile/ai-summary", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const profile = await buildUserProfile(req.userId);
        if (!profile) {
            return res.json({ summary: null });
        }

        const totalClicks = await ProviderClick.countDocuments({ userId: req.userId });

        // Generate actual summary via Gemini API
        const summary = await generateProfileSummary(
            user.username,
            profile.personality,
            profile.watchlistCount,
            profile.topGenres || [],
            totalClicks,
            profile.activityLevel
        );

        res.json({ summary });
    } catch (err) {
        console.error("AI summary route error:", err);
        res.json({ summary: null });
    }
});

module.exports = router;