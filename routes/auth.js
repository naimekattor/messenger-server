const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User Already Exists",
      });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashed,
    });
    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET
    );
    res.json({
      success: true,
      user,
      token,
    });
  } catch (err) {
    res.status(500).json({
      error: "Server error",
    });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        error: "Invalid Creadentials",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        error: "Invalid Creadentials",
      });
    }
    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET
    );
    res.json({
      success: true,
      user,
      token,
    });
  } catch (err) {
    res.status(500).json({
      error: "Server error",
    });
  }
});

module.exports = router;
