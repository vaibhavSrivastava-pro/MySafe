const express = require('express');
const app = express();
const ftp = require('basic-ftp'); // Need to install this package: npm install basic-ftp
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config()

app.use(cors());

// Add middleware to parse JSON bodies
app.use(express.json());

// Global FTP connection parameters
let ftp_host = '';
let ftp_port = 0;
let ftp_user = '';
let ftp_pass = '';

const client = new ftp.Client();

app.get('/', (req, res) => {
    res.send('<h1>Hello, Express.js Server!</h1>');
});

// Connect to FTP server
app.post('/connect', async (req, res) => {
    const data = req.body;
    ftp_host = data.host;
    ftp_port = data.port;
    ftp_user = data.user;
    ftp_pass = data.pass;
    
    const client = new ftp.Client();
    
    try {
        await client.access({
            host: ftp_host,
            port: ftp_port,
            user: ftp_user,
            password: ftp_pass
        });
        
        client.close();
        return res.status(200).json({ message: "Connected Successfully!" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Disconnect from FTP server
app.post('/disconnect', (req, res) => {
    ftp_host = '';
    ftp_port = 0;
    ftp_user = '';
    ftp_pass = '';
    client.close();
    return res.status(200).json({ message: "Disconnected Successfully!" });
});

// Open file
app.post('/open', (req, res) => {
    try {
        const { fileName, decryptedContent } = req.body;
        
        if (!fileName) {
            return res.status(400).json({ error: "Filename is required" });
        }
        
        // Define files directory path
        const baseDir = process.argv[2] || process.cwd();
        const filesDir = path.join(baseDir, 'files');
        const filePath = path.join(filesDir, fileName);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found" });
        }
        
        // Read existing file content
        const existingContent = fs.readFileSync(filePath, 'utf-8');
        
        // Check for LastUpdate in both contents
        const existingUpdateMatch = existingContent.match(/LastUpdate:\s*(.+)/);
        const receivedUpdateMatch = decryptedContent.match(/LastUpdate:\s*(.+)/);
        
        let contentToReturn = existingContent;
        
        if (existingUpdateMatch && receivedUpdateMatch) {
            const existingUpdateTime = new Date(existingUpdateMatch[1]);
            const receivedUpdateTime = new Date(receivedUpdateMatch[1]);
            
            // Compare timestamps and use the latest content
            if (receivedUpdateTime > existingUpdateTime) {
                contentToReturn = decryptedContent;
                // Update the file with the newer content
                fs.writeFileSync(filePath, decryptedContent, 'utf-8');
            }
        }
        
        return res.status(200).json({ content: contentToReturn });
    } catch (err) {
        if (err.code === 'ENOENT') {
            return res.status(404).json({ error: "File not found" });
        } else {
            return res.status(500).json({ error: err.message });
        }
    }
});

// Save file
app.post('/save', (req, res) => {
    try {
        const data = req.body;
        
        if (!data.content) {
            return res.status(400).json({
                error: 'Missing content'
            });
        }

        const baseDir = process.argv[2] || process.cwd();
        
        const filePath = path.join(baseDir, 'data.txt');
        fs.writeFileSync(filePath, data.content);
        
        return res.status(200).json({
            message: 'File data.txt saved successfully'
        });
    } catch (err) {
        return res.status(500).json({
            error: err.message
        });
    }
});

// Upload file to FTP server
app.post('/upload', async (req, res) => {
    if (!ftp_host || !ftp_port || !ftp_user || !ftp_pass) {
        return res.status(400).json({ error: "Not connected to FTP server. Call /connect first." });
    }

    const data = req.body;
    const fileName = data.fileName;
    const content = data.content;
    const isEncrypted = data.isEncrypted;

    const baseDir = process.argv[2] || process.cwd();
    const filesDir = path.join(baseDir, 'files');
    const filePath = path.join(filesDir, fileName);
    const remoteFilename = fileName;

    try {
        // Make sure the directory exists
        if (!fs.existsSync(filesDir)) {
            fs.mkdirSync(filesDir, { recursive: true });
        }

        // Write content to the local file (creating or overwriting)
        fs.writeFileSync(filePath, content);
        
        // Connect and upload to FTP server
        await client.access({
            host: ftp_host,
            port: ftp_port,
            user: ftp_user,
            password: ftp_pass
        });
        
        await client.uploadFrom(filePath, remoteFilename);
        client.close();
        
        return res.status(200).json({ 
            message: "File uploaded successfully",
            fileName: fileName,
            isEncrypted: isEncrypted
        });
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ error: err.message });
    }
});

// Encrypt endpoint with fixed IV (NOT RECOMMENDED)
app.post('/encrypt', (req, res) => {
    try {
      const { data, metadata, password } = req.body;
      
      if (!data || !password) {
        return res.status(400).json({ error: 'Data and password are required' });
      }
      
      const crypto = require('crypto');
      const key = crypto.createHash('sha256').update(String(password)).digest('base64').substring(0, 32);
      
      // Using a fixed IV (SECURITY RISK)
      const fixedIV = Buffer.alloc(16, 0);  // All zeros
      
      // Process the data content
      let contentToEncrypt;
      
      if (data.startsWith('LastUpdate:')) {
        // If data already has LastUpdate metadata, replace it with new metadata
        const newLineIndex = data.indexOf('\n');
        if (newLineIndex !== -1) {
          contentToEncrypt = `LastUpdate:${metadata || 'unknown'}\n` + data.substring(newLineIndex + 1);
        } else {
          // No newline found, add the metadata and preserve content
          contentToEncrypt = `LastUpdate:${metadata || 'unknown'}\n` + data;
        }
      } else {
        // Add new metadata prefix to the content
        contentToEncrypt = `LastUpdate:${metadata || 'unknown'}\n` + data;
      }
      
      const cipher = crypto.createCipheriv('aes-256-cbc', key, fixedIV);
      let encrypted = cipher.update(contentToEncrypt, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      res.json({
        success: true,
        encryptedData: encrypted
        // No need to return IV since it's fixed
      });
    } catch (error) {
      console.error('Encryption error:', error);
      res.status(500).json({ error: 'Encryption failed', message: error.message });
    }
  });
  
  // Decrypt endpoint with fixed IV
  app.post('/decrypt', (req, res) => {
    try {
      const { encryptedData, password } = req.body;
      
      if (!encryptedData || !password) {
        return res.status(400).json({ error: 'Encrypted data and password are required' });
      }
      
      const crypto = require('crypto');
      const key = crypto.createHash('sha256').update(String(password)).digest('base64').substring(0, 32);
      
      // Using the same fixed IV
      const fixedIV = Buffer.alloc(16, 0);
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, fixedIV);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      res.json({
        success: true,
        decryptedData: decrypted
      });
    } catch (error) {
      console.error('Decryption error:', error);
      res.status(500).json({ error: 'Decryption failed', message: error.message });
    }
  });
  
  const port = process.env.PORT || 3000;
  const HOST = '0.0.0.0';

app.listen(port, HOST, () => {
    console.log(`Server is running on port ${port}`);
});