(function () {
  const CSRF = window.__CSRF_TOKEN__;
  const DATA = window.__ADMIN_INIT__;

  // ---- Tabs ----
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  function apiCall(method, url, body) {
    return fetch(url, {
      method,
      headers: Object.assign(
        { 'Content-Type': 'application/json' },
        method === 'GET' ? {} : { 'X-CSRF-Token': CSRF }
      ),
      body: body ? JSON.stringify(body) : undefined
    }).then(async r => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Request failed.');
      return data;
    });
  }

  function escapeHtml(str) {
    return String(str).replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  // ---------- SETTINGS ----------
  document.getElementById('welcomeMessage').value = DATA.settings.welcomeMessage || '';
  document.getElementById('rewardTitle').value = DATA.settings.rewardTitle || '';
  document.getElementById('rewardDescription').value = DATA.settings.rewardDescription || '';
  document.getElementById('rewardActive').checked = !!DATA.settings.rewardActive;

  document.getElementById('save-settings').addEventListener('click', () => {
    const body = {
      welcomeMessage: document.getElementById('welcomeMessage').value,
      rewardTitle: document.getElementById('rewardTitle').value,
      rewardDescription: document.getElementById('rewardDescription').value,
      rewardActive: document.getElementById('rewardActive').checked
    };
    apiCall('POST', '/admin/api/settings', body)
      .then(() => {
        const el = document.getElementById('settings-saved');
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 2000);
      })
      .catch(err => alert(err.message));
  });

  // ---------- REWARD DETAILS ----------
  function renderDetails() {
    const list = document.getElementById('details-list');
    list.innerHTML = '';
    const items = DATA.rewardDetails.slice().sort((a, b) => a.order - b.order);
    if (!items.length) {
      list.innerHTML = '<p class="empty">No reward details yet.</p>';
      return;
    }
    items.forEach((d, i) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div class="item-main">
          <strong>${escapeHtml(d.label)}</strong>
          <span class="item-sub">${escapeHtml(d.value)}</span>
          ${d.copyable ? '<span class="badge">Copyable</span>' : ''}
        </div>
        <div class="item-actions">
          <button data-action="up" ${i === 0 ? 'disabled' : ''} title="Move up">↑</button>
          <button data-action="down" ${i === items.length - 1 ? 'disabled' : ''} title="Move down">↓</button>
          <button data-action="edit">Edit</button>
          <button data-action="delete" class="danger">Delete</button>
        </div>`;
      row.querySelector('[data-action="up"]').addEventListener('click', () => moveDetail(d.id, 'up'));
      row.querySelector('[data-action="down"]').addEventListener('click', () => moveDetail(d.id, 'down'));
      row.querySelector('[data-action="edit"]').addEventListener('click', () => editDetail(d));
      row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteDetail(d.id));
      list.appendChild(row);
    });
  }

  function moveDetail(id, direction) {
    apiCall('POST', `/admin/api/reward-details/${id}/move`, { direction }).then(() => location.reload());
  }
  function deleteDetail(id) {
    if (!confirm('Delete this reward detail?')) return;
    apiCall('DELETE', `/admin/api/reward-details/${id}`).then(() => location.reload());
  }
  function editDetail(d) {
    const label = prompt('Label', d.label);
    if (label === null) return;
    const value = prompt('Value', d.value);
    if (value === null) return;
    const copyable = confirm('Should this value be copyable?\nOK = Yes, Cancel = No');
    apiCall('PUT', `/admin/api/reward-details/${d.id}`, { label, value, copyable }).then(() => location.reload());
  }

  document.getElementById('add-detail').addEventListener('click', () => {
    const label = document.getElementById('new-detail-label').value.trim();
    const value = document.getElementById('new-detail-value').value.trim();
    const copyable = document.getElementById('new-detail-copyable').checked;
    if (!label) return alert('Label is required.');
    apiCall('POST', '/admin/api/reward-details', { label, value, copyable })
      .then(() => location.reload())
      .catch(err => alert(err.message));
  });

  // ---------- SUBMISSION FIELDS ----------
  function renderFields() {
    const list = document.getElementById('fields-list');
    list.innerHTML = '';
    const items = DATA.fields.slice().sort((a, b) => a.order - b.order);
    if (!items.length) {
      list.innerHTML = '<p class="empty">No submission fields yet — add one below.</p>';
      return;
    }
    items.forEach((f, i) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div class="item-main">
          <strong>${escapeHtml(f.label)}</strong>
          <span class="item-sub">${escapeHtml(f.placeholder || '')}</span>
          ${f.required ? '<span class="badge">Required</span>' : '<span class="badge muted">Optional</span>'}
          ${f.copyable ? '<span class="badge">Copyable</span>' : ''}
          ${f.enabled ? '<span class="badge success">Enabled</span>' : '<span class="badge muted">Disabled</span>'}
        </div>
        <div class="item-actions">
          <button data-action="up" ${i === 0 ? 'disabled' : ''} title="Move up">↑</button>
          <button data-action="down" ${i === items.length - 1 ? 'disabled' : ''} title="Move down">↓</button>
          <button data-action="toggle">${f.enabled ? 'Disable' : 'Enable'}</button>
          <button data-action="edit">Edit</button>
          <button data-action="delete" class="danger">Delete</button>
        </div>`;
      row.querySelector('[data-action="up"]').addEventListener('click', () => moveField(f.id, 'up'));
      row.querySelector('[data-action="down"]').addEventListener('click', () => moveField(f.id, 'down'));
      row.querySelector('[data-action="toggle"]').addEventListener('click', () => toggleField(f));
      row.querySelector('[data-action="edit"]').addEventListener('click', () => editField(f));
      row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteField(f.id));
      list.appendChild(row);
    });
  }

  function moveField(id, direction) {
    apiCall('POST', `/admin/api/fields/${id}/move`, { direction }).then(() => location.reload());
  }
  function toggleField(f) {
    apiCall('PUT', `/admin/api/fields/${f.id}`, { enabled: !f.enabled }).then(() => location.reload());
  }
  function deleteField(id) {
    if (!confirm('Delete this field? Past submissions keep their historical data either way.')) return;
    apiCall('DELETE', `/admin/api/fields/${id}`).then(() => location.reload());
  }
  function editField(f) {
    const label = prompt('Field label', f.label);
    if (label === null) return;
    const placeholder = prompt('Placeholder text', f.placeholder || '');
    if (placeholder === null) return;
    const required = confirm('Should this field be required?\nOK = Yes, Cancel = No');
    const copyable = confirm('Should users be able to copy what they typed?\nOK = Yes, Cancel = No');
    apiCall('PUT', `/admin/api/fields/${f.id}`, { label, placeholder, required, copyable }).then(() =>
      location.reload()
    );
  }

  document.getElementById('add-field').addEventListener('click', () => {
    const label = document.getElementById('new-field-label').value.trim();
    const placeholder = document.getElementById('new-field-placeholder').value.trim();
    const required = document.getElementById('new-field-required').checked;
    const copyable = document.getElementById('new-field-copyable').checked;
    if (!label) return alert('Field label is required.');
    apiCall('POST', '/admin/api/fields', { label, placeholder, required, copyable })
      .then(() => location.reload())
      .catch(err => alert(err.message));
  });

  // ---------- SUBMISSIONS ----------
  function renderSubmissions() {
    const container = document.getElementById('submissions-table');
    const subs = DATA.submissions.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (!subs.length) {
      container.innerHTML = '<p class="empty">No submissions yet.</p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'submissions-table';
    table.innerHTML = '<thead><tr><th>Date</th><th>Entry Details</th><th>Winner</th><th>Actions</th></tr></thead>';
    const tbody = document.createElement('tbody');

    subs.forEach(s => {
      const tr = document.createElement('tr');
      if (s.isWinner) tr.classList.add('winner-row');
      const date = new Date(s.createdAt).toLocaleString();
      const details =
        (s.values || []).map(v => `<div><strong>${escapeHtml(v.label)}:</strong> ${escapeHtml(v.value)}</div>`).join('') ||
        '<em>No data</em>';

      tr.innerHTML = `
        <td>${date}</td>
        <td>${details}</td>
        <td>${s.isWinner ? '🏆 Winner' : ''}</td>
        <td class="row-actions"></td>`;

      const actionsTd = tr.querySelector('.row-actions');

      const selectBtn = document.createElement('button');
      selectBtn.textContent = 'Select as Winner';
      selectBtn.addEventListener('click', () => {
        apiCall('POST', `/admin/api/submissions/${s.id}/select-winner`).then(() => location.reload());
      });

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.className = 'danger';
      delBtn.addEventListener('click', () => {
        if (!confirm('Delete this submission?')) return;
        apiCall('DELETE', `/admin/api/submissions/${s.id}`).then(() => location.reload());
      });

      actionsTd.appendChild(selectBtn);
      actionsTd.appendChild(delBtn);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.innerHTML = '';
    container.appendChild(table);
  }

  document.getElementById('pick-random').addEventListener('click', () => {
    if (!confirm('Randomly select a winner from all current submissions?')) return;
    apiCall('POST', '/admin/api/pick-random-winner')
      .then(() => location.reload())
      .catch(err => alert(err.message));
  });

  document.getElementById('reset-submissions').addEventListener('click', () => {
    if (!confirm('This will permanently delete ALL submissions to start a new giveaway round. Continue?')) return;
    apiCall('POST', '/admin/api/submissions/reset').then(() => location.reload());
  });

  renderDetails();
  renderFields();
  renderSubmissions();
})();
