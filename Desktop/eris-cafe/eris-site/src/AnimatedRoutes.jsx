import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Booking from './pages/Booking'
import First from './pages/Category1'
import Reserve from './pages/Reserve'
import CartPage from './pages/Cart'
import Checkout from './pages/Checkout'
import ProductPage from './pages/ProductPage'
import Orders from './pages/Orders'
import AdminDashboard from './admin/AdminDashboard'
import DashboardHome from './admin/DashboardHome'
import ProductsPage from './admin/ProductsPage'
import OrdersPage from './admin/OrdersPage'
import PointOfSale from './admin/PointOfSale'
import { AnimatePresence } from 'framer-motion'

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode='wait'>
     <Routes location={location} key={location.pathname}>
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/hotespresso" element={<First />} />
        <Route path="/reservation" element={<Reserve />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<DashboardHome />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="pos" element={<PointOfSale />} />
        </Route>
        
        <Route path="*" element={<Home />} /> 
      </Routes>
    </AnimatePresence>
  )
}

export default AnimatedRoutes