/* THE CORE — living dashboard client
   - fetches ./status/agents.json + ./status/board.json with cache-busting (?t=Date.now())
   - Persian / RTL rendering, Tehran clock
   - light canvas FX: 30fps cap, paused when tab hidden, skipped under prefers-reduced-motion
*/
'use strict';

const TZ = 'Asia/Tehran';
const POLL_MS = 15000;
const FX_FPS_MS = 1000 / 30; // hard 30fps ceiling

const $ = (sel) => document.querySelector(sel);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------------- time helpers (Tehran, latin digits) ---------------- */
const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
});
const dateFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
});
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
});
const relFmt = new Intl.RelativeTimeFormat('fa', { numeric: 'auto' });

function clockTick() {
  const now = new Date();
  const el = $('#clock');
  if (el) el.textContent = timeFmt.format(now) + ' IRST';
}

function relTime(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'نامشخص';
  const diff = (t - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 45) return 'همین حالا';
  if (abs < 3600) return relFmt.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return relFmt.format(Math.round(diff / 3600), 'hour');
  return relFmt.format(Math.round(diff / 86400), 'day');
}

function safeText(v) {
  return (v === null || v === undefined || v === '') ? '—' : String(v);
}

/* ---------------- fetch with cache-busting ---------------- */
async function loadJSON(path) {
  const url = path + '?t=' + Date.now();
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(path + ' → HTTP ' + res.status);
  return res.json();
}

/* ---------------- render: agents ---------------- */
const STATUS_LABEL = { online: 'آنلاین', booting: 'در حال راه‌اندازی', offline: 'آفلاین' };

function statusClass(status) {
  const s = String(status || '').toLowerCase();
  return (s === 'online' || s === 'booting' || s === 'offline') ? s : 'unknown';
}

let everAgents = false, everMissions = false;

function renderAgents(data) {
  everAgents = true;
  const list = (Array.isArray(data.agents) ? data.agents : []).filter((a) => a && typeof a === 'object');
  const box = $('#agents');
  const empty = $('#agents-empty');
  if (!box) return;
  box.textContent = '';

  $('#agents-count').textContent = list.length ? list.length + ' UNIT' : '';

  if (!list.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const frag = document.createDocumentFragment();

  list.forEach((a, i) => {
    const st = statusClass(a.status);
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('role', 'listitem');
    card.dataset.status = st;

    const top = document.createElement('div');
    top.className = 'top';

    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = String(i + 1).padStart(2, '0');

    const nameWrap = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = safeText(a.fa || a.name);
    const role = document.createElement('div');
    role.className = 'role';
    role.textContent = safeText(a.role);
    nameWrap.append(name, role);

    const badge = document.createElement('span');
    badge.className = 'badge ' + st;
    badge.textContent = STATUS_LABEL[st] || 'نامشخص';

    top.append(avatar, nameWrap, badge);

    const dl = document.createElement('dl');

    const dtBeat = document.createElement('dt');
    dtBeat.textContent = 'آخرین بیت';
    const ddBeat = document.createElement('dd');
    ddBeat.className = 'beat';
    if (a.last_beat) {
      const t = Date.parse(a.last_beat);
      ddBeat.textContent = Number.isNaN(t) ? String(a.last_beat) : dateTimeFmt.format(new Date(t));
      const ago = document.createElement('span');
      ago.className = 'ago';
      ago.textContent = '— ' + relTime(a.last_beat);
      ddBeat.append(ago);
    } else {
      ddBeat.textContent = '—';
    }

    const dtDuty = document.createElement('dt');
    dtDuty.textContent = 'وظیفه';
    const ddDuty = document.createElement('dd');
    ddDuty.textContent = safeText(a.duty);

    dl.append(dtBeat, ddBeat, dtDuty, ddDuty);
    card.append(top, dl);
    frag.append(card);
  });

  box.append(frag);
}

/* ---------------- render: missions ---------------- */
const MISSION_LABEL = {
  todo: 'انجام‌نشده', in_progress: 'در حال انجام', done: 'بسته‌شده', blocked: 'مسدود'
};

function missionClass(status) {
  const s = String(status || '').toLowerCase();
  return (s === 'todo' || s === 'in_progress' || s === 'done' || s === 'blocked') ? s : 'unknown';
}

/* returns a safe href, or null when the evidence entry is not a link.
   Evidence may be a real URL/path OR a plain fact like "job_id=…"/"cron:…".
   Rejects foreign schemes (cron:, javascript:, …), key=value facts, anything with spaces. */
function linkTarget(u) {
  let s = String(u == null ? '' : u).trim();
  if (!s) return null;
  // lab fix: prefixed evidence — "live:https://…", "url:…", "link:…" → unwrap the value
  const pref = s.match(/^(?:live|url|link)\s*:\s*(.+)$/i);
  if (pref) s = pref[1].trim();
  // lab fix: "commit:<sha>" → THE CORE repo commit page
  const cm = s.match(/^commit\s*:\s*([0-9a-f]{7,40})$/i);
  if (cm) return 'https://github.com/abwlfdlddrwyshyangylys-stack/TheCore/commit/' + cm[1];
  if (s.startsWith('//')) return null;              // protocol-relative → skip
  const m = s.match(/^([a-z][a-z0-9+.\-]*):/i);     // explicit scheme:
  if (m) return ['http', 'https'].indexOf(m[1].toLowerCase()) >= 0 ? s : null;
  if (/\s|=/.test(s)) return null;                  // "job_id=…", "schedule=0 4 * * *" → not links
  if (s.startsWith('./') || s.startsWith('../')) return s;
  if (/^https?:\/\//i.test(s)) return s;             // bare URL without scheme → not guessed
  return null;                                       // paths on disk / file names → plain text (404 on Pages)
}

function renderMissions(data) {
  everMissions = true;
  const list = (Array.isArray(data.missions) ? data.missions : []).filter((x) => x && typeof x === 'object');
  const box = $('#missions');
  const empty = $('#missions-empty');
  if (!box) return;
  box.textContent = '';

  $('#missions-count').textContent = list.length ? list.length + ' MISSION' : '';

  if (!list.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const frag = document.createDocumentFragment();

  list.forEach((m) => {
    const st = missionClass(m.status);
    const li = document.createElement('li');
    li.className = 'mission';
    li.setAttribute('role', 'listitem');
    li.dataset.status = st;

    const head = document.createElement('div');
    head.className = 'mhead';

    const mid = document.createElement('span');
    mid.className = 'mid';
    mid.textContent = safeText(m.id);

    const title = document.createElement('span');
    title.className = 'mtitle';
    title.textContent = safeText(m.title);

    const badge = document.createElement('span');
    badge.className = 'st';
    badge.dataset.s = st;
    badge.textContent = MISSION_LABEL[st] || 'نامشخص';

    head.append(mid, title, badge);

    const meta = document.createElement('div');
    meta.className = 'mmeta';

    const who = document.createElement('span');
    who.innerHTML = 'مسوول: <b></b>';
    who.querySelector('b').textContent = safeText(m.agent);

    const created = document.createElement('span');
    let createdTxt = '';
    if (m.created) {
      const ct = Date.parse(m.created);
      createdTxt = Number.isNaN(ct) ? String(m.created) : dateFmt.format(new Date(ct));
    }
    created.textContent = 'ایجاد: ' + (createdTxt || '—');

    meta.append(who, created);

    /* evidence — clickable list, DOM-built (no innerHTML for untrusted URLs) */
    const evi = document.createElement('div');
    evi.className = 'evi';

    const lab = document.createElement('div');
    lab.className = 'elab';
    lab.textContent = 'اثبات‌ها (evidence)';
    evi.append(lab);

    const ev = Array.isArray(m.evidence) ? m.evidence : [];
    if (!ev.length) {
      const none = document.createElement('div');
      none.className = 'noevi';
      none.textContent = 'هنوز شاهدی ثبت نشده است.';
      evi.append(none);
    } else {
      const ul = document.createElement('ul');
      ev.forEach((item) => {
        const liE = document.createElement('li');
        const raw = typeof item === 'string' ? item : (item && (item.url || item.href || item.path)) || '';
        const label = (item && (item.label || item.title)) || raw || '—';
        const href = linkTarget(raw);
        if (href) {
          const a = document.createElement('a');
          a.href = href;
          a.textContent = label;
          if (/^https?:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
          liE.append(a);
        } else {
          const span = document.createElement('span');
          span.className = 'plain-evi';
          span.textContent = label; // non-linkable evidence (e.g. "cron:…") shown as text
          liE.append(span);
        }
        ul.append(liE);
      });
      evi.append(ul);
    }

    li.append(head, meta, evi);
    frag.append(li);
  });

  box.append(frag);
}

/* ---------------- health + last-updated ---------------- */
let lastFetchAt = 0;
let lastStamp = ''; // source `updated` from JSON, kept across freshness ticks

function setHealth(state, text) {
  const h = $('#health');
  if (h) h.dataset.state = state;
  const t = $('#health-text');
  if (t) t.textContent = text;
}

function setUpdated() {
  const el = $('#last-updated');
  if (!el) return;
  if (!lastFetchAt) { el.textContent = '—'; return; }
  const src = lastStamp && !Number.isNaN(Date.parse(lastStamp))
    ? dateTimeFmt.format(new Date(Date.parse(lastStamp))) : '—';
  const ago = relTime(new Date(lastFetchAt).toISOString());
  el.textContent = src + '  ·  دریافت: ' + ago;
}

function showError(err) {
  const box = $('#error');
  if (box) {
    box.hidden = false;
    box.textContent = 'خطا در دریافت داده: ' + (err && err.message ? err.message : err);
  }
  setHealth('err', 'خطا در داده');
}

function clearError() {
  const box = $('#error');
  if (box) { box.hidden = true; box.textContent = ''; }
}

/* ---------------- boot line ---------------- */
function bootLine(text, animate) {
  const el = $('#bootline');
  if (!el) return;
  if (!animate) { el.textContent = text; return; }
  el.textContent = '';
  let i = 0;
  const timer = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) clearInterval(timer);
  }, 26);
}

/* ---------------- main load cycle ---------------- */
let inFlight = false;

async function refresh(manual) {
  if (inFlight && !manual) return;      // lab fix: no overlapping polls
  inFlight = true;
  const btn = $('#btn-refresh');
  if (btn) btn.disabled = true;
  if (manual) setHealth('boot', 'در حال بازخوانی…');

  try {
    const [agentsData, boardData] = await Promise.all([
      loadJSON('./status/agents.json'),
      loadJSON('./status/board.json')
    ]);

    renderAgents(agentsData);
    renderMissions(boardData);
    lastFetchAt = Date.now();
    clearError();

    lastStamp = boardData.updated || agentsData.updated || lastStamp;
    setUpdated();

    const online = (agentsData.agents || []).filter((a) => a.status === 'online').length;
    const total = (agentsData.agents || []).length;
    setHealth('ok', 'هسته فعال — ' + online + '/' + total + ' آنلاین');
  } catch (err) {
    showError(err);
    // lab fix: first-load failure must surface the empty-state messages (never raw blank panels)
    if (!everAgents) { const e = $('#agents-empty'); if (e) e.hidden = false; }
    if (!everMissions) { const e = $('#missions-empty'); if (e) e.hidden = false; }
  } finally {
    inFlight = false;
    if (btn) btn.disabled = false;
  }
}

/* ---------------- light canvas FX (30fps cap) ---------------- */
function initFX() {
  const canvas = document.getElementById('fx');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w = 0, h = 0, dpr = 1;
  const COUNT = 42;                       // few particles = cheap
  const colors = ['rgba(45,226,255,', 'rgba(255,46,154,', 'rgba(61,255,158,'];
  const parts = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5); // cap DPR
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed(p, randomY) {
    p.x = Math.random() * w;
    p.y = randomY ? Math.random() * h : h + Math.random() * 60;
    p.v = 0.18 + Math.random() * 0.55;    // slow drift, px/frame
    p.r = 0.7 + Math.random() * 1.6;
    p.a = 0.10 + Math.random() * 0.35;
    p.c = colors[(Math.random() * colors.length) | 0];
  }

  function drawFrame() {
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      ctx.beginPath();
      ctx.fillStyle = p.c + p.a + ')';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      if (!reduceMotion.matches) {
        p.y -= p.v;
        if (p.y < -8) seed(p, false);
      }
    }
  }

  resize();
  for (let i = 0; i < COUNT; i++) { const p = {}; seed(p, true); parts.push(p); }

  let last = 0, raf = 0, running = false;

  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (ts - last < FX_FPS_MS) return;   // 30fps cap
    last = ts;
    drawFrame();
  }

  function start() {
    if (running) return;
    running = true;
    if (reduceMotion.matches) {
      drawFrame();                        // one static frame, no loop
      running = false;
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); drawFrame(); }, 150);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  if (typeof reduceMotion.addEventListener === 'function') {
    reduceMotion.addEventListener('change', () => {
      stop();
      start();
    });
  }

  start();
}

/* ---------------- wire up ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  clockTick();
  setInterval(clockTick, 1000);

  bootLine('CORE//init → loading status/agents.json, status/board.json …', !reduceMotion.matches);

  refresh(false);

  const btn = $('#btn-refresh');
  if (btn) btn.addEventListener('click', () => refresh(true));

  setInterval(() => { if (!document.hidden) refresh(false); }, POLL_MS);  // pause polling in hidden tab
  // keep "last updated" freshness label ticking without refetching
  setInterval(() => { if (lastFetchAt) setUpdated(); }, 5000);

  initFX();
});
