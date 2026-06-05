const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verify-token');
const User = require('../models/user');
const Report = require('../models/report');


//get user profile
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//update user profile
router.put('/:id/edit', verifyToken, async (req, res) => {
  try {

     if (req.user._id !== req.params.id) {
      return res.status(404).json({ error: 'Access denied' });
    }

    const { name, email } = req.body;
    const updatedData = { name, email };

    // email updating should first check if it already exist 
    // it should be handled seperately
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists._id !== req.params.id) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      updatedData.email = email;
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updatedData,
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// delete user account
router.delete('/:id', async (req, res) => {
  try {

     if (req.user._id !== req.params.id) {
      return res.status(404).json({ error: 'Access denied' });
    }

    const deletedUser = await User.findByIdAndDelete(req.user._id);
    if (!deletedUser) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;