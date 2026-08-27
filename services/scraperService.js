const { 
  Client, 
  fetchFullProfileRaw, 
  findProfileEntry,
  mapMiniProfile,
  getLinkedinExperiencesFlat, 
  getLinkedinEducation, 
  getLinkedinSkills, 
  getLinkedinCertifications, 
  getLinkedinLanguages 
} = require('@florydev/linkedin-api-voyager');

const scrapeProfile = async (profileUrl, liAt, jsessionId) => {
  const vanityMatch = profileUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
  const vanityName = vanityMatch ? vanityMatch[1] : profileUrl;

  const cleanJsessionId = jsessionId.replace(/^"|"$|^ajax:/g, '');

  Client({
    li_at: liAt,
    JSESSIONID: cleanJsessionId
  });

  const raw = await fetchFullProfileRaw(vanityName);
  const entry = findProfileEntry(raw, vanityName);
  
  if (!entry) {
    throw new Error('Profile not found');
  }

  const mini = mapMiniProfile(entry);

  const location = entry.locationName || entry.geoLocationName || mini.location || '';
  const name = mini.fullName || `${mini.firstName} ${mini.lastName}`.trim() || '';
  const headline = mini.headline || '';
  const about = mini.about || '';
  const profileImage = mini.profilePicture || '';

  const [expRes, eduRes, skillsRes, certsRes, langsRes] = await Promise.all([
    getLinkedinExperiencesFlat(vanityName).catch(() => ({ items: [] })),
    getLinkedinEducation(vanityName).catch(() => ({ items: [] })),
    getLinkedinSkills(vanityName).catch(() => ({ items: [] })),
    getLinkedinCertifications(vanityName).catch(() => ({ items: [] })),
    getLinkedinLanguages(vanityName).catch(() => ({ items: [] }))
  ]);

  const experience = (expRes.items || []).map(item => {
    let duration = '';
    if (item.timePeriod) {
      const start = item.timePeriod.start ? `${item.timePeriod.start.month || ''}/${item.timePeriod.start.year || ''}` : '';
      const end = item.timePeriod.end ? `${item.timePeriod.end.month || ''}/${item.timePeriod.end.year || ''}` : 'Present';
      duration = `${start} - ${end}`.replace(/^\s*-\s*/, '');
    }
    return {
      title: item.title || '',
      company: item.companyName || '',
      duration: duration,
      description: item.description || ''
    };
  });

  const education = (eduRes.items || []).map(item => {
    let dates = '';
    if (item.timePeriod) {
      const start = item.timePeriod.start ? `${item.timePeriod.start.year || ''}` : '';
      const end = item.timePeriod.end ? `${item.timePeriod.end.year || ''}` : '';
      dates = `${start} - ${end}`.replace(/^\s*-\s*/, '');
    }
    return {
      school: item.schoolName || '',
      degree: [item.degreeName, item.fieldOfStudy].filter(Boolean).join(', ') || '',
      dates: dates
    };
  });

  const skills = (skillsRes.items || []).map(item => item.name).filter(Boolean);

  const certifications = (certsRes.items || []).map(item => {
    return [item.name, item.authority].filter(Boolean).join(' by ');
  }).filter(Boolean);

  const languages = (langsRes.items || []).map(item => {
    return item.name;
  }).filter(Boolean);

  return {
    url: profileUrl,
    username: vanityName,
    name,
    headline,
    location,
    about,
    profileImage,
    experience,
    education,
    skills,
    certifications,
    languages
  };
};

module.exports = { scrapeProfile };
