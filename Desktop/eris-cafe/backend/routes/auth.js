import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import axios from 'axios';

const router = express.Router();

// Google Auth
router.post('/google', async (req, res) => {
  // We now expect the access token AND the recaptcha token
  const { token, recaptchaToken } = req.body;

  try {
    // === 1. VERIFY RECAPTCHA FIRST ===
    if (!recaptchaToken) {
      return res.status(400).json({ message: 'reCAPTCHA is required' });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;

    const recaptchaResponse = await axios.post(verifyUrl);

    if (!recaptchaResponse.data.success) {
      console.error('reCAPTCHA verification failed:', recaptchaResponse.data['error-codes']);
      return res.status(400).json({ message: 'Failed reCAPTCHA verification' });
    }

    // === 2. IF RECAPTCHA IS VALID, PROCEED WITH GOOGLE AUTH ===

    // Use the Access Token to get user info from Google
    const googleResponse = await axios.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const { sub, email, name, picture } = googleResponse.data;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // If user doesn't exist, create a new one
      user = new User({
        googleId: sub,
        name: name,
        email,
        profilePicture: picture,
      });
      await user.save();
    }

    // Create your own application JWT (appToken)
    const appToken = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // Send the appToken back to the frontend
    res.status(200).json({ appToken });

  } catch (error) {
    // Handle errors from either reCAPTCHA or Google Auth
    console.error('Authentication error:', error.message);
    res.status(401).json({ message: 'Authentication failed' });
  }
});

export default router;