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

        res.json(profile);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Profile failed"
        });
    }
});

module.exports = router;