const express   = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const { sendContactEmail } = require('../services/emailService');
const { saveSubmission }   = require('../services/storageService');
const logger               = require('../utils/logger');

const router = express.Router();

// ── Rate limiter: max 5 requests per 15 min per IP ───────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many messages sent. Please wait 15 minutes and try again.',
  },
});

// ── Validation rules ──────────────────────────────────────────────────────────
const contactValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required.')
    .isLength({ min: 3, max: 120 }).withMessage('Subject must be 3–120 characters.'),

  body('message')
    .trim()
    .notEmpty().withMessage('Message is required.')
    .isLength({ min: 10, max: 2000 }).withMessage('Message must be 10–2000 characters.'),
];

// ── POST /api/contact ─────────────────────────────────────────────────────────
router.post('/', limiter, contactValidation, async (req, res, next) => {
  // 1. Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed. Please check your inputs.',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }

  const { name, email, subject, message } = req.body;

  const submission = {
    id:        Date.now().toString(),
    name,
    email,
    subject,
    message,
    ip:        req.ip,
    userAgent: req.headers['user-agent'] || 'unknown',
    createdAt: new Date().toISOString(),
  };

  try {
    // 2. Save to local JSON store
    await saveSubmission(submission);

    logger.info(`New submission ${submission.id} - ${name} <${email}>`);

    // 3. Return response immediately
    res.status(201).json({
      success: true,
      message: "Thanks for reaching out! I'll get back to you soon.",
      submissionId: submission.id,
    });

    // 4. Send email in the background (do not block API response)
    setImmediate(async () => {
      try {
        await sendContactEmail(submission);
        logger.info(`Email sent for submission ${submission.id} from ${email}`);
      } catch (emailErr) {
        logger.error(`Email failed for submission ${submission.id}: ${emailErr.message}`);
      }
    });

    return;
  } catch (err) {
    next(err);
  }
});

// ── GET /api/contact  (list all submissions — protect this in production!) ────
router.get('/', async (req, res, next) => {
  try {
    const { getSubmissions } = require('../services/storageService');
    const submissions = await getSubmissions();
    res.json({ success: true, count: submissions.length, data: submissions });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/contact/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { getSubmissionById } = require('../services/storageService');
    const submission = await getSubmissionById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }
    res.json({ success: true, data: submission });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

