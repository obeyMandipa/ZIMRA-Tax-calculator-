// routes/uploads.js
// Routes for handling file uploads, protected by authentication middleware, allowing users to upload files and view their uploads
const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const auth = require('../middleware/auth');
const router = express.Router();

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images, PDFs, and Office docs allowed'));
  }
});

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Store file metadata
    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadDate: new Date(),
      userId: req.user._id,
      userEmail: req.user.email
    };

    // Save to files.json (simple storage)
    const filesPath = path.join(__dirname, '../files.json');
    let allFiles = [];
    try {
      const data = await fs.readFile(filesPath, 'utf8');
      allFiles = JSON.parse(data);
    } catch (e) {
      allFiles = [];
    }
    
    allFiles.push(fileData);
    await fs.writeFile(filesPath, JSON.stringify(allFiles, null, 2));

    res.json({ 
      message: 'File uploaded successfully',
      file: fileData 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/files', auth, async (req, res) => {
  try {
    const filesPath = path.join(__dirname, '../files.json');
    let allFiles = [];
    
    try {
      const data = await fs.readFile(filesPath, 'utf8');
      allFiles = JSON.parse(data);
    } catch (e) {
      allFiles = [];
    }
    
    // Filter files for current user
    const userFiles = allFiles.filter(f => f.userId === req.user._id.toString());
    res.json({ files: userFiles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// ✅ ADD THIS DELETE ROUTE
router.delete('/files/:filename', auth, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    // Delete physical file
    await fs.unlink(filePath).catch(err => {
      if (err.code !== 'ENOENT') throw err; // Ignore if file not found
    });
    
    // Remove from files.json
    const filesPath = path.join(__dirname, '../files.json');
    let allFiles = [];
    try {
      const data = await fs.readFile(filesPath, 'utf8');
      allFiles = JSON.parse(data);
    } catch (e) {
      allFiles = [];
    }
    
    const updatedFiles = allFiles.filter(f => f.filename !== filename);
    await fs.writeFile(filesPath, JSON.stringify(updatedFiles, null, 2));
    
    res.json({ message: `File ${filename} deleted successfully` });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});



module.exports = router;
