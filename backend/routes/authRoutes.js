// AUTHENTICATION ROUTES
// User Registration & Login Management
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const JWT_SECRET =process.env.JWT_SECRET;

const rateLimit = require("express-rate-limit");
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  message: { error: "Too many authentication attempts, please try again after 15 minutes" }
});

router.post('/register', authLimiter, async (req, res) => {
  const { username, password, gender } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  const cleanUsername = String(username).trim();
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  if (!usernameRegex.test(cleanUsername)) {
    return res.status(400).json({ 
      error: "Username must be 3-30 characters and only contain alphanumeric characters or underscores" 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 chars" });
  }
  const hashed = await bcrypt.hash(password, 10);

  try {
    const newUser = await User.create({ 
        username: cleanUsername, 
        password: hashed, 
        gender: (gender === "female") ? "female" : "male" 
    });

    const token = jwt.sign(
      { id: newUser._id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: "User already exists" });
  }
});
 router.post('/login', authLimiter, async (req, res) => {
  try {

    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({
        error: "Invalid credentials"
      });
    }

    const isMatch =
      await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        error: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.json({ success: true });

  } catch (err) {

    console.error("LOGIN ERROR:", err);

    res.status(500).json({
      error: "Server error"
    });
  }
});

// LOGOUT ROUTE
router.post('/logout', (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  });
  res.json({ success: true });
});

module.exports = router;