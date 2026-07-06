// ADMIN AUTHORIZATION MIDDLEWARE
// Restricts access to admin-only routes
// Must be used AFTER the standard auth middleware
const User = require("../models/User");

async function adminAuth(req, res, next) {
    try {
        const user = await User.findById(req.userId).select("isAdmin");
        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: "Admin access required" });
        }
        next();
    } catch (err) {
        return res.status(500).json({ error: "Authorization check failed" });
    }
}

module.exports = adminAuth;
