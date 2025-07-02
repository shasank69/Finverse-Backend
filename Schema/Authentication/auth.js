const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../schema.js'); 
const router = express.Router();


router.post('/signup', async (req, res) => {
  const { name, email, phone, password, confirmPassword } = req.body;

  try {
    if (!name || !email || !phone || !password || !confirmPassword)
      return res.status(400).json({ message: 'All required fields must be filled' });

    if (password !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match' });

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser)
      return res.status(400).json({ message: 'Email or phone already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      confirmPassword: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered', userId: newUser.userId });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

router.get('/login', async (req, res) => {
  const { emailOrPhone, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    res.status(200).json({ message: 'Login successful', userId: user.userId });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

router.post('/update/:email/:field', async (req, res) => {
  const { email, field } = req.params;
  const value = req.body.value;

  if (!/^about([1-9]|10)$/.test(field))
    return res.status(400).json({ message: 'Invalid field name' });

  try {
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { [field]: value },
      { new: true }
    );

    if (!updatedUser)
      return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: `${field} updated`, user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
});


router.delete('/delete/:email', async (req, res) => {
  try {
    const deletedUser = await User.findOneAndDelete({ email: req.params.email });

    if (!deletedUser)
      return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Deletion failed', error: err.message });
  }
});

module.exports = router;
