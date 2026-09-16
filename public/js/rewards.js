(function () {
  const params = new URLSearchParams(location.search);
  const autoOpen = params.get('claim') === '1';

  fetch('/api/config')
    .then(r => r.json())
    .then(cfg => {
      document.getElementById('reward-loading').classList.add('hidden');
      document.getElementById('reward-content').classList.remove('hidden');

      document.getElementById('reward-title').textContent = cfg.reward.title || 'Current Giveaway';
      document.getElementById('reward-description').textContent = cfg.reward.description || '';

      const detailsEl = document.getElementById('reward-details');
      (cfg.reward.details || []).forEach(d => {
        const row = document.createElement('div');
        row.className = 'detail-row';

        const label = document.createElement('span');
        label.className = 'detail-label';
        label.textContent = d.label + ':';

        const value = document.createElement('span');
        value.className = 'detail-value';
        value.textContent = d.value;

        row.appendChild(label);
        row.appendChild(value);
        if (d.copyable) row.appendChild(makeCopyButton(() => d.value));

        detailsEl.appendChild(row);
      });

      const claimBtn = document.getElementById('claim-btn');
      if (!cfg.reward.active) {
        document.getElementById('reward-inactive-msg').classList.remove('hidden');
        claimBtn.disabled = true;
        claimBtn.classList.add('btn-disabled');
      } else {
        buildForm(cfg.fields);
        claimBtn.addEventListener('click', openClaim);
        if (autoOpen) openClaim();
      }
    })
    .catch(() => {
      document.getElementById('reward-loading').textContent =
        'Unable to load reward information. Please refresh the page.';
    });

  function openClaim() {
    document.getElementById('claim-section').classList.remove('hidden');
    document.getElementById('claim-section').scrollIntoView({ behavior: 'smooth' });
  }

  function makeCopyButton(getValue) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => {
      const val = getValue();
      if (!val) return;
      navigator.clipboard
        .writeText(val)
        .then(() => {
          const original = btn.textContent;
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = original;
            btn.classList.remove('copied');
          }, 1500);
        })
        .catch(() => {
          btn.textContent = 'Copy failed';
          setTimeout(() => (btn.textContent = 'Copy'), 1500);
        });
    });
    return btn;
  }

  function buildForm(fields) {
    const container = document.getElementById('form-fields');
    if (!fields.length) {
      container.innerHTML = '<p>No submission fields are configured yet. Please check back soon.</p>';
      document.getElementById('submit-btn').disabled = true;
      return;
    }

    fields.forEach(f => {
      const group = document.createElement('div');
      group.className = 'form-group';

      const label = document.createElement('label');
      label.setAttribute('for', 'field_' + f.id);
      label.textContent = f.label + (f.required ? ' *' : '');
      group.appendChild(label);

      const inputRow = document.createElement('div');
      inputRow.className = 'input-row';

      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'field_' + f.id;
      input.name = 'field_' + f.id;
      input.placeholder = f.placeholder || '';
      if (f.required) input.required = true;
      input.maxLength = 500;
      inputRow.appendChild(input);

      if (f.copyable) inputRow.appendChild(makeCopyButton(() => input.value));

      group.appendChild(inputRow);
      container.appendChild(group);
    });
  }

  document.getElementById('claim-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const msg = document.getElementById('form-message');
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    const body = new URLSearchParams(new FormData(e.target));

    fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
      .then(async r => ({ ok: r.ok, data: await r.json().catch(() => ({})) }))
      .then(({ ok, data }) => {
        msg.classList.remove('hidden', 'error', 'success');
        if (ok && data.success) {
          msg.classList.add('success');
          msg.textContent = data.message || 'Submitted!';
          e.target.reset();
          e.target.querySelectorAll('input').forEach(i => (i.disabled = true));
          btn.classList.add('hidden');
        } else {
          msg.classList.add('error');
          msg.textContent = data.error || 'Something went wrong. Please try again.';
          btn.disabled = false;
          btn.textContent = 'Submit Entry';
        }
      })
      .catch(() => {
        msg.classList.remove('hidden');
        msg.classList.add('error');
        msg.textContent = 'Network error. Please try again.';
        btn.disabled = false;
        btn.textContent = 'Submit Entry';
      });
  });
})();
