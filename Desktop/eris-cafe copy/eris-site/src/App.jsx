import { Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import AnimatedRoutes from './AnimatedRoutes'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'

// Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '378408299031-fqr4omsk1fppv4p5ttrkhvvv89c74gf0.apps.googleusercontent.com'

function App() {
  return (
    // This is CORRECT (uses the variable)
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <div>
              <AnimatedRoutes location={location} />
            </div>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App
