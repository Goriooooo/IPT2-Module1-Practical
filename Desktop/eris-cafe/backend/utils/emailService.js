import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create Brevo (Sendinblue) SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.BREVO_SMTP_USER, // Your Brevo login email
    pass: process.env.BREVO_SMTP_KEY,  // Your Brevo SMTP key
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error);
  } else {
    console.log('✅ Email service is ready to send messages');
  }
});

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Password reset token
 * @param {string} userName - User's name for personalization
 */
export const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  const mailOptions = {
    from: `"Eris Cafe" <${process.env.BREVO_SENDER_EMAIL || 'noreply@eriscafe.com'}>`,
    to: email,
    subject: 'Password Reset Request - Eris Cafe',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #fff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #d97706;
          }
          .header h1 {
            color: #d97706;
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 15px 30px;
            background: linear-gradient(to right, #f59e0b, #d97706);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
          }
          .button:hover {
            background: linear-gradient(to right, #d97706, #b45309);
          }
          .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .link {
            color: #d97706;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏮 Eris Cafe</h1>
          </div>
          
          <div class="content">
            <h2>Hi ${userName},</h2>
            
            <p>We received a request to reset your password for your Eris Cafe account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p class="link">${resetUrl}</p>
            
            <p><strong>If you didn't request a password reset,</strong> please ignore this email or contact our support team if you have concerns about your account security.</p>
            
            <p>Best regards,<br>The Eris Cafe Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Eris Cafe. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${userName},

We received a request to reset your password for your Eris Cafe account.

Click the link below to reset your password:
${resetUrl}

⚠️ This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email or contact our support team.

Best regards,
The Eris Cafe Team

---
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Eris Cafe. All rights reserved.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send password change confirmation email
 * @param {string} email - Recipient email address
 * @param {string} userName - User's name
 */
export const sendPasswordChangeConfirmation = async (email, userName) => {
  const mailOptions = {
    from: `"Eris Cafe" <${process.env.BREVO_SENDER_EMAIL || 'noreply@eriscafe.com'}>`,
    to: email,
    subject: 'Password Changed Successfully - Eris Cafe',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #fff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #10b981;
          }
          .header h1 {
            color: #10b981;
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 30px 0;
          }
          .success-icon {
            text-align: center;
            font-size: 48px;
            margin: 20px 0;
          }
          .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏮 Eris Cafe</h1>
          </div>
          
          <div class="content">
            <div class="success-icon">✅</div>
            
            <h2>Hi ${userName},</h2>
            
            <p>This email confirms that your Eris Cafe account password has been successfully changed.</p>
            
            <p><strong>Changed on:</strong> ${new Date().toLocaleString()}</p>
            
            <div class="warning">
              <strong>⚠️ Didn't make this change?</strong> If you didn't change your password, please contact our support team immediately to secure your account.
            </div>
            
            <p>For security reasons, we recommend:</p>
            <ul>
              <li>Using a strong, unique password</li>
              <li>Not sharing your password with anyone</li>
              <li>Changing your password regularly</li>
            </ul>
            
            <p>Best regards,<br>The Eris Cafe Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Eris Cafe. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${userName},

This email confirms that your Eris Cafe account password has been successfully changed.

Changed on: ${new Date().toLocaleString()}

⚠️ Didn't make this change? If you didn't change your password, please contact our support team immediately.

Best regards,
The Eris Cafe Team

---
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Eris Cafe. All rights reserved.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password change confirmation sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    // Don't throw error here - password was already changed
    return { success: false, error: error.message };
  }
};

export default transporter;
