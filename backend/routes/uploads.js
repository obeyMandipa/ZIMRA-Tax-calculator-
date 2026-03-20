// routes/uploads.js
// Routes for handling file uploads, protected by authentication middleware, allowing users to upload files and view their uploads
const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/upload', auth, upload.single('file'), (req, res) => {
  res.json({ 
    message: 'File uploaded successfully',
    filename: req.file.filename,
    user: req.user.email 
  });
});

router.get('/files', auth, (req, res) => {
  // List user's uploaded files
  res.json({ files: [], message: 'Your uploads page' });
});

module.exports = router;
