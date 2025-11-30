import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Booking from './pages/Booking'
import First from './pages/Category1'
import Category2 from './pages/Category2'
import Category3 from './pages/Category3'
import Category4 from './pages/Category4'
import Reserve from './pages/Reserve'
import CartPage from './pages/Cart'
import Checkout from './pages/Checkout'
import ProductPage from './pages/ProductPage'
import Orders from './pages/Orders'
import MyAccount from './pages/MyAccount'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminDashboard from './admin/AdminDashboard'
import DashboardHome from './admin/DashboardHome'
import ProductsPage from './admin/ProductsPage'
import OrdersPage from './admin/OrdersPage'
import ReservationsPage from './admin/ReservationsPage'
import UserFeedbacks from './admin/UserFeedbacks'
import Customers from './admin/Customers'
import AdminProfile from './admin/AdminProfile'
import RoleAccessControl from './admin/RoleAccessControl'
import LoginMonitoring from './admin/LoginMonitoring'
import RevenueAnalytics from './admin/RevenueAnalytics'
import OrdersAnalytics from './admin/OrdersAnalytics'
import ProductsAnalytics from './admin/ProductsAnalytics'
import ReservationsAnalytics from './admin/ReservationsAnalytics'
import ProductAnalytics from './admin/ProductAnalytics'
import ArchivedProducts from './admin/ArchivedProducts'
import Status from "./pages/status"
import ProtectedRoute from './components/ProtectedRoute'
import { AnimatePresence } from 'framer-motion'

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode='wait'>
     <Routes location={location} key={location.pathname}>
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/category1" element={<First />} />
        <Route path="/category2" element={<Category2 />} />
        <Route path="/category3" element={<Category3 />} />
        <Route path="/category4" element={<Category4 />} />
        <Route path="/reservation" element={<Reserve />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/account" element={<MyAccount />} />
        <Route path="/status" element={<Status />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* Admin Routes - Protected */}
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/archived" element={<ArchivedProducts />} />
          <Route path="product-analytics" element={<ProductAnalytics />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="feedbacks" element={<UserFeedbacks />} />
          <Route path="customers" element={<Customers />} />
          <Route path="settings/profile" element={<AdminProfile />} />
          <Route path="settings/roles" element={<RoleAccessControl />} />
          <Route path="settings/monitoring" element={<LoginMonitoring />} />
          <Route path="analytics/revenue" element={<RevenueAnalytics />} />
          <Route path="analytics/orders" element={<OrdersAnalytics />} />
          <Route path="analytics/products" element={<ProductsAnalytics />} />
          <Route path="analytics/reservations" element={<ReservationsAnalytics />} />
        </Route>
        
        <Route path="*" element={<Home />} /> 
      </Routes>
    </AnimatePresence>
  )
}

export default AnimatedRoutes