import { Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import AnimatedRoutes from './AnimatedRoutes'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'

// Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '378408299031-fqr4omsk1fppv4p5ttrkhvvv89c74gf0.apps.googleusercontent.com'

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <CartProvider>
          <div>
            <AnimatedRoutes location={location} />
          </div>
        </CartProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App
