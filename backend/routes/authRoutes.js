// AUTHENTICATION ROUTES
// User Registration & Login Management
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const JWT_SECRET =process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
  const { username, password, gender } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 chars" });
  }
  const hashed = await bcrypt.hash(password, 10);

  try {
    const newUser = await User.create({ 
        username, 
        password: hashed, 
        gender: (gender === "female") ? "female" : "male" 
    });

    const token = jwt.sign(
      { id: newUser._id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch {
    res.status(400).json({ error: "User already exists" });
  }
});
 router.post('/login', async (req, res) => {
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

    res.json({ token });

  } catch (err) {

    console.error("LOGIN ERROR:", err);

    res.status(500).json({
      error: "Server error"
    });
  }
});

module.exports = router;