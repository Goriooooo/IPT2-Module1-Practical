import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execPromise = promisify(exec);
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Google Drive configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/backup/oauth2callback'
);

// Store tokens (in production, use a database)
let tokens = null;

// Middleware to check authentication
const authenticateAdmin = (req, res, next) => {
  // Add your authentication logic here
  // For now, we'll assume the user is authenticated if they have a token
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

// Get Google Drive auth URL
router.get('/connect-drive', authenticateAdmin, (req, res) => {
  console.log('🔍 [DEBUG] Connect Drive Request');
  console.log('📝 Client ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set');
  console.log('📝 Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Not set');
  console.log('📝 Redirect URI:', process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/backup/oauth2callback');
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
  });

  console.log('🔗 Generated Auth URL:', authUrl);
  res.json({ success: true, authUrl });
});

// OAuth2 callback
router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;

  console.log('🔍 [DEBUG] OAuth Callback Received');
  console.log('📝 Authorization Code:', code ? '✅ Received' : '❌ Missing');

  try {
    console.log('🔄 Exchanging code for tokens...');
    const { tokens: newTokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(newTokens);
    tokens = newTokens;

    // Save tokens to file for persistence
    const tokensPath = path.join(__dirname, '..', 'google-tokens.json');
    fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));
    
    console.log('✅ Tokens saved successfully to:', tokensPath);
    console.log('📝 Token details:', {
      access_token: newTokens.access_token ? '✅ Present' : '❌ Missing',
      refresh_token: newTokens.refresh_token ? '✅ Present' : '❌ Missing',
      expiry_date: newTokens.expiry_date ? new Date(newTokens.expiry_date).toLocaleString() : '❌ Missing'
    });

    res.send('<script>window.close();</script>');
  } catch (error) {
    console.error('❌ [ERROR] Failed to get tokens:', error);
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Failed to authenticate', error: error.message });
  }
});

// Check Google Drive connection status
router.get('/drive-status', authenticateAdmin, (req, res) => {
  const tokensPath = path.join(__dirname, '..', 'google-tokens.json');
  
  console.log('🔍 [DEBUG] Checking Drive Status');
  console.log('📁 Tokens path:', tokensPath);
  console.log('📝 File exists:', fs.existsSync(tokensPath) ? '✅ Yes' : '❌ No');
  
  try {
    if (fs.existsSync(tokensPath)) {
      tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
      oauth2Client.setCredentials(tokens);
      
      console.log('✅ Tokens loaded successfully');
      console.log('📝 Token details:', {
        access_token: tokens.access_token ? '✅ Present' : '❌ Missing',
        refresh_token: tokens.refresh_token ? '✅ Present' : '❌ Missing',
        expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date).toLocaleString() : '❌ Missing'
      });
      
      res.json({ success: true, connected: true });
    } else {
      console.log('⚠️ No tokens file found - Google Drive not connected');
      res.json({ success: true, connected: false });
    }
  } catch (error) {
    console.error('❌ [ERROR] Failed to check drive status:', error.message);
    res.json({ success: true, connected: false });
  }
});

// Disconnect Google Drive
router.post('/disconnect-drive', authenticateAdmin, (req, res) => {
  const tokensPath = path.join(__dirname, '..', 'google-tokens.json');
  
  console.log('🔍 [DEBUG] Disconnect Google Drive Request');
  console.log('📁 Tokens path:', tokensPath);
  
  try {
    if (fs.existsSync(tokensPath)) {
      fs.unlinkSync(tokensPath);
      tokens = null;
      oauth2Client.setCredentials({});
      console.log('✅ Google Drive disconnected successfully');
      res.json({ success: true, message: 'Google Drive disconnected successfully' });
    } else {
      console.log('⚠️ No tokens file found - already disconnected');
      res.json({ success: true, message: 'Google Drive was not connected' });
    }
  } catch (error) {
    console.error('❌ [ERROR] Failed to disconnect Google Drive:', error.message);
    res.status(500).json({ success: false, message: 'Failed to disconnect Google Drive', error: error.message });
  }
});

// Upload file to Google Drive
async function uploadToGoogleDrive(filePath, fileName) {
  console.log('🔍 [DEBUG] Upload to Google Drive');
  console.log('📁 File path:', filePath);
  console.log('📝 File name:', fileName);
  console.log('📝 Tokens available:', tokens ? '✅ Yes' : '❌ No');
  
  if (!tokens) {
    console.error('❌ Google Drive not connected');
    throw new Error('Google Drive not connected');
  }

  oauth2Client.setCredentials(tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const fileMetadata = {
    name: fileName,
    mimeType: 'application/gzip',
  };

  const media = {
    mimeType: 'application/gzip',
    body: fs.createReadStream(filePath),
  };

  console.log('🔄 Uploading file to Google Drive...');
  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink',
  });

  console.log('✅ File uploaded successfully');
  console.log('📝 File ID:', response.data.id);
  console.log('🔗 Web view link:', response.data.webViewLink);

  return response.data;
}

// Download file from Google Drive
async function downloadFromGoogleDrive(fileName, destinationPath) {
  if (!tokens) {
    throw new Error('Google Drive not connected');
  }

  oauth2Client.setCredentials(tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Find the file
  const response = await drive.files.list({
    q: `name='${fileName}'`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (!response.data.files || response.data.files.length === 0) {
    throw new Error('Backup file not found on Google Drive');
  }

  const fileId = response.data.files[0].id;

  // Download the file
  const dest = fs.createWriteStream(destinationPath);
  const res = await drive.files.get(
    { fileId: fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  return new Promise((resolve, reject) => {
    res.data
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .pipe(dest);
  });
}

// Create backup
router.post('/create', authenticateAdmin, async (req, res) => {
  console.log('🔍 [DEBUG] Create Backup Request');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `eris-cafe-backup-${timestamp}`;
    const backupPath = path.join(__dirname, '..', 'backups');
    
    console.log('📁 Backup path:', backupPath);
    console.log('📝 Backup name:', backupName);
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupPath)) {
      console.log('📁 Creating backups directory...');
      fs.mkdirSync(backupPath, { recursive: true });
    }

    const backupFile = path.join(backupPath, backupName);
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/eris-cafe';
    
    console.log('📝 MongoDB URI:', mongoUri.replace(/\/\/.*:.*@/, '//*****:*****@')); // Hide credentials
    
    // Extract database name from URI
    const dbName = mongoUri.split('/').pop().split('?')[0];
    console.log('📝 Database name:', dbName);

    // Create mongodump command
    const command = `mongodump --uri="${mongoUri}" --archive="${backupFile}.gz" --gzip`;

    console.log('🔄 Running mongodump...');
    console.log('📝 Command:', command.replace(/\/\/.*:.*@/, '//*****:*****@')); // Hide credentials
    
    await execPromise(command);
    console.log('✅ Backup file created successfully');

    // Get file size
    const stats = fs.statSync(`${backupFile}.gz`);
    const fileSizeInBytes = stats.size;
    const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
    
    console.log('📊 Backup size:', fileSizeInMB, 'MB');

    // Upload to Google Drive if connected
    let driveFileId = null;
    if (tokens) {
      console.log('🔄 Uploading to Google Drive...');
      try {
        const driveFile = await uploadToGoogleDrive(`${backupFile}.gz`, `${backupName}.gz`);
        driveFileId = driveFile.id;
        console.log('✅ Backup uploaded to Google Drive:', driveFile.name);
      } catch (driveError) {
        console.error('❌ Failed to upload to Google Drive:', driveError.message);
        console.error('Error details:', driveError.response?.data || driveError);
      }
    } else {
      console.log('⚠️ Skipping Google Drive upload - not connected');
    }

    // Save backup metadata
    const metadataPath = path.join(backupPath, 'metadata.json');
    let metadata = [];
    
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }

    metadata.push({
      filename: `${backupName}.gz`,
      createdAt: new Date().toISOString(),
      size: `${fileSizeInMB} MB`,
      driveFileId: driveFileId,
    });

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log('✅ Metadata saved successfully');
    console.log('📝 Total backups:', metadata.length);

    res.json({
      success: true,
      message: 'Backup created successfully',
      filename: `${backupName}.gz`,
      size: `${fileSizeInMB} MB`,
      uploadedToDrive: !!driveFileId,
    });
  } catch (error) {
    console.error('❌ [ERROR] Backup failed:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message,
    });
  }
});

// Restore backup
router.post('/restore', authenticateAdmin, async (req, res) => {
  console.log('🔍 [DEBUG] Restore Backup Request');
  
  try {
    const { filename } = req.body;
    
    console.log('📝 Requested filename:', filename);
    
    if (!filename) {
      console.error('❌ No filename provided');
      return res.status(400).json({
        success: false,
        message: 'Filename is required',
      });
    }

    const backupPath = path.join(__dirname, '..', 'backups');
    const backupFile = path.join(backupPath, filename);

    console.log('📁 Backup file path:', backupFile);
    console.log('📝 File exists locally:', fs.existsSync(backupFile) ? '✅ Yes' : '❌ No');

    // Check if file exists locally
    if (!fs.existsSync(backupFile)) {
      // Try to download from Google Drive
      console.log('⚠️ Backup not found locally, attempting to download from Google Drive...');
      try {
        await downloadFromGoogleDrive(filename, backupFile);
        console.log('✅ Backup downloaded from Google Drive');
      } catch (driveError) {
        console.error('❌ Failed to download from Google Drive:', driveError.message);
        return res.status(404).json({
          success: false,
          message: 'Backup file not found locally or on Google Drive',
        });
      }
    }

    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/eris-cafe';
    const dbName = mongoUri.split('/').pop().split('?')[0];

    console.log('📝 MongoDB URI:', mongoUri.replace(/\/\/.*:.*@/, '//*****:*****@')); // Hide credentials
    console.log('📝 Database name:', dbName);

    // Drop existing database first
    console.log('🔄 Dropping existing database...');
    const dropCommand = `mongosh "${mongoUri}" --eval "db.dropDatabase()"`;
    console.log('📝 Drop command:', dropCommand.replace(/\/\/.*:.*@/, '//*****:*****@'));
    
    await execPromise(dropCommand);
    console.log('✅ Database dropped successfully');

    // Restore from backup
    console.log('🔄 Restoring backup...');
    const restoreCommand = `mongorestore --uri="${mongoUri}" --archive="${backupFile}" --gzip`;
    console.log('📝 Restore command:', restoreCommand.replace(/\/\/.*:.*@/, '//*****:*****@'));
    
    await execPromise(restoreCommand);
    console.log('✅ Database restored successfully');

    res.json({
      success: true,
      message: 'Database restored successfully',
      filename: filename,
    });
  } catch (error) {
    console.error('❌ [ERROR] Restore failed:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: error.message,
    });
  }
});

// Get backup history
router.get('/history', authenticateAdmin, (req, res) => {
  try {
    const backupPath = path.join(__dirname, '..', 'backups');
    const metadataPath = path.join(backupPath, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      return res.json({ success: true, backups: [] });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    // Sort by date (newest first)
    metadata.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      backups: metadata,
    });
  } catch (error) {
    console.error('Error fetching backup history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backup history',
      error: error.message,
    });
  }
});

// Delete backup
router.delete('/:filename', authenticateAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, '..', 'backups');
    const backupFile = path.join(backupPath, filename);
    const metadataPath = path.join(backupPath, 'metadata.json');

    console.log('🗑️ [DEBUG] Delete Backup Request');
    console.log('📝 Filename:', filename);
    console.log('📁 Backup path:', backupFile);

    // Check if backup file exists
    if (!fs.existsSync(backupFile)) {
      console.log('❌ Backup file not found locally');
      return res.status(404).json({
        success: false,
        message: 'Backup file not found',
      });
    }

    // Delete the backup file
    fs.unlinkSync(backupFile);
    console.log('✅ Local backup file deleted');

    // Update metadata
    if (fs.existsSync(metadataPath)) {
      let metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      metadata = metadata.filter(backup => backup.filename !== filename);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      console.log('✅ Metadata updated');
    }

    // Try to delete from Google Drive if connected
    try {
      const tokensPath = path.join(__dirname, '..', 'google-tokens.json');
      if (fs.existsSync(tokensPath)) {
        const savedTokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
        oauth2Client.setCredentials(savedTokens);
        
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        // Find the file on Google Drive
        const searchResponse = await drive.files.list({
          q: `name='${filename}' and trashed=false`,
          fields: 'files(id, name)',
        });

        if (searchResponse.data.files && searchResponse.data.files.length > 0) {
          const fileId = searchResponse.data.files[0].id;
          await drive.files.delete({ fileId });
          console.log('✅ Backup deleted from Google Drive');
        }
      }
    } catch (driveError) {
      console.log('⚠️ Could not delete from Google Drive:', driveError.message);
      // Continue anyway - local file is deleted
    }

    res.json({
      success: true,
      message: 'Backup deleted successfully',
      filename: filename,
    });
  } catch (error) {
    console.error('❌ [ERROR] Delete backup failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
      error: error.message,
    });
  }
});

export default router;
