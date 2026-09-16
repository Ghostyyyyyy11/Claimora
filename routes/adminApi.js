const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../lib/db');
const { requireAuthApi } = require('../lib/auth');

router.use(requireAuthApi);

function moveItem(list, id, direction) {
  list.sort((a, b) => a.order - b.order);
  const idx = list.findIndex(i => i.id === id);
  if (idx === -1) return;
  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= list.length) return;
  const tmp = list[idx].order;
  list[idx].order = list[swapWith].order;
  list[swapWith].order = tmp;
}

// ---------- SETTINGS ----------
router.post('/settings', (req, res) => {
  const data = readData();
  const { welcomeMessage, rewardTitle, rewardDescription, rewardActive } = req.body;

  if (typeof welcomeMessage === 'string') data.settings.welcomeMessage = welcomeMessage.slice(0, 4000);
  if (typeof rewardTitle === 'string') data.settings.rewardTitle = rewardTitle.slice(0, 200);
  if (typeof rewardDescription === 'string') data.settings.rewardDescription = rewardDescription.slice(0, 4000);
  data.settings.rewardActive = !!rewardActive;

  writeData(data);
  res.json({ success: true, settings: data.settings });
});

// ---------- REWARD DETAILS ----------
router.post('/reward-details', (req, res) => {
  const data = readData();
  const { label, value, copyable } = req.body;
  if (!label || !String(label).trim()) return res.status(400).json({ error: 'Label is required.' });

  const maxOrder = data.rewardDetails.reduce((m, d) => Math.max(m, d.order), 0);
  const item = {
    id: data.nextIds.rewardDetail++,
    label: String(label).trim().slice(0, 100),
    value: (value || '').toString().slice(0, 500),
    copyable: !!copyable,
    order: maxOrder + 1
  };
  data.rewardDetails.push(item);
  writeData(data);
  res.json({ success: true, item });
});

router.put('/reward-details/:id', (req, res) => {
  const data = readData();
  const item = data.rewardDetails.find(d => d.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found.' });

  const { label, value, copyable } = req.body;
  if (typeof label === 'string' && label.trim()) item.label = label.trim().slice(0, 100);
  if (typeof value === 'string') item.value = value.slice(0, 500);
  if (copyable !== undefined) item.copyable = !!copyable;

  writeData(data);
  res.json({ success: true, item });
});

router.delete('/reward-details/:id', (req, res) => {
  const data = readData();
  data.rewardDetails = data.rewardDetails.filter(d => d.id !== Number(req.params.id));
  writeData(data);
  res.json({ success: true });
});

router.post('/reward-details/:id/move', (req, res) => {
  const data = readData();
  moveItem(data.rewardDetails, Number(req.params.id), req.body.direction);
  writeData(data);
  res.json({ success: true });
});

// ---------- SUBMISSION FIELDS ----------
router.post('/fields', (req, res) => {
  const data = readData();
  const { label, placeholder, required, copyable } = req.body;
  if (!label || !String(label).trim()) return res.status(400).json({ error: 'Label is required.' });

  const maxOrder = data.fields.reduce((m, f) => Math.max(m, f.order), 0);
  const field = {
    id: data.nextIds.field++,
    label: String(label).trim().slice(0, 100),
    placeholder: (placeholder || '').toString().slice(0, 150),
    required: !!required,
    enabled: true,
    copyable: !!copyable,
    order: maxOrder + 1
  };
  data.fields.push(field);
  writeData(data);
  res.json({ success: true, field });
});

router.put('/fields/:id', (req, res) => {
  const data = readData();
  const field = data.fields.find(f => f.id === Number(req.params.id));
  if (!field) return res.status(404).json({ error: 'Not found.' });

  const { label, placeholder, required, enabled, copyable } = req.body;
  if (typeof label === 'string' && label.trim()) field.label = label.trim().slice(0, 100);
  if (typeof placeholder === 'string') field.placeholder = placeholder.slice(0, 150);
  if (required !== undefined) field.required = !!required;
  if (enabled !== undefined) field.enabled = !!enabled;
  if (copyable !== undefined) field.copyable = !!copyable;

  writeData(data);
  res.json({ success: true, field });
});

router.delete('/fields/:id', (req, res) => {
  const data = readData();
  data.fields = data.fields.filter(f => f.id !== Number(req.params.id));
  writeData(data);
  res.json({ success: true });
});

router.post('/fields/:id/move', (req, res) => {
  const data = readData();
  moveItem(data.fields, Number(req.params.id), req.body.direction);
  writeData(data);
  res.json({ success: true });
});

// ---------- SUBMISSIONS ----------
router.get('/submissions', (req, res) => {
  const data = readData();
  const sorted = data.submissions.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ submissions: sorted });
});

router.post('/submissions/:id/select-winner', (req, res) => {
  const data = readData();
  const id = Number(req.params.id);
  const target = data.submissions.find(s => s.id === id);
  if (!target) return res.status(404).json({ error: 'Not found.' });

  data.submissions.forEach(s => {
    s.isWinner = s.id === id;
  });
  writeData(data);
  res.json({ success: true, winner: target });
});

router.post('/pick-random-winner', (req, res) => {
  const data = readData();
  if (data.submissions.length === 0) return res.status(400).json({ error: 'No submissions yet.' });

  const idx = Math.floor(Math.random() * data.submissions.length);
  const winner = data.submissions[idx];
  data.submissions.forEach(s => {
    s.isWinner = s.id === winner.id;
  });
  writeData(data);
  res.json({ success: true, winner });
});

router.delete('/submissions/:id', (req, res) => {
  const data = readData();
  data.submissions = data.submissions.filter(s => s.id !== Number(req.params.id));
  writeData(data);
  res.json({ success: true });
});

router.post('/submissions/reset', (req, res) => {
  const data = readData();
  data.submissions = [];
  writeData(data);
  res.json({ success: true });
});

module.exports = router;
