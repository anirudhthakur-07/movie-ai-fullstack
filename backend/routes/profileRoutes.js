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

module.exports = router;