const fs   = require('fs').promises;
const path = require('path');

const DATA_DIR  = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

// ── Ensure data directory + file exist ───────────────────────────────────────
async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

// ── Read all submissions ──────────────────────────────────────────────────────
async function getSubmissions() {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

// ── Get one submission by ID ──────────────────────────────────────────────────
async function getSubmissionById(id) {
  const all = await getSubmissions();
  return all.find(s => s.id === id) || null;
}

// ── Append a new submission ───────────────────────────────────────────────────
async function saveSubmission(submission) {
  const all = await getSubmissions();
  all.unshift(submission); // newest first
  await fs.writeFile(DATA_FILE, JSON.stringify(all, null, 2), 'utf8');
  return submission;
}

module.exports = { getSubmissions, getSubmissionById, saveSubmission };
