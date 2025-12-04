// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
  UPDATE_PROFILE: `${API_BASE_URL}/api/auth/update-profile`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
  
  // Products
  PRODUCTS: `${API_BASE_URL}/api/products`,
  
  // Cart
  CART: `${API_BASE_URL}/api/cart`,
  CART_ADD: `${API_BASE_URL}/api/cart/add`,
  CART_REMOVE: `${API_BASE_URL}/api/cart/remove`,
  CART_SYNC: `${API_BASE_URL}/api/cart/sync`,
  
  // Orders
  ORDERS_CREATE: `${API_BASE_URL}/api/orders/create`,
  ORDERS_MY: `${API_BASE_URL}/api/orders/my-orders`,
  ORDERS_ADMIN: `${API_BASE_URL}/api/orders/admin/all`,
  
  // Reservations
  RESERVATIONS_CREATE: `${API_BASE_URL}/api/reservations/create`,
  RESERVATIONS_MY: `${API_BASE_URL}/api/reservations/my-reservations`,
  RESERVATIONS_ADMIN: `${API_BASE_URL}/api/reservations/admin/all`,
  
  // Feedback
  FEEDBACK_SUBMIT: `${API_BASE_URL}/api/feedback/submit`,
  FEEDBACK_ADMIN: `${API_BASE_URL}/api/feedback/admin/all`,
  FEEDBACK_STATS: `${API_BASE_URL}/api/feedback/admin/stats`,
  
  // Upload
  UPLOAD_IMAGE: `${API_BASE_URL}/api/upload/image`,
  
  // Admin
  ADMIN_USERS: `${API_BASE_URL}/api/admin/all-users`,
  ADMIN_LOGIN_LOGS: `${API_BASE_URL}/api/admin/login-logs`,
};

export default API_BASE_URL;
