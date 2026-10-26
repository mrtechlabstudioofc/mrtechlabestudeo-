const B = () => (window.AURA_CFG && window.AURA_CFG.name) || 'MR Techlabe Studio';
const ACC = () => getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#e11d2e';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const A = s => Array.from(s), rnd = n => Math.floor(Math.random() * n), pick = a => a[rnd(a.length)];

function toast(m) {
  const t = $('#toast');
  t.innerHTML = `<div class="ti">${ic('check')}</div><div><b></b><span></span></div>`;
  t.querySelector('b').textContent = m;
  t.querySelector('span').textContent = B();
  t.classList.remove('show');
  void t.offsetWidth;
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), 2000);
}

async function copy(x) {
  try {
    await navigator.clipboard.writeText(x);
  } catch (e) {
    const a = document.createElement('textarea');
    a.value = x;
    document.body.appendChild(a);
    a.select();
    document.execCommand('copy');
    a.remove();
  }
  toast('Copied');
}

const ic = n => `<svg class="i"><use href="#i-${n}"/></svg>`;

/* =====================================================================
   MR TECHLAB — PRO + ADS  (shares login, Pro status and ad units with the main app)
   Everything you may want to tune is in the MT object below.
   ===================================================================== */
const MT = {
  AD_TAPS: 1,                // ad taps before the action runs (1 = tap 1 opens the ad, tap 2 copies)
  SECTION_UNLOCK_MIN: 10,    // letter / symbol tiles: one ad tap unlocks that whole section for N minutes (0 = every tile needs its own ad tap)
  AD_TTL_MIN: 30,            // an ad tap stays valid this long
  FEED_ADS: [5, 15, 30, 45], // show an in-feed ad after this many cards (Auto + Generator tabs)
  SMARTLINK: 'https://www.profitableratecpmnetwork.com/khhb0sxa?key=a5b50548384953d1a4866f2b52283023',
  AD_300: '43c3fd7befc662a9e6392fec3dd3b7ce',   // 300x250 unit
  CACHE_KEY: 'mt_pro_v1',    // same key as the main app, so Pro carries over instantly
  PRO_URL: '../subscription.html'
};

/* ---------- which items are Pro-only ---------- */
const FREE_BASE = new Set(['Normal', 'UPPER', 'lower', 'aLt CaPs', 'Small Caps', 'Mixed Small Caps', 'Cap+Small', 'Random Mix', 'Leet', 'Tiny', 'Cap+Tiny', 'Upper+Tiny', 'Small+Upper', 'Tiny+Small']);
const FREE_SEPS = new Set(['Dots', 'Dashes', 'Lines', 'Bullets', 'Stars']);
function isPremiumStyle(n) {
  n = n || '';
  if (FREE_BASE.has(n)) return false;
  for (const sp of FREE_SEPS) { const i = n.lastIndexOf(' ' + sp); if (i > 0 && i === n.length - sp.length - 1 && FREE_BASE.has(n.slice(0, i))) return false; }
  return true;   // fancy separators (Stars, Star Cut, Open Star, Tsu), math / circled / canadian / kawaii styles, extra styles
}
const FREE_SETS = new Set(['Stars, flowers & hearts', 'Classic', 'Brackets', 'Crowns & stars', 'Small caps', 'Superscript']);
const isPremiumSet = (k, fold) => !!fold || !FREE_SETS.has(k);

/* ---------- Pro status ---------- */
const PROST = { until: 0, plan: '', loaded: false };
const proCached = () => { try { const o = JSON.parse(localStorage.getItem(MT.CACHE_KEY) || 'null'); return !!(o && o.until > Date.now()); } catch (e) { return false; } };
const isPro = () => PROST.until > Date.now();
const proNow = () => isPro() || (!PROST.loaded && proCached());
function setProFlag(on) {
  window.__MT_PRO = !!on;
  document.documentElement.classList.toggle('is-pro', !!on);
  if (window.MtTheme) window.MtTheme.refresh();   /* Pro members get their chosen Pro colour back */
}
function paintAvatar(user, photo) {
  const a = document.getElementById('mtAv');
  if (!a || !user) return;
  const url = /^https?:\/\//i.test(photo || '') ? photo : (/^https?:\/\//i.test(user.photoURL || '') ? user.photoURL : '');
  const letter = ((user.displayName || user.email || '?').trim().charAt(0) || '?').toUpperCase();
  if (!url) { a.textContent = letter; return; }
  a.textContent = '';
  const im = document.createElement('img');
  im.alt = ''; im.referrerPolicy = 'no-referrer'; im.src = url;
  im.onerror = () => { a.textContent = letter; };
  a.appendChild(im);
}

(async function initPro() {
  setProFlag(proCached());
  try {
    const cfg = (await import('../app.js')).firebaseConfig;
    const V = 'https://www.gstatic.com/firebasejs/10.13.0/';
    const [A0, A1, A2] = await Promise.all([import(V + 'firebase-app.js'), import(V + 'firebase-auth.js'), import(V + 'firebase-database.js')]);
    const app = A0.getApps().length ? A0.getApp() : A0.initializeApp(cfg);
    const db = A2.getDatabase(app);
    A1.onAuthStateChanged(A1.getAuth(app), async user => {
      if (!user) {
        PROST.until = 0; PROST.plan = ''; PROST.loaded = true;
        try { localStorage.removeItem(MT.CACHE_KEY); } catch (e) {}
        setProFlag(false); return;
      }
      try {
        const snap = await A2.get(A2.ref(db, 'users/' + user.uid + '/pro'));
        const v = snap.exists() ? (snap.val() || {}) : {};
        PROST.until = Number(v.until) || 0; PROST.plan = String(v.planName || '');
      } catch (e) {
        try { const c = JSON.parse(localStorage.getItem(MT.CACHE_KEY) || 'null'); if (c && c.uid === user.uid) { PROST.until = c.until; PROST.plan = c.plan || ''; } } catch (_) {}
      }
      let photo = '';
      try { const ps = await A2.get(A2.ref(db, 'users/' + user.uid + '/photoURL')); photo = ps.exists() ? String(ps.val() || '') : ''; } catch (e) {}
      paintAvatar(user, photo);
      PROST.loaded = true;
      try {
        if (isPro()) localStorage.setItem(MT.CACHE_KEY, JSON.stringify({ until: PROST.until, plan: PROST.plan, uid: user.uid }));
        else localStorage.removeItem(MT.CACHE_KEY);
      } catch (e) {}
      setProFlag(isPro());
    });
  } catch (e) { PROST.loaded = true; }   // Firebase unreachable: the tool still works as a free version
})();

/* ---------- ad taps (one tap opens the ad, the next tap does the action) ---------- */
const AD_KEY = 'mt_ff_ad_v1';
const adStore = {
  read() {
    try {
      const o = JSON.parse(localStorage.getItem(AD_KEY) || '{}'), now = Date.now();
      Object.keys(o).forEach(k => { if (!o[k] || o[k].ex < now) delete o[k]; });
      return o;
    } catch (e) { return adStore._m || {}; }
  },
  write(o) { adStore._m = o; try { localStorage.setItem(AD_KEY, JSON.stringify(o)); } catch (e) {} }
};
const adCount = k => (adStore.read()[k] || {}).n || 0;
function adSet(k, n, min) {
  const o = adStore.read();
  if (n > 0) o[k] = { n, ex: Date.now() + (min || MT.AD_TTL_MIN) * 60000 }; else delete o[k];
  adStore.write(o);
}
function openAd() {
  let w = null;
  try { w = window.open(MT.SMARTLINK, '_blank'); if (w) w.opener = null; } catch (e) { w = null; }
  return !!w;
}
/* gate(key, run, {lock, section}) -> true when run() executed */
function gate(key, run, o) {
  o = o || {};
  if (o.lock && !proNow()) { showPro(); return false; }
  if (proNow()) { run(); return true; }
  const sec = o.section && MT.SECTION_UNLOCK_MIN > 0 ? 'ok:' + o.section : '';
  if (sec && adCount(sec)) { run(); return true; }
  const n = adCount(key);
  if (n >= MT.AD_TAPS) {
    adSet(key, 0);
    if (sec) adSet(sec, 1, MT.SECTION_UNLOCK_MIN);
    run(); return true;
  }
  if (!openAd()) { toast('Allow pop-ups, then tap again'); return false; }
  adSet(key, n + 1);
  const left = MT.AD_TAPS - (n + 1);
  toast(left ? 'Ad opened — tap ' + left + ' more time' + (left > 1 ? 's' : '') : 'Ad opened — tap again to copy');
  return false;
}

/* ---------- Pro dialog ---------- */
function showPro() { const m = $('#proM'); if (m) { m.hidden = false; } }
function hidePro() { const m = $('#proM'); if (m) { m.hidden = true; } }
document.addEventListener('keydown', e => { if (e.key === 'Escape') hidePro(); });
(() => {
  const m = $('#proM'); if (!m) return;
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-x]')) hidePro(); });
})();

/* ---------- copy-button painting ---------- */
function paintCopy(b, key, lock) {
  b.classList.remove('done');
  b.classList.toggle('locked', !!lock);
  if (lock) {   /* free users see the PRO lock, Pro members see a normal Copy (CSS switches them) */
    b.classList.remove('armed');
    b.innerHTML = '<span class="lkv">' + ic('lock') + 'PRO</span><span class="cpv">' + ic('copy') + 'Copy</span>';
    return;
  }
  const armed = !proNow() && adCount(key) >= MT.AD_TAPS;
  b.classList.toggle('armed', armed);
  b.innerHTML = ic('copy') + (armed ? 'Tap again' : 'Copy');
}
function flashDone(b, key, lock) {
  b.classList.add('done');
  b.innerHTML = ic('check') + 'Copied';
  clearTimeout(b.t);
  b.t = setTimeout(() => paintCopy(b, key, lock), 1400);
}

/* ---------- ads ---------- */
const FEED = { out1: 0, out2: 0 };
function adIframe(h, w, key) {
  const f = document.createElement('iframe');
  f.className = 'adf'; f.width = w; f.height = h; f.scrolling = 'no'; f.setAttribute('frameborder', '0');
  f.title = 'Advertisement';
  f.srcdoc = '<!doctype html><html><body style="margin:0;background:transparent"><script>atOptions={"key":"' + key + '","format":"iframe","height":' + h + ',"width":' + w + ',"params":{}};<\/script><script src="https://www.highrevenueformat.com/' + key + '/invoke.js"><\/script></body></html>';
  return f;
}
function adBox() {
  const d = document.createElement('div');
  d.className = 'adbox';
  d.innerHTML = '<span class="adl">Sponsored</span>';
  d.appendChild(adIframe(250, 300, MT.AD_300));
  return d;
}
function feed(fr, id) {
  FEED[id]++;
  if (MT.FEED_ADS.indexOf(FEED[id]) > -1 && !proNow()) fr.appendChild(adBox());
}
/* tab ad slots (Font / Icon / Space) are filled the first time the tab opens */
function fillSlots(panel) {
  if (!panel || proNow()) return;
  panel.querySelectorAll('.adslot:empty').forEach(s => { const b = adBox(); s.appendChild(b); });
}


let K = { good: [], bad: [] };
try {
  K = JSON.parse(localStorage.getItem('ffk4') || localStorage.getItem('ffk2') || '{"good":[],"bad":[]}');
} catch (e) {}

let GS = new Set(K.good), BS = new Set(K.bad);

function saveK() {
  GS = new Set(K.good);
  BS = new Set(K.bad);
  try {
    localStorage.setItem('ffk4', JSON.stringify(K));
  } catch (e) {}
  $('#gN').textContent = K.good.length;
  $('#bN').textContent = K.bad.length;
}

function setState(ch, s) {
  K.good = K.good.filter(x => x !== ch);
  K.bad = K.bad.filter(x => x !== ch);
  if (s === 'good') K.good.push(ch);
  if (s === 'bad') K.bad.push(ch);
  saveK();
}

const smallcaps = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ';
const SAFE = new Set(A('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_.-* ')
  .concat(A(smallcaps), A('『』【】「」ツッシ★☆•㉿'),
  A('꧁꧂༒☬༺༻亗彡メミ乂么乡♛♚᭄࿐༆〆々燃◥◤❖✪✦✿༄░▒▓⊰⊱'),
  A('ᴾᴿᴼᴹᴳᵒᵈᴮᴰᴷᴵᴺᵀˢᴴᴱᴬᴸᵃᵇᶜᵉᶠᵍʰⁱʲᵏˡᵐⁿᵖʳᵗᵘᵛʷˣʸᶻᶦᶰ⁰¹²³⁴⁵⁶⁷⁸⁹')));

const isEmoji = c => (c >= 0x1F300 && c <= 0x1FAFF) || c === 0x26A1 || c === 0x2B50 || c === 0x2728 || c === 0x2705 || c === 0x274C;
function blockedAlways(c) { return c < 32 || c === 0xFE0F || c === 0x200D || c === 0x200B || (c >= 0x0300 && c <= 0x036F); }

function st(ch) {
  const c = ch.codePointAt(0);
  if (BS.has(ch)) return 'bad';
  if (GS.has(ch)) return 'good';
  if (blockedAlways(c)) return 'bad';
  if (isEmoji(c)) return 'emoji';
  if (SAFE.has(ch)) return 'safe';
  return 'extra';
}

function level(s) {
  let em = false, ex = false;
  for (const ch of A(s)) {
    const x = st(ch);
    if (x === 'bad') return 'bad';
    if (x === 'emoji') em = true;
    if (x === 'extra') ex = true;
  }
  return em ? 'emoji' : ex ? 'test' : 'ok';
}

function nlen(s) {
  const d = $('#dbl').checked;
  return A(s).reduce((n, ch) => n + ((d && ch.codePointAt(0) > 127) ? 2 : 1), 0);
}

const maxLen = () => Math.max(3, Math.min(20, parseInt($('#maxlen').value) || 12));

function allowed(s) {
  if (nlen(s) > maxLen()) return false;
  let em = false, ex = false;
  for (const ch of A(s)) {
    const x = st(ch);
    if (x === 'bad') return false;
    if (x === 'emoji') em = true;
    if (x === 'extra') ex = true;
  }
  if (em && !$('#emo').checked) return false;
  if (ex && !$('#exp').checked) return false;
  return true;
}

const UP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', LO = 'abcdefghijklmnopqrstuvwxyz', DG = '0123456789';

function mm(u, l, d, ex) {
  return c => {
    if (ex && ex[c]) return ex[c];
    let i = UP.indexOf(c);
    if (i > -1) return String.fromCodePoint(u + i);
    i = LO.indexOf(c);
    if (i > -1) return String.fromCodePoint(l + i);
    i = DG.indexOf(c);
    if (i > -1 && d) return String.fromCodePoint(d + i);
    return c;
  };
}

const SC = A(smallcaps).map((c, i) => c);
const toSC = c => { const i = LO.indexOf(c.toLowerCase()); return i > -1 ? SC[i] : c; };
const CAN = A('ᗩᗷᑕᗪᗴᖴᘜᕼIᒍKᒪᗰᑎOᑭQᖇᔕTᑌᐯᗯ᙭YZ');
const CIRC_U = A('ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ'), CIRC_L = A('ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ');
const KAW = { a: 'α', b: 'в', c: '¢', d: '∂', e: 'є', f: 'ƒ', g: 'g', h: 'н', i: 'ι', j: 'נ', k: 'к', l: 'ℓ', m: 'м', n: 'η', o: 'σ', p: 'ρ', q: 'q', r: 'я', s: 'ѕ', t: 'т', u: 'υ', v: 'ν', w: 'ω', x: 'χ', y: 'у', z: 'z' };
const SUPL = A('ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖᑫʳˢᵗᵘᵛʷˣʸᶻ');

const STYLES = [
  { n: 'Normal', f: c => c },
  { n: 'UPPER', f: c => c.toUpperCase() },
  { n: 'lower', f: c => c.toLowerCase() },
  { n: 'aLt CaPs', f: (c, i) => i % 2 ? c.toLowerCase() : c.toUpperCase() },
  { n: 'Small Caps', f: toSC },
  { n: 'Mixed Small Caps', f: (c, i) => i % 2 ? toSC(c) : c.toUpperCase() },
  { n: 'Cap+Small', f: (c, i) => c === ' ' ? c : (i === 0 ? c.toUpperCase() : toSC(c)) },
  { n: 'Random Mix', f: c => pick([c.toUpperCase(), toSC(c), c.toLowerCase()]) },
  { n: 'Leet', f: c => ({ a: '4', e: '3', i: '1', o: '0', s: '5', t: '7' })[c.toLowerCase()] || c },
  { n: 'Bold', f: mm(0x1D400, 0x1D41A, 0x1D7CE) },
  { n: 'Italic', f: mm(0x1D434, 0x1D44E, 0, { h: 'ℎ' }) },
  { n: 'Bold Italic', f: mm(0x1D468, 0x1D482, 0x1D7CE) },
  { n: 'Script', f: mm(0x1D49C, 0x1D4B6, 0, { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ', e: 'ℯ', g: 'ℊ', o: 'ℴ' }) },
  { n: 'Bold Script', f: mm(0x1D4D0, 0x1D4EA, 0x1D7CE) },
  { n: 'Double', f: mm(0x1D538, 0x1D552, 0x1D7D8, { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' }) },
  { n: 'Sans Bold', f: mm(0x1D5D4, 0x1D5EE, 0x1D7EC) },
  { n: 'Sans Italic', f: mm(0x1D608, 0x1D622, 0x1D7E2) },
  { n: 'Mono', f: mm(0x1D670, 0x1D68A, 0x1D7F6) },
  { n: 'Fullwidth', f: c => { const x = c.codePointAt(0); return x >= 33 && x <= 126 ? String.fromCodePoint(x + 0xFEE0) : c; } },
  { n: 'Superscript', f: c => { const i = LO.indexOf(c.toLowerCase()); return i > -1 ? SUPL[i] : c; } },
  { n: 'Circled', f: c => { let i = UP.indexOf(c); if (i > -1) return CIRC_U[i]; i = LO.indexOf(c); if (i > -1) return CIRC_L[i]; return c; } },
  { n: 'Canadian', f: c => { const i = UP.indexOf(c.toUpperCase()); return i > -1 ? CAN[i] : c; } },
  { n: 'Kawaii', f: c => KAW[c.toLowerCase()] || c },
];

const TINY_SAFE = A('ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖǫʳˢᵗᵘᵛʷˣʸᶻ');
const tiny = c => { const i = LO.indexOf(c.toLowerCase()); return i > -1 ? TINY_SAFE[i] : c; };

const BASES = [
  ['Normal', c => c], ['UPPER', c => c.toUpperCase()], ['lower', c => c.toLowerCase()],
  ['aLt CaPs', (c, i) => i % 2 ? c.toLowerCase() : c.toUpperCase()],
  ['Small Caps', toSC],
  ['Mixed Small Caps', (c, i) => i % 2 ? toSC(c) : c.toUpperCase()],
  ['Cap+Small', (c, i) => i === 0 ? c.toUpperCase() : toSC(c)],
  ['Tiny', tiny],
  ['Cap+Tiny', (c, i) => i === 0 ? c.toUpperCase() : tiny(c)],
  ['Upper+Tiny', (c, i) => i % 2 ? tiny(c) : c.toUpperCase()],
  ['Small+Upper', (c, i) => i % 2 ? c.toUpperCase() : toSC(c)],
  ['Tiny+Small', (c, i) => i % 2 ? toSC(c) : tiny(c)]
];

const SEPS = [['.', 'Dots'], ['-', 'Dashes'], ['_', 'Lines'], ['*', 'Stars'], ['•', 'Bullets'], ['★', 'Star Cut'], ['☆', 'Open Star'], ['ツ', 'Tsu']];

BASES.forEach(([n, f]) => {
  if (!STYLES.some(s => s.n === n)) STYLES.push({ n, f });
  SEPS.forEach(([sp, sn]) => STYLES.push({ n: n + ' ' + sn, sep: 1, f: (c, i, arr) => f(c, i, arr) + (i < arr.length - 1 && c !== ' ' ? sp : '') }));
});

const apply = (s, x) => { let i = 0; const arr = A(s); return arr.map(c => x.f(c, i++, arr)).join(''); };

const FRAMES = [
  ['', ''], ['꧁', '꧂'], ['꧁༒', '༒꧂'], ['꧁༒☬', '☬༒꧂'], ['꧁༺', '༻꧂'], ['꧁•', '࿐'], ['꧁亗', '亗꧂'], ['꧁彡', '彡꧂'], ['꧁', 'ツ꧂'], ['༆', '࿐'], ['༆', '亗'], ['༄', '࿐'], ['✿᭄', ''], ['᭄', ''], ['', '᭄'], ['', '࿐'],
  ['★彡', '彡★'], ['☆彡', '彡☆'], ['ミ★', '★ミ'], ['亗', '亗'], ['亗『', '』亗'], ['『亗', '亗』'], ['『', '』'], ['【', '】'], ['「', '」'], ['〆', '々'], ['〆', '〆'], ['々', '々'], ['燃', '燃'], ['乂', '乂'], ['么', ''], ['', '么'], ['', '乡'], ['乡', '乡'], ['メ', ''], ['', 'メ'],
  ['', 'ツ'], ['ツ', ''], ['シ', ''], ['', 'ッ'], ['♛', '♛'], ['♛', ''], ['', '♛'], ['♚', '♚'], ['☬', '☬'], ['༒', '༒'], ['༒☬', '☬༒'], ['✦', '✦'], ['❖', '❖'], ['✪', '✪'], ['⊰', '⊱'], ['◥', '◤'], ['◤', '◥'], ['▒', '▒'], ['░', '░'], ['▓', '▓'],
  ['★', '★'], ['☆', '☆'], ['•', '•'], ['_', '_'], ['-', '-'], ['♛', 'ツ'], ['★', 'ツ'], ['༒', 'ツ'], ['亗', 'ツ'], ['〆', 'ツ'], ['乂', 'ツ'], ['☬', 'ッ'], ['', '♚ツ'], ['✿', '✿'], ['༺', '༻'],
  ['', '™'], ['', '®'], ['', '©'], ['☯', ''], ['', '☯'], ['☂', ''], ['', '☂'], ['⚔', '⚔'], ['☠', '☠'], ['☠', ''], ['', '☠'], ['♥', '♥'], ['❤', '❤'], ['❥', ''], ['', '❥'], ['♡', '♡'], ['❀', '❀'], ['✰', '✰'], ['✯', '✯'],
  ['⚜', '⚜'], ['♜', '♜'], ['♞', ''], ['☾', '☽'], ['⌖', '⌖'], ['⍟', '⍟'], ['ʚ', 'ɞ'], ['ꨄ', ''], ['', 'ꨄ'], ['ꕥ', ''], ['', 'ꕥ'], ['↯', ''], ['', '↯'], ['〠', ''], ['۝', '۝'], ['▄︻┻┳═一', ''], ['', '⚡'], ['⚡', '⚡']
];

const EMO_FRAMES = [['🔥', '🔥'], ['🔥', ''], ['', '🔥'], ['👑', ''], ['', '👑'], ['👑', '👑'], ['💀', '💀'], ['💀', ''], ['⚡', '⚡'], ['', '😈'], ['😈', ''], ['🎯', ''], ['', '🎯'], ['💎', ''], ['', '💎'], ['🔫', ''], ['', '🔫'], ['🏆', ''], ['⭐', '⭐'], ['', '⭐'], ['🎮', ''], ['', '🎮'], ['😎', ''], ['', '😎'], ['👻', ''], ['💣', '']];
const TAGS_L = ['ᴾᴿᴼ', 'ᴼᴾ᭄', 'ᴹᴿ.', 'ᴳᵒᵈ', 'Sᴋ᭄', 'ᴵᴺᴰ᭄', 'ᴷᴵᴺᴳ', 'ᴮᴰ', 'ꜰꜰ', 'xX', 'ᴅᴀʀᴋ', 'ᴘʀᴏ', 'ɴɢ'];
const TAGS_R = ['ᴮᴼˢˢ', 'ᴷᴵᴺᴳ', 'ᵀᴹ', 'ᴼᴾ', 'ᴮᴰ', 'ʏᵀ', 'ɢᴀᴍɪɴɢ', 'ᴘʀᴏ', 'ꜰꜰ', 'ᴏꜰᴄ', 'ʜᴅ', 'ᵍᵃᵐᵉʳ', '⁰⁷', '⁴⁷', '⁹⁹', '⁶⁹', 'ˣxd'];

const frames = () => $('#emo').checked ? FRAMES.concat(EMO_FRAMES) : FRAMES;
const variants = () => [['', '']].concat(TAGS_L.map(t => [t, '']), TAGS_R.map(t => ['', t]));

const W = {
  dark: ['Dark', 'Killer', 'Shadow', 'Ghost', 'Venom', 'Reaper', 'Demon', 'Savage', 'Toxic', 'Phantom', 'Death', 'Night', 'Blood', 'Skull', 'Hunter', 'Ninja', 'Devil', 'Joker', 'Grim', 'Raven', 'Viper', 'Doom', 'Evil', 'Black', 'Storm', 'Fury', 'Hades'],
  king: ['King', 'Boss', 'Alpha', 'Lord', 'Titan', 'Legend', 'Master', 'Chief', 'Prince', 'Sultan', 'Don', 'Ruler', 'Champ', 'Royal', 'Sigma', 'Mafia', 'Captain'],
  cool: ['Cool', 'Swag', 'Ice', 'Fire', 'Flame', 'Frost', 'Blaze', 'Neon', 'Turbo', 'Nitro', 'Zero', 'Rapid', 'Flash', 'Ultra', 'Mega', 'Hyper', 'Cyber', 'Pixel', 'Jet', 'Rocket', 'Thunder', 'Comet', 'Galaxy', 'Rogue', 'Sky'],
  bd: ['Bangla', 'Tiger', 'BD', 'Dhaka', 'Padma', 'Rajib', 'Shakib', 'Rakib', 'Sakib', 'Tamim', 'Rifat', 'Sohan', 'Rohan', 'Fahim', 'Nayem', 'Arif', 'Imran', 'Hridoy', 'Tanvir', 'Mehedi', 'Rubel', 'Sabbir', 'Emon', 'Shuvo', 'Pagla', 'Chotu', 'Bhai', 'Dada', 'Raja', 'Nawab', 'Khan'],
  pro: ['Pro', 'Aim', 'Headshot', 'Sniper', 'Sharp', 'Elite', 'Ace', 'Clutch', 'Rush', 'Sweat', 'Heroic', 'Squad', 'Deadeye', 'Bullet', 'Target', 'Gamer', 'Op', 'Noob', 'Striker', 'Raider'],
  love: ['Love', 'Heart', 'Romeo', 'Juliet', 'Cupid', 'Kiss', 'Darling', 'Soulmate', 'Sweet', 'Crush', 'Angel', 'Rose', 'Forever', 'Jaan', 'Bae', 'Babe', 'Lover', 'Valentine', 'Adore', 'Amour', 'Beloved', 'Dil', 'Priyo', 'Mayabi', 'Sona', 'Honey'],
  cute: ['Cutie', 'Baby', 'Bunny', 'Panda', 'Kitty', 'Choco', 'Candy', 'Sweety', 'Honey', 'Cookie', 'Mango', 'Peach', 'Muffin', 'Teddy', 'Nugget', 'Pookie', 'Simba', 'Mimi', 'Jelly', 'Pixie', 'Fluffy']
};

const SUF = ['YT', 'FF', 'OP', 'X', 'Z', 'BD', 'Pro', 'God', 'HD', '47', '07', '99', '69', '786', '420', '1', '2', '7', '11', '24', '100', 'XD', 'TV', 'Max'];
const ALLW = [...new Set(Object.values(W).flat())];

let favs = [];
try {
  favs = JSON.parse(localStorage.getItem('ffnick_favs4') || localStorage.getItem('ffnick_favs2') || '[]');
} catch (e) {}

function saveFavs() {
  try {
    localStorage.setItem('ffnick_favs4', JSON.stringify(favs));
  } catch (e) {}
  $('#favc').textContent = favs.length;
}

function dlCard(name) {
  const c = document.createElement('canvas');
  c.width = 1000;
  c.height = 360;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 1000, 360);
  g.addColorStop(0, '#16161a');
  g.addColorStop(1, '#0d0d0f');
  x.fillStyle = g;
  x.fillRect(0, 0, 1000, 360);
  x.strokeStyle = ACC();
  x.lineWidth = 4;
  x.strokeRect(14, 14, 972, 332);
  x.textAlign = 'center';
  x.fillStyle = ACC();
  x.font = '600 26px sans-serif';
  x.fillText('FREE FIRE NICKNAME', 500, 80);
  let size = 96;
  x.fillStyle = '#fff';
  do {
    x.font = '700 ' + size + 'px sans-serif';
    size -= 4;
  } while (x.measureText(name).width > 900 && size > 24);
  x.fillText(name, 500, 215);
  x.fillStyle = '#8f8f99';
  x.font = '22px sans-serif';
  x.fillText(B(), 500, 310);
  c.toBlob(b => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'ff-name.png';
    a.click();
  });
}

function refreshAll() {
  const p = $('.panel.on').id;
  if (p === 'p1') autoStart();
  else if (p === 'p2') generate(false);
  else if (p === 'p5') renderFavs();
  else if (p === 'p6') renderAZ();
}

function markName(name, state) {
  for (const ch of A(name)) {
    if (state === 'good') setState(ch, 'good');
    else if (!/[A-Za-z0-9 ]/.test(ch) && !GS.has(ch)) setState(ch, 'bad');
  }
}

const PAL = [ACC()];
let CI = 0;

function card(name, label) {
  const n = nlen(name), e = level(name);
  const tag = e === 'ok' ? ['ok', 'Common'] : e === 'test' ? ['w', 'Test it'] : e === 'emoji' ? ['w', 'Emoji test'] : ['x', 'Excluded'];
  const d = document.createElement('div');
  d.className = 'nm';
  d.style.setProperty('--c', PAL[CI++ % PAL.length]);
  d.innerHTML = `<div class="t"></div><div class="m">${label ? label + ' · ' : ''}${n}/${maxLen()}</div><button class="c" title="Copy">${ic('copy')}Copy</button>`;
  d.querySelector('.t').textContent = name;
  const cb = d.querySelector('.c'), lock = isPremiumStyle(label), key = 'n:' + name;
  if (lock) {
    d.classList.add('lk');
    d.querySelector('.m').insertAdjacentHTML('beforeend', '<span class="pro-tag">PRO</span>');
  }
  paintCopy(cb, key, lock);
  cb.onclick = ev => {
    const b = ev.currentTarget;
    if (gate(key, () => { copy(name); flashDone(b, key, lock); }, { lock })) return;
    if (!lock) paintCopy(b, key, lock);
  };
  return d;
}

$$('.tab').forEach(t => t.onclick = () => {
  $$('.tab').forEach(x => x.classList.remove('on'));
  t.classList.add('on');
  $$('.panel').forEach(p => p.classList.remove('on'));
  $('#' + t.dataset.p).classList.add('on');
  fillSlots($('#' + t.dataset.p));
  if (t.dataset.p === 'p5') renderFavs();
  if (t.dataset.p === 'p3') renderTiles();
  if (t.dataset.p === 'p6') renderAZ();
});

['exp', 'emo', 'maxlen', 'dbl'].forEach(id => $('#' + id).addEventListener('change', refreshAll));

let L1 = [], S1 = 0;

function more1() {
  const o = $('#out1');
  const fr = document.createDocumentFragment();
  L1.slice(S1, S1 + 20).forEach(r => { fr.appendChild(card(r[0], r[1])); feed(fr, 'out1'); });
  S1 += 20;
  o.appendChild(fr);
  $('#more1').style.display = S1 < L1.length ? '' : 'none';
  if (S1 < L1.length && $('#p1').classList.contains('on') && document.body.offsetHeight < innerHeight + 300) more1();
}

function styleIt() {
  const v = $('#inp').value.trim(), o = $('#out1');
  o.innerHTML = '';
  FEED.out1 = 0;
  $('#c1').textContent = A($('#inp').value).length;
  L1 = [];
  S1 = 0;
  if (!v) {
    o.innerHTML = '<div class="empty">Type a name to begin</div>';
    $('#tot1').textContent = 0;
    $('#more1').style.display = 'none';
    return;
  }
  const seen = new Set(), frs = frames(), vars = variants();
  const buckets = [];
  for (const s of STYLES) {
    const base = apply(v, s), bk = [];
    let tries = 0;
    while (bk.length < 120 && tries++ < 400) {
      const [tl, tr] = pick(vars), f = pick(frs), r = f[0] + tl + base + tr + f[1];
      if (seen.has(r) || !allowed(r)) continue;
      seen.add(r);
      bk.push([r, s.n]);
    }
    if (bk.length) buckets.push(bk);
  }
  for (let i = 0; buckets.some(b => i < b.length); i++)
    for (const b of shuf(buckets))
      if (i < b.length) L1.push(b[i]);
  
  $('#tot1').textContent = L1.length;
  if (!L1.length) {
    o.innerHTML = '<div class="empty">No matches. Shorten the name or enable experimental characters.</div>';
    $('#more1').style.display = 'none';
    return;
  }
  more1();
}

$('#goStyle').onclick = styleIt;
$('#inp').oninput = styleIt;
$('#more1').onclick = more1;

let A_SEEN = new Set();

function autoMore() {
  const o = $('#out1'), fr = document.createDocumentFragment();
  let g = 0, c = 0;
  while (g < 20 && c++ < 800) {
    const r = one('');
    if (!r || A_SEEN.has(r[0])) continue;
    A_SEEN.add(r[0]);
    fr.appendChild(card(r[0], r[1]));
    feed(fr, 'out1');
    g++;
  }
  o.appendChild(fr);
}

function autoStart() {
  $('#out1').innerHTML = '';
  FEED.out1 = 0;
  A_SEEN = new Set();
  autoMore();
}

let made = 0;
const nf = n => n.toLocaleString('en-US');
const pool = () => $('#cat').value === 'all' ? ALLW : W[$('#cat').value];

function combos() {
  const p = pool().length;
  $('#combos').textContent = nf(p * STYLES.length * FRAMES.length * (1 + TAGS_L.length) * (1 + TAGS_R.length) * (1 + SUF.length + p));
}

function one(kw) {
  kw = kw === undefined ? $('#kw').value.trim() : kw;
  const frs = frames();
  for (let t = 0; t < 150; t++) {
    const s = nextStyle(), f = nextFrame(), tl = !kw && rnd(10) < 3 ? pick(TAGS_L) : '', tr = !kw && rnd(10) < 3 ? pick(TAGS_R) : '', w = pick(pool()), m = kw ? 0 : rnd(4);
    if (kw && ['Leet', 'Random Mix', 'Small+Upper', 'Tiny+Small', 'Upper+Tiny'].some(x => s.n.indexOf(x) === 0)) continue;
    const core = kw ? (m === 0 ? kw : m === 1 ? kw + w : m === 2 ? w + kw : kw + pick(SUF)) : (m === 0 ? w : m === 1 ? w + pick(pool()) : m === 2 ? w + pick(SUF) : w + pick(pool()));
    const r = f[0] + tl + apply(core, s) + tr + f[1];
    if (allowed(r)) return [r, s.n];
  }
  return null;
}

let SEEN = new Set(), SQ = [], FQ = [];
const shuf = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

function nextStyle() {
  if (!SQ.length) SQ = shuf(STYLES);
  return SQ.pop();
}

function nextFrame() {
  if (!FQ.length) FQ = shuf(frames());
  return FQ.pop();
}

function generate(append) {
  const n = 20, o = $('#out2');
  if (!append) {
    o.innerHTML = '';
    FEED.out2 = 0;
    SEEN = new Set();
  }
  if (!$('#kw').value.trim()) {
    if (!append) o.innerHTML = '<div class="empty">Type a name to begin</div>';
    return;
  }
  const fr = document.createDocumentFragment();
  let g = 0, c = 0;
  while (g < n && c++ < n * 40) {
    const r = one();
    if (!r || SEEN.has(r[0])) continue;
    SEEN.add(r[0]);
    fr.appendChild(card(r[0], r[1]));
    feed(fr, 'out2');
    made++;
    g++;
  }
  o.appendChild(fr);
  $('#made').textContent = nf(made);
  if (!g && !append) o.innerHTML = '<div class="empty">No names match these settings.</div>';
}

$('#kw').oninput = () => generate(false);
$('#gen').onclick = () => generate(false);
$('#more').onclick = () => generate(true);
$('#cat').onchange = () => { combos(); generate(false); };

let at = null;
$('#auto').onchange = e => {
  clearInterval(at);
  if (e.target.checked) at = setInterval(() => generate(false), 3000);
};

addEventListener('scroll', () => {
  if ($('#p2').classList.contains('on') && innerHeight + scrollY >= document.body.offsetHeight - 300 && !$('#auto').checked) generate(true);
});

const mapStr = (f, t) => {
  const a = A(f), b = A(t), m = {};
  a.forEach((c, i) => m[c] = b[i]);
  return c => m[c] || c;
};

const CHN = A('卂乃匚刀乇下厶卄工丁长乚从ん口尸Ǫ尺丂ㄒ凵リ山乂丫乙');
const cyr = mapStr('ABCEHKMOPTXYacehkmopxyisj', 'АВСЕНКМОРТХУасенкморхуіѕј');
const grk = mapStr('ABEHIKMNOPTXYZabeiknoptuvwxy', 'ΑΒΕΗΙΚΜΝΟΡΤΧΥΖαβεικηορτυνωχγ');
const acc = mapStr('AaBCcDdEeIiNnOoSsUuYyZzLl', 'ÄäßÇçÐđËëÏïÑñÖöŠšÜüŸÿŽžŁł');
const stk = mapStr('ABCDEGHIJLOPRTUYZabcdeghijloprtuyz', 'ȺɃȻĐɆǤĦƗɈŁØⱣɌŦɄɎƵⱥƀȼđɇǥħɨɉłøᵽɍŧʉɏƶ');

const EXTRA = [
  { n: 'Chinese Style', f: c => { const i = UP.indexOf(c.toUpperCase()); return i > -1 ? CHN[i] : c; } },
  { n: 'Cyrillic Mix', f: cyr }, { n: 'Greek Mix', f: grk }, { n: 'Accent', f: acc }, { n: 'Stroke', f: stk },
  { n: 'Bangla Digits', f: c => { const i = DG.indexOf(c); return i > -1 ? String.fromCodePoint(0x9E6 + i) : c; } }
];

EXTRA.forEach(s => s.test = 1);
['Fullwidth', 'Kawaii', 'Circled', 'Canadian'].forEach(n => { const s = STYLES.find(x => x.n === n); if (s) s.test = 1; });

const azOk = (s, m) => { const t = st(m); return t === 'safe' || t === 'good' || (s.test && t !== 'bad' && t !== 'emoji'); };
const bld = $('#bld');

function updBld() {
  $('#bldN').textContent = nlen(bld.value);
  const l = level(bld.value);
  $('#bldTag').textContent = !bld.value ? '–' : ({ ok: 'Common', test: 'Test it', emoji: 'Emoji test', bad: 'Excluded' })[l];
}

function renderAZ() {
  const box = $('#azList');
  box.innerHTML = '';
  const chars = A(UP + LO + DG);
  STYLES.concat(EXTRA).filter(s => s.n !== 'Random Mix' && s.n !== 'Leet' && !s.sep && [0, 1].every(k => chars.every(c => A(s.f(c, k, chars)).every(m => azOk(s, m)))) && s.n.toLowerCase().includes(bld.value.trim().toLowerCase())).forEach(s => {
    const seen = new Set(), list = [];
    chars.forEach((c, i) => { const m = s.f(c, i, chars); if (!seen.has(m)) { seen.add(m); list.push(m); } });
    const t = document.createElement('div');
    t.className = 'sec';
    t.textContent = s.n;
    const lock = isPremiumStyle(s.n);
    if (lock) t.insertAdjacentHTML('beforeend', '<span class="pro-tag">PRO</span>');
    if (list.some(m => A(m).some(ch => !['safe', 'good'].includes(st(ch))))) {
      const g = document.createElement('span');
      g.className = 'tg';
      g.textContent = 'Test first';
      t.appendChild(g);
    }
    box.appendChild(t);
    const w = document.createElement('div');
    w.className = 'sym';
    list.forEach(m => { const sp = document.createElement('span'); sp.textContent = m; if (lock) sp.className = 'lk'; sp.onclick = () => gate('az:' + s.n + ':' + m, () => copy(m), { lock, section: 'az:' + s.n }); w.appendChild(sp); });
    box.appendChild(w);
  });
}

bld.oninput = renderAZ;
$('#bldBack').onclick = () => { bld.value = A(bld.value).slice(0, -1).join(''); updBld(); };
$('#bldClr').onclick = () => { bld.value = ''; updBld(); };
$('#bldCopy').onclick = () => bld.value && copy(bld.value);
$('#bldFav').onclick = () => { if (bld.value && !favs.includes(bld.value)) { favs.unshift(bld.value); saveFavs(); toast('Saved'); } };
$('#bldDl').onclick = () => bld.value && dlCard(bld.value);

const labInp = $('#labInp');

function renderTiles() {
  const t = $('#tiles');
  t.innerHTML = '';
  [...new Set(A(labInp.value))].forEach(ch => {
    const s = st(ch);
    const d = document.createElement('div');
    d.className = 'tile ' + s;
    const lbl = { good: 'Worked', bad: 'Failed', safe: 'Common', extra: 'Unknown', emoji: 'Emoji' }[s];
    d.innerHTML = `<div class="ch"></div><div class="st">${lbl}</div>`;
    d.querySelector('.ch').textContent = ch === ' ' ? '␣' : (ch === ' ' ? 'NBSP' : ch);
    d.onclick = () => {
      const cur = GS.has(ch) ? 'good' : BS.has(ch) ? 'bad' : 'none';
      setState(ch, cur === 'none' ? 'good' : cur === 'good' ? 'bad' : 'none');
      renderTiles();
    };
    t.appendChild(d);
  });
  $('#gN').textContent = K.good.length;
  $('#bN').textContent = K.bad.length;
}

labInp.oninput = renderTiles;
$('#labCopy').onclick = () => labInp.value && copy(labInp.value);
$('#labClr').onclick = () => { labInp.value = ''; renderTiles(); };
$('#labAllGood').onclick = () => { markName(labInp.value, 'good'); renderTiles(); toast('All marked as working'); };
$('#labAllBad').onclick = () => { markName(labInp.value, 'bad'); renderTiles(); toast('All marked as failed'); };
$('#resetLab').onclick = () => { if (confirm('Reset all saved results?')) { K = { good: [], bad: [] }; saveK(); renderTiles(); } };
$('#expLab').onclick = () => copy(JSON.stringify(K));
$('#impLab').onclick = () => { const v = prompt('Paste backup text'); if (!v) return; try { const j = JSON.parse(v); K = { good: j.good || [], bad: j.bad || [] }; saveK(); renderTiles(); toast('Imported'); } catch (e) { toast('Invalid format'); } };

const SYMS = {
  'Classic': ['꧁', '꧂', '༒', '☬', '༺', '༻', '亗', '彡', 'メ', '乂', '么', '乡', '᭄', '࿐', '༆', '〆', '々', '燃', '◥', '◤', '⊰', '⊱', '░', '▒', '▓'],
  'Brackets': ['『', '』', '【', '】', '「', '」', '《', '》', '«', '»'],
  'Icons': ['ⓥ', 'Ⓥ', '®', '©', '™', '☯', '☂', 'ᯤ', '⚜', '♜', '♞', '☾', '☽', '⌖', '⍟', '⚔', '☠', '♥', '❤', '♡', '❀', '✰', '✯', 'ʚ', 'ɞ'],
  'Crowns & stars': ['♛', '♚', '♕', '♔', '★', '☆', '✦', '✧', '✿', '❖', '✪', '❥', '↯', 'ꕥ', 'ꨄ', '۝', '〠', '•', '·', '◈', '◆'],
  'Weapon art': ['▄︻┻┳═一', '▄︻┳︼一一一', '︻デ═一', '╾━╤デ╦︻', '( ͡° ͜ʖ ͡°)', '(¬_¬)', '×͜×', 'ʕ•ᴥ•ʔ', '╰☆╮'],
  'CJK': ['ツ', 'シ', 'ッ', 'ミ', '卍', '忍', '魂', '神', '王', '龍', '火', '米', '么'],
  'Small caps': A(smallcaps),
  'Superscript': ['ᵀᴹ', 'ᴼᴾ', 'ᴮᴰ', 'ᶠᶠ', 'ᴾᴿᴼ', 'ᴷᴵᴺᴳ', '⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'],
  'Emoji (often refused)': ['⚡', '⭐', '✨', '🔥', '💀', '👑', '😈', '🎯', '💎', '🔫', '🏆', '🎮', '💣', '😎', '👻', '🦅', '🐯', '🌙']
};

const cps = (a, b) => {
  const o = [];
  for (let c = a; c <= b; c++) {
    const x = String.fromCodePoint(c);
    if (!/[\p{C}\p{M}\p{Z}]|\p{Emoji_Presentation}/u.test(x)) o.push(x);
  }
  return o;
};

const SETS = [];
SETS.push(['Stars, flowers & hearts', cps(0x2726, 0x2767), 0]);
for (const [k, arr] of Object.entries(SYMS)) SETS.push([k, arr, 0]);

[
  ['Dingbats', cps(0x2700, 0x27BF)], ['Symbols', cps(0x2600, 0x26FF)], ['Shapes', cps(0x25A0, 0x25FF)], ['Box drawing', cps(0x2500, 0x257F)], ['Blocks', cps(0x2580, 0x259F)], ['Arrows', cps(0x2190, 0x21FF)], ['Math', cps(0x2200, 0x22FF)], ['Technical', cps(0x2300, 0x23FF)], ['Circled & numbers', cps(0x2460, 0x24FF)], ['Letter-like', cps(0x2100, 0x218F)], ['Super & subscript', cps(0x2070, 0x209F)], ['Currency', cps(0x20A0, 0x20BF)], ['Braille', cps(0x2800, 0x28FF)], ['Fullwidth', cps(0xFF01, 0xFF5E)],
  ['Latin extended', cps(0xC0, 0x24F)], ['IPA & modifiers', cps(0x250, 0x2FF)], ['Greek', cps(0x370, 0x3FF)], ['Cyrillic', cps(0x400, 0x4FF)], ['Tibetan', cps(0xF00, 0xFFF)], ['Balinese', cps(0x1B00, 0x1B7F)], ['Javanese', cps(0xA980, 0xA9DF)], ['Bengali', cps(0x980, 0x9FF)], ['Devanagari', cps(0x900, 0x97F)], ['Thai', cps(0xE00, 0xE7F)], ['Arabic', cps(0x600, 0x6FF)], ['Canadian syllabics', cps(0x1400, 0x167F)], ['Runic', cps(0x16A0, 0x16FF)],
  ['Hiragana', cps(0x3040, 0x309F)], ['Katakana', cps(0x30A0, 0x30FF)], ['Bopomofo', cps(0x3100, 0x312F)], ['CJK symbols', cps(0x3000, 0x303F)], ['Enclosed CJK', cps(0x3200, 0x32FF)], ['Hexagrams', cps(0x4DC0, 0x4DFF)], ['Hangul', cps(0xAC00, 0xD7A3)], ['CJK ideographs', cps(0x4E00, 0x9FFF)]
].forEach(([k, arr]) => SETS.push([k, arr, 1]));

const CH = 300;
SETS.forEach(([k, arr, fold]) => {
  const mono = /^Emoji/.test(k), L = $('#symList'), h = document.createElement('div');
  const lock = isPremiumSet(k, fold);
  h.className = 'sec' + (fold ? ' fold' : '');
  h.append(k);
  const cn = document.createElement('span');
  cn.className = 'cnt';
  cn.textContent = arr.length.toLocaleString();
  h.appendChild(cn);
  if (lock) h.insertAdjacentHTML('beforeend', '<span class="pro-tag">PRO</span>');
  const blk = document.createElement('div');
  blk.className = 'blk';
  const w = document.createElement('div');
  w.className = 'sym';
  blk.appendChild(w);
  const ld = document.createElement('button');
  ld.className = 'ld';
  blk.appendChild(ld);
  let n = 0;
  
  const fill = () => {
    arr.slice(n, n + CH).forEach(s => {
      const sp = document.createElement('span');
      if (mono) {
        sp.className = 'mono';
        const e = document.createElement('i');
        e.textContent = s + '\uFE0E';
        sp.appendChild(e);
      } else sp.textContent = s === ' ' ? 'NBSP' : s;
      if (lock) sp.classList.add('lk');
      sp.onclick = () => gate('sy:' + k + ':' + s, () => copy(s), { lock, section: 'sy:' + k });
      w.appendChild(sp);
    });
    n += CH;
    ld.style.display = n < arr.length ? '' : 'none';
    ld.textContent = 'Show more (' + (arr.length - n).toLocaleString() + ')';
  };
  
  ld.onclick = fill;
  fill();
  
  if (fold) {
    h.insertAdjacentHTML('beforeend', ic('chev').replace('class="i"', 'class="i chv"'));
    h.tabIndex = 0;
    h.setAttribute('role', 'button');
    blk.hidden = true;
    const tg = () => {
      blk.hidden = !blk.hidden;
      h.classList.toggle('open', !blk.hidden);
    };
    h.onclick = tg;
    h.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tg();
      }
    };
  }
  L.appendChild(h);
  L.appendChild(blk);
});

$$('[data-blank]').forEach(b => b.onclick = () => copy(b.dataset.blank));

$('#blankGo').onclick = () => {
  const v = $('#blankInp').value.trim(), o = $('#out4');
  o.innerHTML = '';
  if (!v) return;
  const B_char = ' ';
  [B_char + v, v + B_char, B_char + v + B_char, A(v).join(B_char)].forEach((r, i) => {
    if (nlen(r) <= maxLen()) o.appendChild(card(r, ['Leading', 'Trailing', 'Both sides', 'Between'][i]));
  });
};

function renderFavs() {
  const o = $('#out5');
  o.innerHTML = '';
  if (!favs.length) {
    o.innerHTML = '<div class="empty">No saved names yet</div>';
    return;
  }
  favs.forEach(f => o.appendChild(card(f, '')));
}

$('#favClr').onclick = () => {
  if (confirm('Clear all saved names?')) {
    favs = [];
    saveFavs();
    renderFavs();
  }
};

$('#favCopy').onclick = () => favs.length && copy(favs.join('\n'));

(() => {
  const SP = '\u3164', b = $('#spCopy');
  const kS = 'space';
  const paint = () => {
    b.classList.remove('done');
    const armed = !proNow() && adCount(kS) >= MT.AD_TAPS;
    b.classList.toggle('armed', armed);
    b.innerHTML = ic('copy') + (armed ? 'Tap again' : 'Copy');
  };
  const go = () => {
    const ran = gate(kS, () => {
      copy(SP);
      b.classList.add('done');
      b.innerHTML = ic('check') + 'Copied';
      clearTimeout(b.t);
      b.t = setTimeout(paint, 1400);
    });
    if (!ran) paint();
  };
  b.onclick = go;
  $('#spBox').onclick = go;
})();

(() => {
  const k = $('#kw'), n = $('#kwn'), x = $('#kwx'), c = n.parentNode;
  const u = () => {
    const l = Math.min(12, A(k.value).length);
    n.textContent = l;
    x.hidden = !l;
    c.classList.toggle('max', l >= 12);
  };
  k.addEventListener('input', () => {
    const a = A(k.value);
    if (a.length > 12) {
      k.value = a.slice(0, 12).join('');
      k.dispatchEvent(new Event('input'));
    }
  });
  k.addEventListener('input', u);
  x.onclick = e => {
    e.preventDefault();
    k.value = '';
    k.dispatchEvent(new Event('input'));
    k.focus();
  };
  u();
})();

saveFavs();
saveK();
combos();
generate(false);

addEventListener('scroll', () => {
  if ($('#p1').classList.contains('on') && innerHeight + scrollY >= document.body.offsetHeight - 300) autoMore();
});

autoStart();
