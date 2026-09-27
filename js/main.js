/* THE CORE — living dashboard client (v2: showcase + dashboard tabs, EN/FA i18n)
   - fetches ./status/agents.json + ./status/board.json with cache-busting (?t=Date.now())
   - default EN (LTR), FA switcher (RTL), Tehran clock
   - light canvas FX: 30fps cap, paused when tab hidden, skipped under prefers-reduced-motion
*/
'use strict';

const TZ = 'Asia/Tehran';
const POLL_MS = 15000;
const FX_FPS_MS = 1000 / 30; // hard 30fps ceiling

const $ = (sel) => document.querySelector(sel);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------------- i18n ---------------- */
const I18N = {
  en: {
    'skip': 'Skip to content',
    'nav.showcase': 'Showcase',
    'nav.dashboard': 'Dashboard',
    'hero.eyebrow': 'Agent operations · one screen',
    'hero.t1': 'The core of your',
    'hero.t2': 'agent team.',
    'hero.sub': 'THE CORE unites your autonomous agents, their missions and the proof behind every closure — in one living dashboard that never sleeps.',
    'hero.cta': 'Open the dashboard',
    'f1.t': 'Living roster',
    'f1.d': 'Every unit reports its beat. Online, booting or offline — you always know who is on duty.',
    'f2.t': 'Evidence-locked missions',
    'f2.d': 'A mission closes only with proof. Links, commits and job ids — every claim is verifiable.',
    'f3.t': 'Always-on health',
    'f3.d': 'The core watches itself: freshness, connectivity and status, refreshed every few seconds.',
    'dash.boot': 'Starting up…',
    'dash.updated': 'Last update',
    'dash.refresh': 'Refresh data',
    'roster.title': 'Agent roster',
    'roster.on': 'Online', 'roster.boot': 'Booting', 'roster.off': 'Offline',
    'roster.empty': 'No data received — status/agents.json',
    'board.title': 'Mission board',
    'board.todo': 'To do', 'board.prog': 'In progress', 'board.done': 'Closed', 'board.block': 'Blocked',
    'board.empty': 'No data received — status/board.json',
    'foot.charter': '“A mission closes only with proof.”',
    'foot.meta': 'Static living dashboard — data: status/agents.json + status/board.json',
    /* dynamic */
    'st.online': 'Online', 'st.booting': 'Booting', 'st.offline': 'Offline', 'st.unknown': 'Unknown',
    'm.todo': 'To do', 'm.in_progress': 'In progress', 'm.done': 'Closed', 'm.blocked': 'Blocked', 'm.unknown': 'Unknown',
    'd.beat': 'Last beat', 'd.duty': 'Duty',
    'd.evidence': 'Evidence', 'd.noEvidence': 'No evidence recorded yet.',
    'd.owner': 'Owner: ', 'd.created': 'Created: ',
    'd.now': 'just now', 'd.unknown': 'unknown',
    'd.err': 'Data fetch failed: ',
    'd.healthErr': 'Data error',
    'd.refreshing': 'Refreshing…',
    'd.fetched': 'fetched: '
  },
  fa: {
    'skip': 'پرش به محتوا',
    'nav.showcase': 'ویترین',
    'nav.dashboard': 'داشبورد',
    'hero.eyebrow': 'عملیات ایجنت‌ها · یک صفحه',
    'hero.t1': 'هستهٔ',
    'hero.t2': 'تیم ایجنت‌هات.',
    'hero.sub': 'THE CORE ایجنت‌های خودگردان، ماموریت‌ها و شاهدِ پشت هر بسته‌شدن را در یک داشبورد زنده که هیچ‌وقت نمی‌خوابد، کنار هم می‌آورد.',
    'hero.cta': 'ورود به داشبورد',
    'f1.t': 'ترکیب زنده',
    'f1.d': 'هر واحد بیتش را گزارش می‌کند. آنلاین، در حال راه‌اندازی یا آفلاین — همیشه می‌دانی کی سرپسته.',
    'f2.t': 'ماموریت‌های قفل‌شده به شاهد',
    'f2.d': 'ماموریت فقط با اثبات بسته می‌شود. لینک، کامیت و شناسهٔ کارها — هر ادعایی قابل راستی‌آزمایی است.',
    'f3.t': 'سلامت همیشه‌روشن',
    'f3.d': 'هسته خودش را می‌پاید: تازگی، اتصال و وضعیت، هر چند ثانیه یک‌بار.',
    'dash.boot': 'در حال راه‌اندازی…',
    'dash.updated': 'آخرین به‌روزرسانی',
    'dash.refresh': 'بازخوانی داده',
    'roster.title': 'ترکیب ایجنت‌ها',
    'roster.on': 'آنلاین', 'roster.boot': 'در حال راه‌اندازی', 'roster.off': 'آفلاین',
    'roster.empty': 'داده‌ای دریافت نشد — status/agents.json',
    'board.title': 'بورد ماموریت‌ها',
    'board.todo': 'انجام‌نشده', 'board.prog': 'در حال انجام', 'board.done': 'بسته‌شده', 'board.block': 'مسدود',
    'board.empty': 'داده‌ای دریافت نشد — status/board.json',
    'foot.charter': '«هر ماموریت فقط با اثبات بسته می‌شه»',
    'foot.meta': 'داشبورد زندهٔ ایستا — داده: status/agents.json + status/board.json',
    /* dynamic */
    'st.online': 'آنلاین', 'st.booting': 'در حال راه‌اندازی', 'st.offline': 'آفلاین', 'st.unknown': 'نامشخص',
    'm.todo': 'انجام‌نشده', 'm.in_progress': 'در حال انجام', 'm.done': 'بسته‌شده', 'm.blocked': 'مسدود', 'm.unknown': 'نامشخص',
    'd.beat': 'آخرین بیت', 'd.duty': 'وظیفه',
    'd.evidence': 'اثبات‌ها (evidence)', 'd.noEvidence': 'هنوز شاهدی ثبت نشده است.',
    'd.owner': 'مسوول: ', 'd.created': 'ایجاد: ',
    'd.now': 'همین حالا', 'd.unknown': 'نامشخص',
    'd.err': 'خطا در دریافت داده: ',
    'd.healthErr': 'خطا در داده',
    'd.refreshing': 'در حال بازخوانی…',
    'd.fetched': 'دریافت: '
  }
};

let lang = 'en';
try { const s = localStorage.getItem('core-lang'); if (s === 'fa' || s === 'en') lang = s; } catch (e) { /* ignore */ }

function tr(k) {
  const t = I18N[lang];
  return (t && t[k] != null) ? t[k] : (I18N.en[k] != null ? I18N.en[k] : k);
}

function applyStaticI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = tr(el.getAttribute('data-i18n'));
  });
}

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

function relTime(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return tr('d.unknown');
  const diff = (t - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 45) return tr('d.now');
  const rtf = new Intl.RelativeTimeFormat(lang === 'fa' ? 'fa' : 'en', { numeric: 'auto' });
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
}

function clockTick() {
  const el = $('#clock');
  if (el) el.textContent = timeFmt.format(new Date()) + ' IRST';
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
function statusClass(status) {
  const s = String(status || '').toLowerCase();
  return (s === 'online' || s === 'booting' || s === 'offline') ? s : 'unknown';
}

let everAgents = false, everMissions = false;
let lastAgents = null, lastBoard = null;

function renderAgents(data) {
  everAgents = true;
  lastAgents = data;
  const list = (Array.isArray(data.agents) ? data.agents : []).filter((a) => a && typeof a === 'object');
  const box = $('#agents');
  const empty = $('#agents-empty');
  if (!box) return;
  box.textContent = '';

  $('#agents-count').textContent = list.length ? list.length + (lang === 'fa' ? ' ایجنت' : ' UNIT') : '';

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
    name.textContent = safeText(lang === 'fa' ? (a.fa || a.name) : (a.name || a.fa));
    const role = document.createElement('div');
    role.className = 'role';
    role.textContent = safeText(a.role);
    nameWrap.append(name, role);

    const badge = document.createElement('span');
    badge.className = 'badge ' + st;
    badge.textContent = tr('st.' + st);

    top.append(avatar, nameWrap, badge);

    const dl = document.createElement('dl');

    const dtBeat = document.createElement('dt');
    dtBeat.textContent = tr('d.beat');
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
    dtDuty.textContent = tr('d.duty');
    const ddDuty = document.createElement('dd');
    ddDuty.textContent = safeText(a.duty);

    dl.append(dtBeat, ddBeat, dtDuty, ddDuty);
    card.append(top, dl);
    frag.append(card);
  });

  box.append(frag);
}

/* ---------------- render: missions ---------------- */
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
  const pref = s.match(/^(?:live|url|link)\s*:\s*(.+)$/i);
  if (pref) s = pref[1].trim();
  const cm = s.match(/^commit\s*:\s*([0-9a-f]{7,40})$/i);
  if (cm) return 'https://github.com/abwlfdlddrwyshyangylys-stack/TheCore/commit/' + cm[1];
  if (s.startsWith('//')) return null;
  const m = s.match(/^([a-z][a-z0-9+.\-]*):/i);
  if (m) return ['http', 'https'].indexOf(m[1].toLowerCase()) >= 0 ? s : null;
  if (/[\s|=]/.test(s)) return null;
  if (s.startsWith('./') || s.startsWith('../')) return s;
  if (/^https?:\/\//i.test(s)) return s;
  return null;
}

function renderMissions(data) {
  everMissions = true;
  lastBoard = data;
  const list = (Array.isArray(data.missions) ? data.missions : []).filter((x) => x && typeof x === 'object');
  const box = $('#missions');
  const empty = $('#missions-empty');
  if (!box) return;
  box.textContent = '';

  $('#missions-count').textContent = list.length ? list.length + (lang === 'fa' ? ' ماموریت' : ' MISSION') : '';

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
    badge.textContent = tr('m.' + st);

    head.append(mid, title, badge);

    const meta = document.createElement('div');
    meta.className = 'mmeta';

    const who = document.createElement('span');
    who.append(tr('d.owner'));
    const whoB = document.createElement('b');
    whoB.textContent = safeText(m.agent);
    who.append(whoB);

    const created = document.createElement('span');
    let createdTxt = '';
    if (m.created) {
      const ct = Date.parse(m.created);
      createdTxt = Number.isNaN(ct) ? String(m.created) : dateFmt.format(new Date(ct));
    }
    created.textContent = tr('d.created') + (createdTxt || '—');

    meta.append(who, created);

    /* evidence — clickable list, DOM-built (no innerHTML for untrusted URLs) */
    const evi = document.createElement('div');
    evi.className = 'evi';

    const lab = document.createElement('div');
    lab.className = 'elab';
    lab.textContent = tr('d.evidence');
    evi.append(lab);

    const ev = Array.isArray(m.evidence) ? m.evidence : [];
    if (!ev.length) {
      const none = document.createElement('div');
      none.className = 'noevi';
      none.textContent = tr('d.noEvidence');
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
          span.textContent = label;
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
let lastStamp = '';
let lastHealthState = 'boot';
let lastOnline = null, lastTotal = null;

function healthText(state, online, total) {
  if (state === 'ok') {
    return lang === 'fa'
      ? 'هسته فعال — ' + online + '/' + total + ' آنلاین'
      : 'Core active — ' + online + '/' + total + ' online';
  }
  if (state === 'err') return tr('d.healthErr');
  if (state === 'refresh') return tr('d.refreshing');
  return tr('dash.boot');
}

function setHealth(state, text) {
  lastHealthState = state;
  const h = $('#health');
  if (h) h.dataset.state = state === 'refresh' ? 'boot' : state;
  const t = $('#health-text');
  if (t) t.textContent = text;
}

function reapplyHealth() {
  if (lastHealthState === 'ok' && lastOnline !== null) {
    setHealth('ok', healthText('ok', lastOnline, lastTotal));
  } else if (lastHealthState === 'err') {
    setHealth('err', tr('d.healthErr'));
  } else {
    setHealth('boot', tr('dash.boot'));
  }
}

function setUpdated() {
  const el = $('#last-updated');
  if (!el) return;
  if (!lastFetchAt) { el.textContent = '—'; return; }
  const src = lastStamp && !Number.isNaN(Date.parse(lastStamp))
    ? dateTimeFmt.format(new Date(Date.parse(lastStamp))) : '—';
  const ago = relTime(new Date(lastFetchAt).toISOString());
  el.textContent = src + '  ·  ' + tr('d.fetched') + ago;
}

function showError(err) {
  const box = $('#error');
  if (box) {
    box.hidden = false;
    box.textContent = tr('d.err') + (err && err.message ? err.message : err);
  }
  setHealth('err', tr('d.healthErr'));
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
  if (inFlight && !manual) return;
  inFlight = true;
  const btn = $('#btn-refresh');
  if (btn) btn.disabled = true;
  if (manual) setHealth('refresh', tr('d.refreshing'));

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
    lastOnline = online; lastTotal = total;
    setHealth('ok', healthText('ok', online, total));
  } catch (err) {
    showError(err);
    if (!everAgents) { const e = $('#agents-empty'); if (e) e.hidden = false; }
    if (!everMissions) { const e = $('#missions-empty'); if (e) e.hidden = false; }
  } finally {
    inFlight = false;
    if (btn) btn.disabled = false;
  }
}

/* ---------------- tabs ---------------- */
function switchTab(name) {
  const showcase = $('#showcase');
  const dashboard = $('#dashboard');
  if (!showcase || !dashboard) return;
  const isDash = name === 'dashboard';
  showcase.hidden = isDash;
  dashboard.hidden = !isDash;

  const tS = $('#tab-showcase'), tD = $('#tab-dashboard');
  if (tS) { tS.classList.toggle('is-active', !isDash); tS.setAttribute('aria-selected', String(!isDash)); }
  if (tD) { tD.classList.toggle('is-active', isDash); tD.setAttribute('aria-selected', String(isDash)); }

  if (isDash && !lastAgents && !inFlight) refresh(false); // lazy first load if user jumps straight in
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
}

/* ---------------- language ---------------- */
function setLang(l) {
  lang = (l === 'fa') ? 'fa' : 'en';
  try { localStorage.setItem('core-lang', lang); } catch (e) { /* ignore */ }

  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.title = lang === 'fa' ? 'هسته — THE CORE' : 'THE CORE';

  document.querySelectorAll('.langbtn').forEach((b) => {
    b.classList.toggle('is-active', b.getAttribute('data-lang') === lang);
  });

  applyStaticI18n();
  if (lastAgents) renderAgents(lastAgents); else {
    const c = $('#agents-count'); if (c) c.textContent = '';
  }
  if (lastBoard) renderMissions(lastBoard); else {
    const c = $('#missions-count'); if (c) c.textContent = '';
  }
  reapplyHealth();
  setUpdated();
  if (!everAgents) {
    const a = $('#agents-empty'); if (a && !a.hidden) a.textContent = tr('roster.empty');
    const m = $('#missions-empty'); if (m && !m.hidden) m.textContent = tr('board.empty');
  }
}

/* ---------------- light canvas FX (30fps cap) — gold light ---------------- */
function initFX() {
  const canvas = document.getElementById('fx');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w = 0, h = 0, dpr = 1;
  const COUNT = 34;
  const colors = ['rgba(245,185,66,', 'rgba(255,207,112,', 'rgba(255,233,179,'];
  const parts = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed(p, randomY) {
    p.x = Math.random() * w;
    p.y = randomY ? Math.random() * h : h + Math.random() * 60;
    p.v = 0.15 + Math.random() * 0.45;
    p.r = 0.6 + Math.random() * 1.5;
    p.a = 0.08 + Math.random() * 0.30;
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
    if (ts - last < FX_FPS_MS) return;
    last = ts;
    drawFrame();
  }

  function start() {
    if (running) return;
    running = true;
    if (reduceMotion.matches) {
      drawFrame();
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
    reduceMotion.addEventListener('change', () => { stop(); start(); });
  }

  start();
}

/* ---------------- wire up ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  /* language first, so static labels render in the right tongue */
  setLang(lang);

  clockTick();
  setInterval(clockTick, 1000);

  bootLine('CORE//init → loading status/agents.json, status/board.json …', !reduceMotion.matches);

  refresh(false);

  const btn = $('#btn-refresh');
  if (btn) btn.addEventListener('click', () => refresh(true));

  document.querySelectorAll('.tab').forEach((t) => {
    t.addEventListener('click', () => switchTab(t.getAttribute('data-tab')));
  });
  const cta = $('#cta-dashboard');
  if (cta) cta.addEventListener('click', () => switchTab('dashboard'));
  const brand = $('#brand');
  if (brand) brand.addEventListener('click', (e) => { e.preventDefault(); switchTab('showcase'); });
  document.querySelectorAll('.langbtn').forEach((b) => {
    b.addEventListener('click', () => setLang(b.getAttribute('data-lang')));
  });

  setInterval(() => { if (!document.hidden) refresh(false); }, POLL_MS);
  setInterval(() => { if (lastFetchAt) setUpdated(); }, 5000);

  initFX();
});
