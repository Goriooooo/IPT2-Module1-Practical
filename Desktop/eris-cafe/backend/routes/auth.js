import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // This should now be correct
import axios from 'axios';

const router = express.Router();

// This client is still needed
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Auth
router.post('/google', async (req, res) => {
  const { token } = req.body; // This is the ACCESS TOKEN

  try {
    // 1. Use the Access Token to get user info from Google
    const googleResponse = await axios.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const { sub, email, name, picture } = googleResponse.data;

    // 2. Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // 3. If user doesn't exist, create a new one
      user = new User({
        googleId: sub,
        name: name, // <-- FIX #1: Was 'username: name'
        email,
        profilePicture: picture,
      });
      await user.save();
    }

    // 4. Create your own application JWT (appToken)
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

    // 5. Send the appToken back to the frontend
    res.status(200).json({ appToken });

  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ message: 'Invalid token or authentication failed' });
  }
});

export default router;