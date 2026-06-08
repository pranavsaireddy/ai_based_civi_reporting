const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { register, login } = require('../controllers/authController');
const User = require('../models/User'); 
const router = express.Router();
const Department = require('../models/Department');
const bcrypt = require('bcryptjs');

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role, departmentName, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let departmentId = null;

    // If admin, map departmentName to departmentId
    if (role === "admin") {
      if (!departmentName) {
        return res.status(400).json({ message: "Department name is required for admin" });
      }

      const department = await Department.findOne({ name: departmentName });
      if (!department) {
        return res.status(400).json({ message: "Department not found" });
      }
      departmentId = department._id;
    }

    // Create user
    const userData = {
      username,
      email,
      password: hashedPassword,
      role,
      departmentId,
    };

    // Add location if provided (only for admins)
    if (role === "admin" && location && location.coordinates) {
      userData.location = {
        type: "Point",
        coordinates: location.coordinates, // [longitude, latitude]
      };
    }

    const user = new User(userData);
    await user.save();

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json({ message: info.message });

    req.logIn(user, err => {
      if (err) return next(err);
      return login(req, res, next);
    });
  })(req, res, next);
});

// Google OAuth auth route
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/auth/google/failure',
  session: true,
}), (req, res) => {
  const payload = { id: req.user.id, email: req.user.email };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  // For mobile app, you can send token as json or redirect with token as param
  res.json({ token, user: payload });
});

router.get('/google/failure', (req, res) => {
  res.status(401).json({ message: 'Google authentication failed' });
});

module.exports = router;
