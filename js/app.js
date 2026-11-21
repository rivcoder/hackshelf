(() => {
'use strict';

const STATUSES = [['interested','Interested'],['registered','Registered'],['team','Team formed'],['submitted','Submitted'],['result','Result']];
const PLATFORMS = ['Devfolio','Unstop','Devpost','MLH','Other'];

// Robust UUID generator with fallback for older browsers or non-secure contexts
const genId = () => (typeof crypto !== 'undefined' && crypto.randomUUID)
  ? crypto.randomUUID()
  : 'hs-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);

/* ---------- Storage layer ----------
   Everything the UI needs goes through these async methods.
   Supports backward migration from old key if exists. */
const NEW_KEY = 'hackshelf.items.v1';
const OLD_KEY = 'hackmark.items.v1';

const store = {
  async list() {
    try {
      let raw = localStorage.getItem(NEW_KEY);
      if (!raw) {
        // migrate old key if present
        const oldRaw = localStorage.getItem(OLD_KEY);
        if (oldRaw) {
          localStorage.setItem(NEW_KEY, oldRaw);
          raw = oldRaw;
        }
      }
      return JSON.parse(raw || '[]');
    } catch {
      throw new Error('Your saved list could not be read.');
    }
  },
  async _save(items) {
    try {
      localStorage.setItem(NEW_KEY, JSON.stringify(items));
    } catch (e) {
      if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)) {
        throw new Error('Storage is full. Please use Export to back up, then delete past hackathons.');
      }
      throw new Error('Could not save. Your browser storage may be blocked or restricted in private mode.');
    }
  },
  async add(item) {
    const items = await this.list();
    const row = { id: genId(), created_at: new Date().toISOString(), ...item };
    items.push(row);
    await this._save(items);
    return row;
  },
  async update(id, patch) {
    const items = await this.list();
    const i = items.findIndex(x => x.id === id);
    if (i < 0) throw new Error('That hackathon no longer exists.');
    items[i] = { ...items[i], ...patch };
    await this._save(items);
    return items[i];
  },
  async remove(id) {
    await this._save((await this.list()).filter(x => x.id !== id));
  },
  async importAll(newItems) {
    if (!Array.isArray(newItems)) throw new Error('Invalid format: expected array.');
    const existing = await this.list();
    const existingIds = new Set(existing.map(x => x.id));
    const merged = [...existing];
    for (const item of newItems) {
      if (item && item.name && item.deadline) {
        if (!item.id || existingIds.has(item.id)) {
          item.id = genId();
        }
        merged.push(item);
      }
    }
    await this._save(merged);
    return merged;
  }
};

/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v);
  }
  n.append(...kids.flat().filter(k => k != null && k !== false));
  return n;
}
const safeUrl = s => {
  if (!s) return null;
  for (const t of [s, 'https://' + s]) {
    try {
      const u = new URL(t);
      if (/^https?:$/.test(u.protocol) && u.hostname.includes('.')) return u.href;
    } catch {}
  }
  return null;
};
const platformFromUrl = s => {
  const h = (safeUrl(s) || '').toLowerCase();
  return h.includes('devfolio') ? 'Devfolio' : h.includes('unstop') ? 'Unstop' : h.includes('devpost') ? 'Devpost' : h.includes('mlh.io') ? 'MLH' : 'Other';
};
const daysLeft = ymd => {
  const [y, m, d] = ymd.split('-').map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d) - today) / 864e5);
};
const fmtDate = ymd => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};
let toastTimer;
function toast(msg, bad, action) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'show' + (bad ? ' bad' : '');
  if (action) t.append(el('button', { type: 'button', onclick: () => { t.className = ''; action.fn(); } }, action.label));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = '', action ? 6000 : 3200);
}

/* ---------- State and rendering ---------- */
const state = { items: [], q: '', status: '', platform: '', soon: false, editing: null };

function matches(i) {
  if (state.status && i.status !== state.status) return false;
  if (state.platform && i.platform !== state.platform) return false;
  if (state.soon) {
    const d = daysLeft(i.deadline);
    if (d < 0 || d > 7) return false;
  }
  if (state.q) {
    const hay = [i.name, i.notes, i.team_members, (i.tags || []).join(' ')].join(' ').toLowerCase();
    if (!hay.includes(state.q)) return false;
  }
  return true;
}

function row(i) {
  const d = daysLeft(i.deadline);
  const cls = d < 0 ? 'u-past' : d <= 1 ? 'u-red' : d <= 7 ? 'u-gold' : 'u-calm';
  const num = d < 0 ? Math.abs(d) : d;
  const unit = d < 0 ? 'ago' : d === 0 ? 'today' : d === 1 ? 'day' : 'days';
  const url = safeUrl(i.url);
  const chat = safeUrl(i.team_chat);
  const platformClass = i.platform ? 'platform-badge platform-' + i.platform : 'platform-badge';
  const meta = [
    el('span', {}, fmtDate(i.deadline)),
    i.platform ? el('span', { class: platformClass }, i.platform) : null,
    i.mode ? el('span', {}, i.mode) : null,
    i.prize ? el('span', {}, '🏆 Prize: ' + i.prize) : null
  ].filter(Boolean);
  if (i.team_members) meta.push(el('span', {}, '👥 Team: ' + i.team_members));
  if (chat) meta.push(el('a', { href: chat, target: '_blank', rel: 'noopener noreferrer', class: 'chat-link' }, '💬 Team chat'));
  
  const sel = el('select', {
    'aria-label': 'Status for ' + i.name,
    onchange: async e => {
      try {
        await store.update(i.id, { status: e.target.value });
        toast('Status updated');
        if (['registered','submitted','result'].includes(e.target.value) && window.hmConfetti) window.hmConfetti(e.target);
        await load();
      } catch (err) {
        toast(err.message, true);
      }
    }
  }, STATUSES.map(([v, l]) => el('option', { value: v, selected: i.status === v ? '' : null }, l)));

  return el('li', { class: 'row' + (d < 0 ? ' past' : '') },
    el('div', { class: 'count ' + cls }, el('b', {}, d === 0 ? '0' : String(num)), el('span', {}, unit)),
    el('div', { class: 'main' },
      url ? el('a', { class: 'name', href: url, target: '_blank', rel: 'noopener noreferrer' }, i.name) : el('span', { class: 'name' }, i.name),
      el('div', { class: 'meta' }, meta),
      (i.tags && i.tags.length) ? el('div', { class: 'tags' }, i.tags.map(t => el('span', { class: 'tag' }, t))) : null,
      i.notes ? el('blockquote', { class: 'notes-quote' }, i.notes) : null),
    el('div', { class: 'acts' }, sel,
      el('button', { class: 'icon-btn', type: 'button', onclick: () => openDialog(i), 'aria-label': 'Edit hackathon' }, '✏️ Edit'),
      el('button', { class: 'icon-btn danger', type: 'button', onclick: () => del(i), 'aria-label': 'Delete hackathon' }, '🗑️ Delete')));
}

function render() {
  const all = state.items;
  const shown = all.filter(matches);
  const upcoming = shown.filter(i => daysLeft(i.deadline) >= 0).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const past = shown.filter(i => daysLeft(i.deadline) < 0).sort((a, b) => b.deadline.localeCompare(a.deadline));
  const list = $('#list');
  list.replaceChildren();

  if (!all.length) {
    list.append(el('li', { class: 'empty' },
      el('div', { class: 'empty-badge' }, el('img', { src: 'img/logo.png', alt: 'Shelf', class: 'empty-logo' })),
      el('h2', {}, 'Your shelf is empty'),
      el('p', {}, 'Found a hackathon worth building for? Drop the link here and never let a deadline slip by.'),
      el('button', { class: 'btn btn-primary-add', type: 'button', onclick: () => openDialog() }, el('span', {}, '+'), 'Add your first hackathon')));
  } else if (!shown.length) {
    list.append(el('li', { class: 'empty' },
      el('h2', {}, 'Nothing matches'),
      el('p', {}, 'Try clearing the search or filters.'),
      el('button', { class: 'btn ghost', type: 'button', onclick: clearFilters }, 'Clear filters')));
  } else {
    upcoming.forEach(i => list.append(row(i)));
  }

  const soonCount = all.filter(i => { const d = daysLeft(i.deadline); return d >= 0 && d <= 7; }).length;
  const isFiltered = Boolean(state.q || state.status || state.platform || state.soon);
  $('#summary').textContent = all.length
    ? `${all.filter(i => daysLeft(i.deadline) >= 0).length} upcoming, ${soonCount} closing this week` +
      (isFiltered ? ` · Showing ${shown.length} of ${all.length}` : '')
    : '';

  const arch = $('#archive');
  $('#archiveList').replaceChildren(...past.map(row));
  arch.hidden = !past.length;
  $('#archiveTitle').textContent = `Past hackathons (${past.length})`;
}

function clearFilters() {
  Object.assign(state, { q: '', status: '', platform: '', soon: false });
  $('#q').value = '';
  $('#fStatus').value = '';
  $('#fPlatform').value = '';
  $('#fSoon').checked = false;
  render();
}

async function load() {
  try {
    state.items = await store.list();
    render();
  } catch (err) {
    $('#list').replaceChildren(el('li', { class: 'empty' },
      el('h2', {}, 'Could not load your shelf'),
      el('p', {}, err.message),
      el('button', { class: 'btn', type: 'button', onclick: load }, 'Try again')));
  }
}

/* ---------- Add / edit dialog ---------- */
const dlg = $('#dlg'), form = $('#form');
function openDialog(item, prefill = {}) {
  state.editing = item ? item.id : null;
  form.reset();
  form.querySelectorAll('.err').forEach(e => e.textContent = '');
  $('#dlgTitle').textContent = item ? 'Edit hackathon' : 'Add hackathon';
  const v = item ? { ...item, tags: (item.tags || []).join(', ') } : { status: 'interested', platform: 'Other', ...prefill };
  for (const [k, val] of Object.entries(v)) {
    if (form.elements[k] && val != null) form.elements[k].value = val;
  }
  dlg.showModal();
  if (!item) form.elements.url.focus();
}

form.elements.url.addEventListener('input', e => {
  if (!state.editing) form.elements.platform.value = platformFromUrl(e.target.value);
});
$('#cancel').addEventListener('click', () => dlg.close());

form.addEventListener('submit', async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form));
  const errs = {};
  const name = (f.name || '').trim();
  if (!name) errs.name = 'Enter the hackathon name.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.deadline || '')) errs.deadline = 'Pick the deadline date.';
  if (f.url && !safeUrl(f.url.trim())) errs.url = 'This is not a valid link.';
  if (f.team_chat && !safeUrl(f.team_chat.trim())) errs.team_chat = 'This is not a valid link.';
  form.querySelectorAll('.err').forEach(s => s.textContent = errs[s.dataset.for] || '');
  if (Object.keys(errs).length) return;

  const tags = [...new Set(String(f.tags || '').split(',').map(t => t.trim()).filter(Boolean))].slice(0, 6);
  const data = {
    name,
    url: safeUrl((f.url || '').trim()) || '',
    deadline: f.deadline,
    platform: f.platform,
    status: f.status,
    mode: f.mode,
    prize: (f.prize || '').trim(),
    team_members: (f.team_members || '').trim(),
    team_chat: safeUrl((f.team_chat || '').trim()) || '',
    notes: (f.notes || '').trim(),
    tags
  };
  try {
    if (state.editing) await store.update(state.editing, data);
    else await store.add(data);
    const wasNew = !state.editing;
    dlg.close();
    toast(wasNew ? 'Hackathon saved to shelf' : 'Changes saved');
    if (wasNew && window.hmConfetti) window.hmConfetti();
    await load();
  } catch (err) {
    toast(err.message, true);
  }
});

async function del(i) {
  try {
    await store.remove(i.id);
    await load();
    toast('Deleted ' + (i.name.length > 28 ? i.name.slice(0, 28) + '\u2026' : i.name), false, {
      label: 'Undo',
      fn: async () => {
        try {
          await store.add(i);
          toast('Restored');
          await load();
        } catch (err) {
          toast(err.message, true);
        }
      }
    });
  } catch (err) {
    toast(err.message, true);
  }
}

/* ---------- Backup Export & Import ---------- */
function exportData() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.items, null, 2));
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', `hackshelf-backup-${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast('Shelf exported successfully');
}

const importFileInput = $('#importFile');
if ($('#exportBtn')) $('#exportBtn').addEventListener('click', exportData);
if ($('#importBtn')) $('#importBtn').addEventListener('click', () => importFileInput.click());

if (importFileInput) {
  importFileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const parsed = JSON.parse(event.target.result);
        await store.importAll(parsed);
        toast('Hackathons imported successfully');
        await load();
      } catch (err) {
        toast('Import failed: ' + err.message, true);
      }
    };
    reader.readAsText(file);
    importFileInput.value = '';
  });
}

/* ---------- Init ---------- */
const bmBtn = $('#bookmarkletBtn');
const bmDlg = $('#bmDlg');
const bmClose = $('#bmClose');
const bmLink = $('#bmLink');

if (bmBtn && bmDlg) {
  // Construct bookmarklet URL dynamically based on current origin/path
  const appUrl = window.location.href.split('?')[0];
  const bmCode = "javascript:(function(){var u=encodeURIComponent(location.href);var t=encodeURIComponent(document.title.replace(/\\s*[-|•].*$/,'').trim());window.open('" + appUrl + "?url='+u+'&name='+t,'_blank');})();";
  if (bmLink) {
    bmLink.setAttribute('href', bmCode);
    bmLink.addEventListener('click', e => {
      e.preventDefault();
      toast('Drag this button directly to your bookmarks bar!');
    });
  }
  bmBtn.addEventListener('click', () => bmDlg.showModal());
  if (bmClose) bmClose.addEventListener('click', () => bmDlg.close());
}

function fillSelect(sel, opts, firstLabel) {
  sel.replaceChildren(...(firstLabel ? [el('option', { value: '' }, firstLabel)] : []), ...opts.map(([v, l]) => el('option', { value: v }, l)));
}
fillSelect($('#fStatus'), STATUSES, 'All statuses');
fillSelect($('#fPlatform'), PLATFORMS.map(p => [p, p]), 'All platforms');
fillSelect(form.elements.status, STATUSES);
fillSelect(form.elements.platform, PLATFORMS.map(p => [p, p]));

$('#addBtn').addEventListener('click', () => openDialog());
$('#q').addEventListener('input', e => { state.q = e.target.value.trim().toLowerCase(); render(); });
$('#fStatus').addEventListener('change', e => { state.status = e.target.value; render(); });
$('#fPlatform').addEventListener('change', e => { state.platform = e.target.value; render(); });
$('#fSoon').addEventListener('change', e => {
  state.soon = e.target.checked;
  const pill = $('#soonPill');
  if (pill) pill.classList.toggle('active', e.target.checked);
  render();
});

// quick deadline buttons
const pad = n => String(n).padStart(2, '0');
[['Today', 0], ['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]].forEach(([label, n]) => $('#quick').append(
  el('button', { type: 'button', onclick: () => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    form.elements.deadline.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } }, label)));

// keyboard: / focuses search, n adds a hackathon
document.addEventListener('keydown', e => {
  if (dlg.open || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === '/') { e.preventDefault(); $('#q').focus(); }
  else if (e.key === 'n') { e.preventDefault(); openDialog(); }
});

// Network status listeners
window.addEventListener('offline', () => {
  toast('You are offline. Hackshelf continues to save your work locally.');
});
window.addEventListener('online', () => {
  toast('Internet connection restored.');
});

// Link mobile tools buttons to existing desktop actions
const mBmBtn = $('#mBmBtn');
const mExpBtn = $('#mExpBtn');
const mImpBtn = $('#mImpBtn');
if (mBmBtn) mBmBtn.addEventListener('click', () => { if (bmDlg) bmDlg.showModal(); });
if (mExpBtn) mExpBtn.addEventListener('click', exportData);
if (mImpBtn) mImpBtn.addEventListener('click', () => { if (importFileInput) importFileInput.click(); });

load().then(() => {
  // Bookmarklet support: app.html?url=...&name=... opens the form pre-filled
  const p = new URLSearchParams(location.search);
  if (p.get('url') || p.get('name')) {
    const u = p.get('url') || '';
    openDialog(null, { url: u, name: (p.get('name') || '').slice(0, 120), platform: platformFromUrl(u) });
    history.replaceState(null, '', location.pathname);
  }
});
})();