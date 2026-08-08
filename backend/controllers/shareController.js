const Share = require('../models/Share');
const File = require('../models/File');
const Folder = require('../models/Folder');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────────
// @desc    Create a share link
// @route   POST /api/shares
// @access  Private
// ─────────────────────────────────────────────
const createShare = async (req, res) => {
  try {
    const { shareType, section, folderId, fileId, password, expiresInHours } = req.body;

    if (!shareType) return res.status(400).json({ message: 'shareType is required' });

    // Generate a unique token
    const token = crypto.randomBytes(16).toString('hex');

    let passwordHash = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    let expiresAt = null;
    if (expiresInHours) {
      expiresAt = new Date(Date.now() + Number(expiresInHours) * 60 * 60 * 1000);
    }

    const share = await Share.create({
      owner: req.user._id,
      token,
      shareType,
      section: section || '',
      folder: folderId || null,
      file: fileId || null,
      isPublic: true,
      passwordHash,
      expiresAt,
    });

    res.status(201).json({
      shareId: share._id,
      token: share.token,
      shareUrl = `${process.env.FRONTEND_URL}/share/${shareId}`,
      expiresAt: share.expiresAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Access shared content (public)
// @route   POST /api/shares/:token/access
// @access  Public
// ─────────────────────────────────────────────
const accessShare = async (req, res) => {
  try {
    const share = await Share.findOne({ token: req.params.token });

    if (!share) return res.status(404).json({ message: 'Share link not found or has been removed.' });

    // Check expiry
    if (share.expiresAt && new Date() > share.expiresAt) {
      return res.status(410).json({ message: 'This share link has expired.' });
    }

    // Check password
    if (share.passwordHash) {
      const { password } = req.body;
      if (!password) return res.status(401).json({ message: 'This link is password protected.', requiresPassword: true });
      const isMatch = await bcrypt.compare(password, share.passwordHash);
      if (!isMatch) return res.status(401).json({ message: 'Incorrect password.' });
    }

    // Increment view count
    share.viewCount += 1;
    await share.save();

    // Fetch shared content
    let content = {};

    if (share.shareType === 'file') {
      content.file = await File.findById(share.file);
    } else if (share.shareType === 'folder') {
      content.folder = await Folder.findById(share.folder);
      content.files = await File.find({ folder: share.folder });
      content.subFolders = await Folder.find({ parent: share.folder });
    } else if (share.shareType === 'section') {
      content.section = share.section;
      content.folders = await Folder.find({ owner: share.owner, section: share.section, parent: null });
      content.files = await File.find({ owner: share.owner, section: share.section, folder: null });
    }

    res.json({
      shareType: share.shareType,
      ownerName: 'StudyHub User',
      viewCount: share.viewCount,
      expiresAt: share.expiresAt,
      ...content,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get my shares
// @route   GET /api/shares
// @access  Private
// ─────────────────────────────────────────────
const getMyShares = async (req, res) => {
  try {
    const shares = await Share.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(shares);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Delete a share link
// @route   DELETE /api/shares/:id
// @access  Private
// ─────────────────────────────────────────────
const deleteShare = async (req, res) => {
  try {
    const share = await Share.findById(req.params.id);
    if (!share) return res.status(404).json({ message: 'Share not found' });
    if (share.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await share.deleteOne();
    res.json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createShare, accessShare, getMyShares, deleteShare };
