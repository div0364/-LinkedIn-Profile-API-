const express = require('express');
const router = express.Router();
const {
  scrapeAndSaveProfile,
  getProfiles,
  getProfileByUsername
} = require('../controllers/profileController');

router.post('/scrape', scrapeAndSaveProfile);
router.get('/', getProfiles);
router.get('/:username', getProfileByUsername);

module.exports = router;
