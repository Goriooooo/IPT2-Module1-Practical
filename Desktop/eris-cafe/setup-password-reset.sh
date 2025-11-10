#!/bin/bash

# ==============================================
# ERIS CAFE - PASSWORD RESET SETUP SCRIPT
# ==============================================
# This script helps you set up the password reset feature
# ==============================================

echo "🏮 Eris Cafe - Password Reset Setup"
echo "===================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and add your Brevo credentials:"
    echo "   - BREVO_SMTP_USER"
    echo "   - BREVO_SMTP_KEY"
    echo "   - BREVO_SENDER_EMAIL"
    echo ""
    exit 1
fi

echo "✅ .env file found"
echo ""

# Check for required environment variables
echo "Checking required environment variables..."
echo ""

check_env_var() {
    local var_name=$1
    local var_value=$(grep "^$var_name=" .env | cut -d '=' -f2)
    
    if [ -z "$var_value" ] || [ "$var_value" = "your-"* ] || [ "$var_value" = "xkeysib-your-"* ]; then
        echo "❌ $var_name is not configured"
        return 1
    else
        echo "✅ $var_name is configured"
        return 0
    fi
}

all_configured=true

# Check MongoDB
if ! check_env_var "MONGODB_URI"; then
    all_configured=false
fi

# Check JWT Secret
if ! check_env_var "JWT_SECRET"; then
    all_configured=false
fi

# Check Brevo credentials
echo ""
echo "Checking Brevo email configuration..."
if ! check_env_var "BREVO_SMTP_USER"; then
    all_configured=false
fi

if ! check_env_var "BREVO_SMTP_KEY"; then
    all_configured=false
fi

if ! check_env_var "BREVO_SENDER_EMAIL"; then
    all_configured=false
fi

echo ""

if [ "$all_configured" = false ]; then
    echo "❌ Some environment variables are missing!"
    echo ""
    echo "📝 Setup Instructions:"
    echo ""
    echo "1. Create a Brevo account at https://www.brevo.com"
    echo "2. Go to Settings → SMTP & API"
    echo "3. Generate an SMTP key"
    echo "4. Add these to your .env file:"
    echo "   BREVO_SMTP_USER=your-brevo-email@example.com"
    echo "   BREVO_SMTP_KEY=xkeysib-your-actual-key"
    echo "   BREVO_SENDER_EMAIL=noreply@eriscafe.com"
    echo ""
    echo "📚 For detailed instructions, see PASSWORD_RESET_GUIDE.md"
    echo ""
    exit 1
fi

echo "✅ All required environment variables are configured!"
echo ""

# Check if nodemailer is installed
echo "Checking dependencies..."
if ! npm list nodemailer > /dev/null 2>&1; then
    echo "❌ nodemailer not installed"
    echo "Installing nodemailer..."
    npm install nodemailer
    echo "✅ nodemailer installed"
else
    echo "✅ nodemailer is installed"
fi

echo ""
echo "🎉 Password reset feature is ready!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Start the backend server:"
echo "   npm run dev"
echo ""
echo "2. Start the frontend (in another terminal):"
echo "   cd eris-site"
echo "   npm run dev"
echo ""
echo "3. Test the feature:"
echo "   - Go to http://localhost:5173"
echo "   - Click 'Sign In'"
echo "   - Click 'Sign in with Email'"
echo "   - Click 'Forgot Password?'"
echo "   - Enter your email and test!"
echo ""
echo "📚 For detailed testing guide, see PASSWORD_RESET_GUIDE.md"
echo ""
