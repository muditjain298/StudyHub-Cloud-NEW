const express = require('express');
const router = express.Router();
const {createShare, accessShare, getMyShares, deleteShare} = require('../controllers/shareController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getMyShares)
  .post(protect, createShare);

router.route('/:token/access')
  .post(accessShare); // Public – no protect middleware

router.route('/:id')
  .delete(protect, deleteShare);

module.exports = router;
