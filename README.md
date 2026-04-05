# Portfolio Backend — Node.js / Express

REST API backend for the portfolio contact form. Validates submissions, saves them to a local JSON store, and emails them to you via Nodemailer.

---

## 📁 Project Structure

```
portfolio-backend/
├── server.js                  # Express app entry point
├── .env.example               # Copy → .env and fill in credentials
├── package.json
│
├── routes/
│   └── contact.js             # POST /api/contact  (+ GET list/detail)
│
├── services/
│   ├── emailService.js        # Nodemailer — sends you a beautiful HTML email
│   └── storageService.js      # Reads/writes data/submissions.json
│
├── middleware/
│   └── errorHandler.js        # 404 + global error handler
│
├── utils/
│   └── logger.js              # Tiny console logger with timestamps
│
└── data/
    └── submissions.json       # Auto-created — all form submissions stored here
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# → Edit .env with your Gmail credentials (see below)

# 3. Start development server (with auto-reload)
npm run dev

# 4. Start production server
npm start
```

Server runs on **http://localhost:5000** by default.

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port to run on (default: 5000) |
| `FRONTEND_URL` | Your React app URL for CORS (e.g. `http://localhost:5173`) |
| `EMAIL_USER` | Your Gmail address |
| `EMAIL_PASS` | Gmail **App Password** (16 chars) — not your real password |
| `RECEIVER_EMAIL` | Where to send contact notifications (usually same as EMAIL_USER) |

### Getting a Gmail App Password
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification → **App Passwords**
3. Create one for "Mail" → copy the 16-char password

---

## 📡 API Endpoints

### `POST /api/contact`
Submit a contact form.

**Request body:**
```json
{
  "name":    "Jane Doe",
  "email":   "jane@example.com",
  "subject": "Project Inquiry",
  "message": "Hi Arjun, I have an exciting project..."
}
```

**Success (201):**
```json
{
  "success": true,
  "message": "Thanks for reaching out! I'll get back to you soon.",
  "submissionId": "1723456789012"
}
```

**Validation error (422):**
```json
{
  "success": false,
  "message": "Validation failed. Please check your inputs.",
  "errors": [
    { "field": "email", "message": "Please enter a valid email address." }
  ]
}
```

**Rate limited (429):** Max **5 requests per 15 minutes** per IP.

---

### `GET /api/contact`
Returns all submissions (protect with auth middleware in production).

### `GET /api/contact/:id`
Returns a single submission by ID.

### `GET /health`
Health check endpoint.

---

## 🔗 Connecting to the React Frontend

In your React project, add a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

The `Contact.jsx` component already reads this variable and POSTs to `/api/contact`.

---

## 🛡 Security Notes

- Submissions are rate-limited (5 per 15 min per IP)
- Request body is capped at 10 KB
- All inputs are validated and sanitized via `express-validator`
- The `GET /api/contact` list endpoint should be protected with an auth middleware before deploying publicly

## 🌐 Deploying

Works out of the box on **Railway**, **Render**, **Fly.io**, or any Node-capable host. Just set the environment variables in the hosting dashboard.
