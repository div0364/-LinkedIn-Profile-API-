# LinkedIn Profile API Backend

A simple and robust Node.js/Express and MongoDB backend for scraping and caching LinkedIn profiles. The application uses Puppeteer to simulate a browser session using your own LinkedIn cookies to bypass security checks and extract complete profile information.

## Features

- **Profile Scraping**: Extracts name, headline, location, summary, experience, education, skills, languages, certifications, and profile picture.
- **Dynamic Scroll**: Simulates scrolling to ensure that lazy-loaded sections (like experience, education, and skills) are fully loaded before parsing.
- **Caching Mechanism**: Stores scraped profile data in MongoDB. If a profile is requested again within 24 hours, it returns the cached data instead of making a new scrape request.
- **Force Scrape Option**: Allows bypassing the cache using a query parameter to fetch fresh live data.

## Project Structure

```
├── config/
│   └── db.js            # MongoDB connection
├── controllers/
│   └── profileController.js  # Business logic for endpoints
├── models/
│   └── Profile.js       # Mongoose Schema
├── routes/
│   └── profileRoutes.js  # API routes definition
├── services/
│   └── scraperService.js # Puppeteer automation logic
├── .env.example         # Template for environment variables
├── package.json         # Dependencies and scripts
└── server.js            # Server entry point
```

## Setup Instructions

### Prerequisites

- Node.js installed on your machine.
- MongoDB instance running locally or a MongoDB Atlas URI.

### 1. Install Dependencies

Clone the repository and run:

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory based on the `.env.example` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_uri
LINKEDIN_LI_AT=your_li_at_cookie
LINKEDIN_JSESSIONID=your_jsessionid_cookie
```

#### How to extract your LinkedIn cookies:
1. Open your browser and log into LinkedIn.
2. Right-click anywhere and click **Inspect** (or press `F12`) to open Developer Tools.
3. Go to the **Application** tab (Chrome/Edge) or **Storage** tab (Firefox).
4. Expand the **Cookies** section in the left sidebar and select `https://www.linkedin.com`.
5. Search for and copy the values of the following cookies:
   - `li_at`: Your session token.
   - `JSESSIONID`: The CSRF token (usually starts with `ajax:`).

### 3. Run the Server

Start the application:

```bash
npm start
```

For development (using nodemon if installed):

```bash
npm run dev
```

---

## API Documentation

### 1. Scrape Profile

Accepts a LinkedIn profile URL, checks the database for a cache, scrapes the live profile if necessary, and returns the structured profile details.

- **URL**: `/api/profiles/scrape`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Query Parameters**:
  - `force` (optional): Set to `true` to bypass the cache and force a fresh scrape.
- **Request Body**:
```json
{
  "url": "https://www.linkedin.com/in/williamhgates"
}
```

- **Success Response (200 OK)**:
```json
{
  "source": "live",
  "data": {
    "_id": "64ee372e90f2345ef8c8a1e2",
    "url": "https://www.linkedin.com/in/williamhgates",
    "username": "williamhgates",
    "name": "Bill Gates",
    "headline": "Co-chair, Bill & Melinda Gates Foundation",
    "location": "Seattle, Washington, United States",
    "about": "Co-chair of the Bill & Melinda Gates Foundation. Founder of Breakthrough Energy. Co-founder of Microsoft.",
    "profileImage": "https://media.licdn.com/dms/image/...",
    "experience": [
      {
        "title": "Co-chair",
        "company": "Bill & Melinda Gates Foundation",
        "duration": "2000 - Present",
        "description": "Working together to help all people lead healthy, productive lives."
      }
    ],
    "education": [
      {
        "school": "Harvard University",
        "degree": "Pre-Law, Computer Science",
        "dates": "1973 - 1975"
      }
    ],
    "skills": [
      "Software Development",
      "Philanthropy",
      "Technology Ventures"
    ],
    "certifications": [],
    "languages": [
      "English"
    ],
    "scrapedAt": "2026-08-27T11:40:00.000Z"
  }
}
```

### 2. Get All Scraped Profiles

Returns a list of all scraped profiles saved in the database.

- **URL**: `/api/profiles`
- **Method**: `GET`
- **Success Response (200 OK)**:
```json
[
  {
    "_id": "64ee372e90f2345ef8c8a1e2",
    "url": "https://www.linkedin.com/in/williamhgates",
    "username": "williamhgates",
    "name": "Bill Gates",
    "headline": "Co-chair, Bill & Melinda Gates Foundation",
    "location": "Seattle, Washington, United States",
    "scrapedAt": "2026-08-27T11:40:00.000Z"
  }
]
```

### 3. Get Profile by Username

Retrieves a cached profile from the database using its vanity username.

- **URL**: `/api/profiles/:username`
- **Method**: `GET`
- **Success Response (200 OK)**:
```json
{
  "_id": "64ee372e90f2345ef8c8a1e2",
  "url": "https://www.linkedin.com/in/williamhgates",
  "username": "williamhgates",
  "name": "Bill Gates",
  "headline": "Co-chair, Bill & Melinda Gates Foundation",
  "location": "Seattle, Washington, United States",
  "about": "Co-chair of the Bill & Melinda Gates Foundation...",
  "experience": [...],
  "education": [...],
  "skills": [...],
  "certifications": [],
  "languages": [],
  "scrapedAt": "2026-08-27T11:40:00.000Z"
}
```

---

## Approach

1. **Browser Automation (Puppeteer)**: LinkedIn loads its data dynamically using client-side JavaScript. By launching a headless browser and logging in using the session cookies (`li_at` and `JSESSIONID`), the script mimics a real user.
2. **Lazy Loading Handler**: Many sections of a LinkedIn profile do not render in the HTML source until they are scrolled into view. The scraper scrolls the page to trigger this rendering.
3. **Caching**: Scraping is a time-consuming and computationally expensive process. To protect the credentials from rate limits and blocks, profile data is cached in MongoDB with an expiration threshold of 24 hours.

---

## Known Limitations

- **Session Expiry**: The `li_at` cookie has an expiration date. If it expires, requests will start failing or redirect to a login wall. The cookies will then need to be updated in `.env`.
- **Anti-Bot Defenses**: If profiles are scraped at a very high frequency from the same IP address or using the same account, LinkedIn may prompt a verification challenge (CAPTCHA) or restrict the account. It is recommended to run this with adequate delays or rotation.
- **Layout Adaptability**: If LinkedIn changes its DOM element selectors, some fields (like experience or skills) might return empty and require updating the selectors in the `scraperService.js` file.
