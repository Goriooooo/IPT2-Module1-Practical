# Google OAuth Authentication Setup Guide

## ✅ What Has Been Implemented

### Frontend Components:
1. **AuthContext** (`src/context/AuthContext.jsx`)
   - Manages authentication state
   - Handles login/logout
   - Persists user data in localStorage
   - Decodes JWT tokens from Google

2. **LoginModal** (`src/components/LoginModal.jsx`)
   - Beautiful modal for Google Sign-In
   - Error handling
   - One-tap login support

3. **UserProfile** (`src/components/UserProfile.jsx`)
   - Displays user avatar (Google profile picture)
   - Dropdown menu with user options
   - Logout functionality
   - Navigation to profile and orders

4. **Updated Home.jsx**
   - Integrated authentication
   - Shows "Sign In" button when not authenticated
   - Shows user profile when authenticated
   - Works on both desktop and mobile

### Backend:
1. **Auth Route** (`backend/routes/auth.js`)
   - `/api/auth/google` - Handle Google authentication
   - User data storage (ready for database integration)

2. **Updated server.js**
   - CORS enabled
   - Auth endpoint added

## 🔧 Setup Instructions

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Google+ API"
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Configure OAuth consent screen:
   - User Type: External
   - Add app name, logo, etc.
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173`
7. Copy your **Client ID**

### Step 2: Configure Environment Variables

Edit `.env` file in `eris-site` folder:
```env
VITE_GOOGLE_CLIENT_ID=YOUR_ACTUAL_GOOGLE_CLIENT_ID_HERE
VITE_API_URL=http://localhost:3000
```

### Step 3: Start the Application

1. **Start Backend** (Terminal 1):
   ```bash
   cd /Users/arcelmacasling/Desktop/eris-cafe
   npm run dev
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd /Users/arcelmacasling/Desktop/eris-cafe/eris-site
   npm run dev
   ```

3. Visit `http://localhost:5173`

## 🎯 How It Works

### User Flow:
1. User clicks "Sign In" button
2. Login modal appears with Google Sign-In button
3. User authenticates with Google
4. Google returns credential token
5. Token is decoded to extract user info
6. User data is sent to backend (optional)
7. User data is stored in state and localStorage
8. Profile avatar replaces Sign In button
9. User can access dropdown menu with options

### Authentication State:
- **isAuthenticated**: Boolean indicating login status
- **user**: Object containing user data (name, email, picture)
- **login()**: Function to authenticate user
- **logout()**: Function to log out user

## 📝 User Data Structure

```javascript
{
  name: "John Doe",
  email: "john@example.com",
  picture: "https://lh3.googleusercontent.com/...",
  sub: "123456789" // Google user ID
}
```

## 🔐 Security Notes

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Validate tokens on backend** - Verify Google tokens server-side
3. **Use HTTPS in production** - Required for OAuth
4. **Implement proper session management** - Add JWT or sessions

## 🎨 Features

✅ Google One-Tap Sign In
✅ Profile picture display
✅ User dropdown menu
✅ Persistent login (localStorage)
✅ Logout functionality
✅ Mobile responsive
✅ Backend integration ready
✅ Error handling
✅ Beautiful UI with transitions

## 🚀 Next Steps (Optional)

1. **Database Integration**:
   - Create User model in MongoDB
   - Store user data on first login
   - Update user info on subsequent logins

2. **Enhanced Security**:
   - Implement JWT tokens
   - Add refresh token mechanism
   - Verify Google tokens on backend

3. **Additional Features**:
   - User profile page
   - Order history
   - Favorites/Wishlist
   - Address management

## 🐛 Troubleshooting

### "Sign in with Google temporarily disabled for this app"
- Check OAuth consent screen is configured
- Add test users in Google Console
- Verify redirect URIs match exactly

### "Invalid Client ID"
- Check `.env` file has correct Client ID
- Restart development server after changing `.env`
- Verify Client ID has no extra spaces

### "CORS Error"
- Backend server is running with CORS enabled
- Check backend URL in AuthContext.jsx

## 📦 Installed Packages

- `@react-oauth/google` - Google OAuth integration
- `axios` - HTTP client for API calls
- `jwt-decode` - Decode JWT tokens (not needed now, using native JS)
- `lucide-react` - Icons
- `cors` - Backend CORS support

## 🎉 You're All Set!

Your Google OAuth authentication is now fully integrated and ready to use!
