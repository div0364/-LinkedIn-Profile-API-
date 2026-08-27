# LinkedIn Profile API Backend

A purely reverse-engineered Node.js/Express and MongoDB backend for scraping and caching LinkedIn profiles without using a web browser. The application makes direct HTTP requests to LinkedIn's private "Voyager" API endpoints using your own LinkedIn cookies to retrieve detailed profile data in a structured JSON format.

## Features

- **No Browser dependency**: Hits LinkedIn endpoints directly using HTTP requests via Axios, eliminating the need for Puppeteer, Playwright, or headless Chromium. Highly resource-efficient and fast (responds in milliseconds).
- **Profile Scraping**: Extracts name, headline, location, summary, experience, education, skills, languages, certifications, and profile picture.
- **Caching Mechanism**: Stores scraped profile data in MongoDB. If a profile is requested again within 24 hours, it returns the cached data instead of making a new scrape request.
- **Force Scrape Option**: Allows bypassing the cache using a query parameter to fetch fresh live data.

## Project Structure

```
├── config/
│   └── db.js            # MongoDB connection & custom DNS resolution
├── controllers/
│   └── profileController.js  # Business logic for endpoints
├── models/
│   └── Profile.js       # Mongoose Schema
├── routes/
│   └── profileRoutes.js  # API routes definition
├── services/
│   └── scraperService.js # Pure reverse-engineered Voyager API scraper
├── public/
│   └── index.html       # Single-page Tailwind CSS frontend
├── .env.example         # Template for environment variables
├── package.json         # Dependencies and scripts
└── local.js             # Local server entry point
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

1. **Undocumented Voyager API**: We reverse-engineered LinkedIn's internal HTTP REST API endpoints (`/voyager/api/identity/dash/profiles` and `/voyager/api/identity/profileSectionCollections/`). This allows direct data extraction as normalized JSON without requiring browser overhead or parsing dynamic DOM structures.
2. **Authentication via Session Hijacking**: The scraper takes the session cookie (`li_at`) and CSRF token (`JSESSIONID`) of a logged-in user, replicating the network layer authorization.
3. **Database Caching**: To minimize API requests and avoid rate-limiting or account flags, scraped data is cached in MongoDB for 24 hours.

---

## Known Limitations

- **Session Expiry**: The `li_at` cookie expires over time, requiring you to copy new credentials into `.env` or the frontend settings.
- **Account Protection**: Making excessive requests from a single account may trigger a CAPTCHA challenge or lead to session restrictions. Using proxies and caching is recommended.
- **Endpoint Drift**: Since Voyager is an internal API, LinkedIn can deprecate or restructure endpoints or decoration IDs, which would require updating the requests mapping.
