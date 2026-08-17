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

    // CHECK IF ACCOUNT IS ACTIVE
    if (user.isActive === false) {
      return res.status(403).json({ error: 'Your account has been deactivated by Super Admin. Contact administration.' });
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

    if (user.isActive === false) {
      return res.status(403).json({ error: 'Account deactivated by Super Admin.' });
    }

    if (new Date() > new Date(user.otpExpires)) {
      return res.status(401).json({ error: 'OTP has expired. Please log in again.' });
    }

    if (user.otp !== otp.trim()) {
      return res.status(401).json({ error: 'Incorrect OTP passcode.' });
    }

    // Clear used OTP & update last login
    user.otp = undefined;
    user.otpExpires = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    const role = user.role || 'superadmin';
    const permissions = user.permissions || { blogs: true, media: true, certificates: true, gallery: true, hallOfFame: true, users: true };

    // Sign JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'yanf_secret_jwt_key_2026';
    const token = jwt.sign(
      { userId: user._id, username: user.username, role, permissions, isActive: user.isActive },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Admin authentication successful.',
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role, 
        permissions, 
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Server OTP verification error.' });
  }
});

// GET ALL ADMIN USERS (Protected Endpoint)
router.get('/users', authAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-passwordHash -otp -otpExpires').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch admin users.' });
  }
});

// ADD NEW ADMIN (Protected Endpoint)
router.post('/add-admin', authAdmin, async (req, res) => {
  try {
    const { username, password, email, role, permissions } = req.body;
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

    const defaultPermissions = permissions || {
      blogs: true,
      media: true,
      certificates: false,
      gallery: false,
      hallOfFame: false,
      users: false
    };

    const newAdmin = await User.create({
      username: cleanUsername,
      passwordHash,
      email: cleanEmail,
      role: role || 'admin',
      permissions: defaultPermissions,
      isActive: true
    });

    res.status(201).json({
      message: `Admin user '${cleanUsername}' created successfully.`,
      user: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        isActive: newAdmin.isActive,
        permissions: newAdmin.permissions
      }
    });
  } catch (error) {
    console.error('Add Admin error:', error);
    res.status(500).json({ error: 'Failed to create new admin user.' });
  }
});

// UPDATE USER PERMISSIONS OR ACTIVE STATUS (Super Admin Protected)
router.put('/users/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions, isActive, role } = req.body;

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (permissions !== undefined) userToUpdate.permissions = permissions;
    if (isActive !== undefined) userToUpdate.isActive = isActive;
    if (role !== undefined && req.user.role === 'superadmin') userToUpdate.role = role;

    await userToUpdate.save();

    res.json({
      message: `Updated account settings for @${userToUpdate.username}.`,
      user: {
        id: userToUpdate._id,
        username: userToUpdate.username,
        email: userToUpdate.email,
        role: userToUpdate.role,
        isActive: userToUpdate.isActive,
        permissions: userToUpdate.permissions
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user account.' });
  }
});

// DELETE USER ACCOUNT (Strict Super Admin Exclusive Route)
router.delete('/users/:id', authAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Permission denied. Deletion is restricted strictly to Super Admin.' });
    }

    const { id } = req.params;
    const userToDelete = await User.findById(id);

    if (!userToDelete) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (userToDelete.role === 'superadmin') {
      return res.status(400).json({ error: 'Super Admin account cannot be deleted.' });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: `Successfully deleted user account @${userToDelete.username}.` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user account.' });
  }
});

module.exports = router;
