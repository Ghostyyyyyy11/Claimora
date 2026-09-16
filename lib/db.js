const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_DATA = {
  settings: {
    welcomeMessage:
      "Welcome to Bonus Coin Giveaway! Check the Rewards page to see what's currently available and how to claim it.",
    rewardTitle: '',
    rewardDescription: '',
    rewardActive: false
  },
  rewardDetails: [], // { id, label, value, copyable, order }
  fields: [], // { id, label, placeholder, required, enabled, copyable, order }
  submissions: [], // { id, values: [{fieldId, label, value}], createdAt, isWinner }
  nextIds: { rewardDetail: 1, field: 1, submission: 1 }
};

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

function readData() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    // Backfill any missing top-level keys for forward compatibility.
    return Object.assign({}, JSON.parse(JSON.stringify(DEFAULT_DATA)), parsed);
  } catch (e) {
    console.error('[db] Data file was corrupt, reinitializing:', e.message);
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = { readData, writeData, DATA_FILE, DATA_DIR };
