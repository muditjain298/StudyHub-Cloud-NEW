const File = require('../models/File');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// @desc    Get files for a specific section and folder
// @route   GET /api/files
// @access  Private
const getFiles = async (req, res) => {
  try {
    const { section, folder } = req.query;
    
    if (!section) {
      return res.status(400).json({ message: 'Section is required' });
    }

    const query = {
      owner: req.user._id,
      section,
      folder: folder ? folder : null
    };

    const files = await File.find(query).sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload a file
// @route   POST /api/files
// @access  Private
const uploadFile = async (req, res) => {
  try {
    const { section, folder, tags, difficulty, originalName } = req.body;

    if (!section) {
      return res.status(400).json({ message: 'Section is required' });
    }

    let fileUrl = '';
    let cloudinaryId = ''; // Keep field blank for compatibility
    let size = 0;
    let mimeType = '';
    let name = originalName || 'Untitled File';

    // If there's an actual file uploaded via multer (local disk storage)
    if (req.file) {
      size = req.file.size;
      mimeType = req.file.mimetype;
      name = req.file.originalname;
      
      // Construct local URL. Using a relative path starting with /uploads
     fileUrl = `${process.env.BACKEND_URL}/uploads/${req.file.filename}`;
    } else if (req.body.fileUrl) {
      // Handle Video Links directly via URL
      fileUrl = req.body.fileUrl;
      name = req.body.name || name;
    } else {
      return res.status(400).json({ message: 'No file or url provided' });
    }

    const newFile = await File.create({
      name,
      originalName: name,
      owner: req.user._id,
      folder: folder ? folder : null,
      section,
      fileUrl,
      cloudinaryId,
      size,
      mimeType,
      tags: tags ? tags.split(',') : [],
      difficulty: difficulty || ''
    });

    res.status(201).json(newFile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a file
// @route   DELETE /api/files/:id
// @access  Private
const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Delete local file if it exists and is a local upload
    if (file.fileUrl && file.fileUrl.includes('/uploads/')) {
      const filename = file.fileUrl.split('/uploads/')[1];
      const filePath = path.join(__dirname, '..', 'uploads', filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await file.deleteOne();
    
    res.json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get video metadata from URL
// @route   POST /api/files/metadata
// @access  Private
const getVideoMetadata = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    // YouTube oEmbed API
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await axios.get(oembedUrl);

    res.json({
      title: response.data.title,
      thumbnail: response.data.thumbnail_url,
      author: response.data.author_name
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch metadata for this URL' });
  }
};

module.exports = {
  getFiles,
  uploadFile,
  deleteFile,
  getVideoMetadata
};
