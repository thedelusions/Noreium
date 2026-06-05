const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verify-token');
const verifyAdmin = require('../middleware/verify-admin');
const User = require('../models/user');

//access all users
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-hashedPassword');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "failed to fetch users" });
  }
});

module.exports = router;