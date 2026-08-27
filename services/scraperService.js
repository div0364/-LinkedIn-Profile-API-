const isServerless = !!process.env.VERCEL;

const scrapeProfile = async (profileUrl, liAt, jsessionId) => {
  let puppeteer;
  let chromium;

  if (isServerless) {
    const puppeteerModule = await import('puppeteer-core');
    puppeteer = puppeteerModule.default || puppeteerModule;
    chromium = require('@sparticuz/chromium');
  } else {
    const puppeteerModule = await import('puppeteer');
    puppeteer = puppeteerModule.default || puppeteerModule;
  }

  let browser;
  try {
    let launchOptions = {};
    if (isServerless) {
      launchOptions = {
        args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true
      };
    } else {
      launchOptions = {
        headless: "new",
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      };
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    if (liAt && jsessionId) {
      await page.setCookie(
        {
          name: 'li_at',
          value: liAt,
          domain: '.linkedin.com',
          path: '/'
        },
        {
          name: 'JSESSIONID',
          value: jsessionId,
          domain: '.linkedin.com',
          path: '/'
        }
      );
    }

    await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const profileData = await page.evaluate(() => {
      const getElementText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.innerText.trim() : '';
      };

      const name = getElementText('h1.text-heading-xlarge') || 
                   getElementText('.pv-text-details__left-panel h1') || 
                   getElementText('main h1');

      const headline = getElementText('.text-body-medium.break-words') || 
                       getElementText('.pv-text-details__left-panel .text-body-medium') || 
                       getElementText('.text-body-medium');

      const location = getElementText('.text-body-small.inline.t-black--light.break-words') || 
                       getElementText('.pv-text-details__left-panel .text-body-small.inline') || 
                       getElementText('.text-body-small.inline');

      const aboutSection = document.querySelector('#about');
      let about = '';
      if (aboutSection) {
        const parent = aboutSection.closest('section');
        if (parent) {
          const textEl = parent.querySelector('.inline-show-more-text');
          about = textEl ? textEl.innerText.trim() : '';
        }
      }

      const imgEl = document.querySelector('img.pv-top-card-profile-picture__image') || 
                    document.querySelector('.profile-photo-edit__preview') || 
                    document.querySelector('img[alt*="profile picture"]') ||
                    document.querySelector('img[alt*="Profile photo"]');
      const profileImage = imgEl ? imgEl.src : '';

      const getSectionItems = (sectionId) => {
        const anchor = document.getElementById(sectionId);
        if (!anchor) return [];
        const section = anchor.closest('section');
        if (!section) return [];
        const listItems = section.querySelectorAll('li');
        const items = [];
        listItems.forEach(li => {
          const text = li.innerText.trim();
          if (text) {
            const cleanText = text.split('\n')[0].trim();
            if (cleanText && !items.includes(cleanText)) {
              items.push(cleanText);
            }
          }
        });
        return items;
      };

      const parseExperiences = () => {
        const anchor = document.getElementById('experience');
        if (!anchor) return [];
        const section = anchor.closest('section');
        if (!section) return [];
        const listItems = section.querySelectorAll('li');
        const list = [];
        listItems.forEach(li => {
          const titleEl = li.querySelector('.t-bold span');
          const companyEl = li.querySelector('.t-14.t-normal span');
          const durationEl = li.querySelector('.t-14.t-black--light span') || li.querySelector('.t-14.t-normal.t-black--light span');
          const descEl = li.querySelector('.inline-show-more-text');

          const title = titleEl ? titleEl.innerText.trim() : '';
          const company = companyEl ? companyEl.innerText.trim() : '';
          const duration = durationEl ? durationEl.innerText.trim() : '';
          const description = descEl ? descEl.innerText.trim() : '';

          if (title || company) {
            list.push({ title, company, duration, description });
          }
        });
        return list;
      };

      const parseEducations = () => {
        const anchor = document.getElementById('education');
        if (!anchor) return [];
        const section = anchor.closest('section');
        if (!section) return [];
        const listItems = section.querySelectorAll('li');
        const list = [];
        listItems.forEach(li => {
          const schoolEl = li.querySelector('.t-bold span');
          const degreeEl = li.querySelector('.t-14.t-normal span');
          const datesEl = li.querySelector('.t-14.t-black--light span') || li.querySelector('.t-14.t-normal.t-black--light span');

          const school = schoolEl ? schoolEl.innerText.trim() : '';
          const degree = degreeEl ? degreeEl.innerText.trim() : '';
          const dates = datesEl ? datesEl.innerText.trim() : '';

          if (school) {
            list.push({ school, degree, dates });
          }
        });
        return list;
      };

      const parseSkills = () => {
        const anchor = document.getElementById('skills');
        if (!anchor) return [];
        const section = anchor.closest('section');
        if (!section) return [];
        const listItems = section.querySelectorAll('.hoverable-link-text span');
        const list = [];
        listItems.forEach(span => {
          const text = span.innerText.trim();
          if (text && !list.includes(text) && text !== 'Endorse') {
            list.push(text);
          }
        });
        return list;
      };

      const experience = parseExperiences();
      const education = parseEducations();
      const skills = parseSkills();
      const certifications = getSectionItems('licenses_and_certifications');
      const languages = getSectionItems('languages');

      return {
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
    });

    await browser.close();

    const username = profileUrl.split('/in/')[1]?.split('/')[0] || '';
    return {
      url: profileUrl,
      username,
      ...profileData
    };
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
};

module.exports = { scrapeProfile };
