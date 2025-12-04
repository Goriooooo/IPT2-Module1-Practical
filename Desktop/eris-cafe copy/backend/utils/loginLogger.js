import LoginLog from '../models/loginLog.model.js';

// Helper function to log login attempts
export const logLoginAttempt = async (userData, status, req, failureReason = null) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    // Parse device info from user agent (basic parsing)
    let device = 'Unknown';
    if (userAgent.includes('Chrome')) device = 'Chrome on ' + (userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : 'Linux');
    else if (userAgent.includes('Firefox')) device = 'Firefox on ' + (userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : 'Linux');
    else if (userAgent.includes('Safari')) device = 'Safari on macOS';
    else if (userAgent.includes('Android')) device = 'Chrome on Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) device = 'Safari on iOS';

    const loginLog = new LoginLog({
      userId: userData.id || null,
      email: userData.email,
      userName: userData.name || 'Unknown User',
      role: userData.role || 'unknown',
      status,
      ipAddress,
      location: 'Philippines', // You can integrate with IP geolocation API for accurate location
      device,
      userAgent,
      failureReason
    });

    await loginLog.save();
    console.log(`Login attempt logged: ${userData.email} - ${status}`);
  } catch (error) {
    console.error('Error logging login attempt:', error);
    // Don't throw error to prevent login flow from breaking
  }
};
