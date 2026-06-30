const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
    buildUserProfile
} = require("../services/profileEngine");

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
const User = require("../models/User");
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

module.exports = router;