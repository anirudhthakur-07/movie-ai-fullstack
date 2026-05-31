// JWT AUTHENTICATION MIDDLEWARE
// Verifies User Access Token Before
// Allowing Access To Protected Routes
const jwt = require("jsonwebtoken");
// AUTHORIZATION CHECK
// Extract And Validate JWT Token
function auth(req, res, next) {

    const token =
        req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            error: "No token"
        });
    }

    try {

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        req.userId = decoded.id;

        next();

    } catch {

        return res.status(401).json({
            error: "Invalid token"
        });
    }
}
// EXPORT MIDDLEWARE
module.exports = auth;