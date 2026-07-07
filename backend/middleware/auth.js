// JWT AUTHENTICATION MIDDLEWARE
// Verifies User Access Token Before
// Allowing Access To Protected Routes
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// AUTHORIZATION CHECK
// Extract And Validate JWT Token
function auth(req, res, next) {
    let token = req.cookies?.token;

    // Check Authorization header as fallback for cross-domain deployments (e.g. Vercel)
    if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(" ");
        if (parts.length === 2 && parts[0] === "Bearer") {
            token = parts[1];
        }
    }

    if (!token) {
        return res.status(401).json({
            error: "No token"
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        req.userId = decoded.id;

        // Asynchronously update lastActive timestamp in the background
        // to maintain fast API response times without blocking the request thread.
        User.findByIdAndUpdate(decoded.id, { lastActive: new Date() }).catch(() => {
            // Fail-silent to prevent transient DB issues from breaking user requests
        });

        next();

    } catch {
        return res.status(401).json({
            error: "Invalid token"
        });
    }
}

// EXPORT MIDDLEWARE
module.exports = auth;