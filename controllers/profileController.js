const Profile = require('../models/Profile');
const { scrapeProfile } = require('../services/scraperService');

const scrapeAndSaveProfile = async (req, res) => {
  const { url, liAt: customLiAt, jsessionId: customJsessionId } = req.body;
  const force = req.query.force === 'true';

  if (!url) {
    return res.status(400).json({ error: 'LinkedIn profile URL is required' });
  }

  try {
    const existingProfile = await Profile.findOne({ url });

    if (existingProfile && !force) {
      const ageInMs = Date.now() - new Date(existingProfile.scrapedAt).getTime();
      const ageInHours = ageInMs / (1000 * 60 * 60);

      if (ageInHours < 24) {
        return res.status(200).json({ source: 'cache', data: existingProfile });
      }
    }

    const liAt = customLiAt || process.env.LINKEDIN_LI_AT;
    const jsessionId = customJsessionId || process.env.LINKEDIN_JSESSIONID;

    const scrapedData = await scrapeProfile(url, liAt, jsessionId);

    const savedProfile = await Profile.findOneAndUpdate(
      { url },
      { ...scrapedData, scrapedAt: new Date() },
      { new: true, upsert: true }
    );

    res.status(200).json({ source: 'live', data: savedProfile });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to scrape profile' });
  }
};

const getProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find().sort({ scrapedAt: -1 });
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProfileByUsername = async (req, res) => {
  const { username } = req.params;

  try {
    const profile = await Profile.findOne({ username });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  scrapeAndSaveProfile,
  getProfiles,
  getProfileByUsername
};
