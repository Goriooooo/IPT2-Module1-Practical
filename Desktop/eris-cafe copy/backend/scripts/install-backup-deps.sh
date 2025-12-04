#!/bin/bash

# Install required npm package for Google Drive API
echo "Installing googleapis package..."
npm install googleapis

echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Set up Google Cloud Console credentials (see BACKUP_SETUP.md)"
echo "2. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env file"
echo "3. Install MongoDB Database Tools if not already installed:"
echo "   - macOS: brew install mongodb-database-tools"
echo "   - Ubuntu: sudo apt-get install mongodb-database-tools"
echo "4. Restart the backend server"
