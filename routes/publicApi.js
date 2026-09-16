const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../lib/db');

// Public: current config the Rewards page needs to render itself.
router.get('/api/config', (req, res) => {
  const data = readData();

  const fields = data.fields
    .filter(f => f.enabled)
    .sort((a, b) => a.order - b.order)
    .map(f => ({
      id: f.id,
      label: f.label,
      placeholder: f.placeholder,
      required: f.required,
      copyable: f.copyable
    }));

  const rewardDetails = data.rewardDetails
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(d => ({ id: d.id, label: d.label, value: d.value, copyable: d.copyable }));

  res.json({
    welcomeMessage: data.settings.welcomeMessage,
    reward: {
      title: data.settings.rewardTitle,
      description: data.settings.rewardDescription,
      active: !!data.settings.rewardActive,
      details: rewardDetails
    },
    fields
  });
});

// Public: submit a claim entry.
router.post('/api/submit', (req, res) => {
  const data = readData();

  // Honeypot: real users never fill this hidden field. Bots often do.
  if (req.body.hp_website) {
    return res.json({ success: true, message: 'Your entry has been submitted securely. Good luck!' });
  }

  if (!data.settings.rewardActive) {
    return res.status(400).json({ error: 'This giveaway is not currently accepting entries.' });
  }

  const enabledFields = data.fields.filter(f => f.enabled).sort((a, b) => a.order - b.order);

  if (enabledFields.length === 0) {
    return res.status(400).json({ error: 'No submission fields are configured yet. Please check back soon.' });
  }

  const values = [];
  for (const f of enabledFields) {
    const raw = (req.body['field_' + f.id] || '').toString().trim();
    if (f.required && !raw) {
      return res.status(400).json({ error: `"${f.label}" is required.` });
    }
    if (raw) {
      values.push({ fieldId: f.id, label: f.label, value: raw.slice(0, 500) });
    }
  }

  const submission = {
    id: data.nextIds.submission++,
    values,
    createdAt: new Date().toISOString(),
    isWinner: false
  };

  data.submissions.push(submission);
  writeData(data);

  res.json({ success: true, message: 'Your entry has been submitted securely. Good luck!' });
});

module.exports = router;
