import rateLimit from 'express-rate-limit';

// Rate limiter for login attempts
// Limits: 5 attempts per 15 minutes per IP
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
    retryAfter: 15
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    console.log(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
  skip: (req) => {
    // Skip rate limiting for successful logins (handled after validation)
    return false;
  },
  keyGenerator: (req) => {
    // Use IP address as the key
    return req.ip || req.connection.remoteAddress;
  }
});

// Rate limiter for Google OAuth login
// Slightly more lenient: 10 attempts per 15 minutes
export const googleLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 Google login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.log(`Google OAuth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  }
});

// Rate limiter for registration
// Limits: 3 registrations per hour per IP
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration attempts per hour
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again after an hour.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.log(`Registration rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  }
});

// Rate limiter for password reset requests
// Limits: 3 attempts per 30 minutes per IP
export const passwordResetRateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 3, // Limit each IP to 3 password reset attempts
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again after 30 minutes.',
    retryAfter: 30
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.log(`Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  }
});
