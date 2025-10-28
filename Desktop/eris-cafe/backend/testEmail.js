import dotenv from 'dotenv';
import { sendPasswordResetEmail } from './utils/emailService.js';

dotenv.config();

/**
 * Test script for Brevo email configuration
 * Usage: node backend/testEmail.js your-email@example.com
 */

const testEmail = async () => {
  const testRecipient = process.argv[2];

  if (!testRecipient) {
    console.error('❌ Please provide a recipient email address');
    console.log('Usage: node backend/testEmail.js your-email@example.com');
    process.exit(1);
  }

  console.log('🧪 Testing Brevo Email Configuration');
  console.log('=====================================');
  console.log('');

  // Check environment variables
  console.log('Checking environment variables...');
  const requiredVars = ['BREVO_SMTP_USER', 'BREVO_SMTP_KEY', 'BREVO_SENDER_EMAIL'];
  let allConfigured = true;

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName} is not set`);
      allConfigured = false;
    } else {
      // Show partial value for security
      const maskedValue = value.length > 10 
        ? value.substring(0, 8) + '...' + value.substring(value.length - 4)
        : value.substring(0, 3) + '...';
      console.log(`✅ ${varName}: ${maskedValue}`);
    }
  });

  console.log('');

  if (!allConfigured) {
    console.error('❌ Missing required environment variables!');
    console.log('');
    console.log('Please add the following to your .env file:');
    console.log('BREVO_SMTP_USER=your-brevo-email@example.com');
    console.log('BREVO_SMTP_KEY=xkeysib-your-key-here');
    console.log('BREVO_SENDER_EMAIL=noreply@eriscafe.com');
    console.log('');
    process.exit(1);
  }

  // Send test email
  console.log(`📧 Sending test email to: ${testRecipient}`);
  console.log('');

  try {
    const testToken = 'test-token-12345-do-not-use-in-production';
    const result = await sendPasswordResetEmail(
      testRecipient,
      testToken,
      'Test User'
    );

    console.log('✅ Test email sent successfully!');
    console.log('');
    console.log('📬 Email Details:');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Recipient: ${testRecipient}`);
    console.log(`   From: ${process.env.BREVO_SENDER_EMAIL}`);
    console.log('');
    console.log('🔍 Next Steps:');
    console.log('   1. Check your email inbox');
    console.log('   2. Check spam folder if not in inbox');
    console.log('   3. Verify email looks professional');
    console.log('   4. Click the reset link (will show error - that\'s OK!)');
    console.log('');
    console.log('🎉 Email configuration is working correctly!');

  } catch (error) {
    console.error('❌ Failed to send test email');
    console.error('');
    console.error('Error Details:');
    console.error(error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   1. Verify Brevo SMTP credentials are correct');
    console.error('   2. Check if Brevo account is active');
    console.error('   3. Ensure sender email is verified in Brevo');
    console.error('   4. Check daily sending limit not exceeded');
    console.error('');
    console.error('📚 See PASSWORD_RESET_GUIDE.md for detailed setup');
    process.exit(1);
  }
};

// Run the test
testEmail();
