const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOtpEmail } = require('../services/emailService');

// Middleware to verify Admin JWT Token
function authAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. Token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'yanf_secret_jwt_key_2026';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

// STEP 1: Validate Username & Password, Generate & Send 6-Digit Email OTP
router.post('/login-step1', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanUsername = username.toLowerCase().trim();
    const user = await User.findOne({ username: cleanUsername });

    if (!user) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    // Generate 6-digit OTP code & 5-minute expiration
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otpCode;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP Email
    await sendOtpEmail(user.email, otpCode);

    // Mask email for user feedback
    const maskedEmail = user.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length));

    res.json({
      message: `OTP sent to registered admin email (${maskedEmail})`,
      emailMasked: maskedEmail,
      step: 2
    });
  } catch (error) {
    console.error('Login Step 1 error:', error);
    res.status(500).json({ error: 'Server authentication error.' });
  }
});

// STEP 2: Verify OTP and issue JWT Auth Token
router.post('/verify-otp', async (req, res) => {
  try {
    const { username, otp } = req.body;
    if (!username || !otp) {
      return res.status(400).json({ error: 'Username and OTP are required.' });
    }

    const cleanUsername = username.toLowerCase().trim();
    const user = await User.findOne({ username: cleanUsername });

    if (!user || !user.otp || !user.otpExpires) {
      return res.status(401).json({ error: 'Invalid authentication state. Please log in again.' });
    }

    if (new Date() > new Date(user.otpExpires)) {
      return res.status(401).json({ error: 'OTP has expired. Please log in again.' });
    }

    if (user.otp !== otp.trim()) {
      return res.status(401).json({ error: 'Incorrect OTP passcode.' });
    }

    // Clear used OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Sign JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'yanf_secret_jwt_key_2026';
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Admin authentication successful.',
      token,
      user: { username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Server OTP verification error.' });
  }
});

// ADD NEW ADMIN (Protected Endpoint - Allowed for Logged-In Admins)
router.post('/add-admin', authAdmin, async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required.' });
    }

    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'An admin with this username or email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newAdmin = await User.create({
      username: cleanUsername,
      passwordHash,
      email: cleanEmail,
      role: 'admin'
    });

    res.status(201).json({
      message: `Admin user '${cleanUsername}' created successfully.`,
      user: { username: newAdmin.username, email: newAdmin.email }
    });
  } catch (error) {
    console.error('Add Admin error:', error);
    res.status(500).json({ error: 'Failed to create new admin user.' });
  }
});

module.exports = router;
