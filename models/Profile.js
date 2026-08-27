const mongoose = require('mongoose');

const ExperienceSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  company: { type: String, default: '' },
  duration: { type: String, default: '' },
  description: { type: String, default: '' }
});

const EducationSchema = new mongoose.Schema({
  school: { type: String, default: '' },
  degree: { type: String, default: '' },
  dates: { type: String, default: '' }
});

const ProfileSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  username: { type: String, default: '' },
  name: { type: String, default: '' },
  headline: { type: String, default: '' },
  location: { type: String, default: '' },
  about: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  experience: [ExperienceSchema],
  education: [EducationSchema],
  skills: [{ type: String }],
  certifications: [{ type: String }],
  languages: [{ type: String }],
  scrapedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Profile', ProfileSchema);
