const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    
    const { name, email, password, phone, area } = req.body;
    const userInDatabase = await User.findOne({ email: email });

    if (userInDatabase) {
      return res.status(409).json({
        err: 'Email is invalid',
      });
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    req.body.hashedPassword = hashedPassword;

    const newUser = await User.create({
      name, email, hashedPassword, phone, area,role: "resident",
    });

    const payload = {
      email: newUser.email,
      _id: newUser._id,
      role: newUser.role,
      name: newUser.name,
      area: newUser.area,
      phone:newUser.phone,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.json({ token, user: newUser });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: 'Something went wrong!' });
  }
});

router.post('/login', async (req, res) => {
  try {

    const { email, password } = req.body;
    const userInDatabase = await User.findOne({ email: email });

    if (!userInDatabase) {
      return res.status(401).json({ err: 'Email is invalid' });
    }

    const validPassword = bcrypt.compareSync(req.body.password, userInDatabase.hashedPassword);
   
    if (!validPassword) {
      return res.status(401).json({ err: 'Email or Password is invalid' });
    }

    const payload = {
      email: userInDatabase.email,
      _id: userInDatabase._id,
      role: userInDatabase.role,
      name:userInDatabase.name,
      area:userInDatabase.area,
      phone:userInDatabase.phone,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.json({ token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: 'Invalid Email or Password' });
  }
});

module.exports = router;