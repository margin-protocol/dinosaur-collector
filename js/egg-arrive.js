// 收到蛋的提示（湘 11/28「玩家拿到蛋常常沒發現被發蛋了」）
// 不用每個發蛋的地方各自改：每次存檔後比對「手上每種蛋有幾顆」（蛋庫＋培養架＋暫放架），變多了就是收到新蛋。
// 從蛋庫拿出來放上架、放回蛋庫只是換位置，總數不變，不會誤報；孵掉會變少，也不會誤報。
import { onSave, loadState } from './state.js';

const SEEN_KEY = 'siang-collector:egg-seen:v1'; // 上次看到的各種蛋數量（這台裝置）
const NEW_KEY = 'siang-collector:egg-new:v1'; // 還沒打開「選擇蛋」看過的新蛋：[{ id, county?, character? }]
export const TRACKED = ['wish', 'weather', 'county', 'cipher', 'keepsake', 'date', 'star', 'mohen'];
const GIFT_KINDS = ['cipher', 'keepsake', 'date', 'star', 'mohen'];
const RESYNC_OVER = 12; // 一次多出一大堆（雲端還原存檔、測試服送全滿存檔）當作換存檔，不跳提示

export function holdings(s) {
  const out = Object.fromEntries(TRACKED.map((id) => [id, 0]));
  out.wish += Number(s?.wishEgg?.stock) || 0;
  out.weather += Number(s?.weather?.stock) || 0;
  out.county += s?.travel?.eggs?.length || 0;
  for (const g of s?.gifts?.eggs || []) if (g && g.egg in out) out[g.egg] += 1;
  for (const e of [s?.egg, ...(s?.shelf || [])]) if (e && e.id in out) out[e.id] += 1;
  return out;
}

// 這次多了哪些蛋：[{ id, county?, character? }]，同一種多顆就有多筆
export function arrivals(before, s) {
  const now = holdings(s);
  const list = [];
  for (const id of TRACKED) {
    const n = now[id] - (before?.[id] || 0);
    if (n <= 0) continue;
    if (id === 'county') { for (const county of (s.travel?.eggs || []).slice(-n)) list.push({ id, county }); continue; }
    if (GIFT_KINDS.includes(id)) {
      const fresh = (s.gifts?.eggs || []).filter((g) => g.egg === id && g.from !== 'returned').slice(-n);
      for (let i = 0; i < n; i += 1) list.push({ id, ...(fresh[fresh.length - n + i]?.character ? { character: fresh[fresh.length - n + i].character } : {}) });
      continue;
    }
    for (let i = 0; i < n; i += 1) list.push({ id });
  }
  return list;
}

const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const newEggs = () => { const v = read(NEW_KEY, []); return Array.isArray(v) ? v : []; };
export function clearNewEggs() { write(NEW_KEY, []); paintBadges(); }

let ctx = null;
let queue = [];
let timer = 0;
let arrivedAt = 0;
// 收到後 1.5 秒內有視窗打開（自動探索的縣市來信、出門結果…）＝那個地方自己會講，不再跳小卡
function watchDialogs() {
  if (typeof MutationObserver !== 'function') return;
  new MutationObserver((records) => {
    if (!queue.length || Date.now() - arrivedAt > 1500) return;
    if (records.some((r) => r.target.tagName === 'DIALOG' && r.target.id !== 'egg-arrive' && r.target.open)) for (const e of queue) e.quiet = true;
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
}

export function eggName(e) {
  const egg = ctx?.eggs?.[e.id];
  const base = egg?.name || '蛋';
  if (e.county) return `${base} · ${e.county}`;
  if (e.character && ctx?.characters?.[e.character] && e.id !== 'cipher') return `${base} · ${ctx.characters[e.character].name}`;
  return base;
}
const shell = (id) => `assets/eggs/${id}/shell.webp`;
// 同一種蛋合在一起：[{ id, n, label }]
function grouped(list) {
  const map = new Map();
  for (const e of list) { const k = eggName(e); const g = map.get(k) || { id: e.id, n: 0, label: k }; g.n += 1; map.set(k, g); }
  return [...map.values()];
}
const titleFor = (list) => {
  const g = grouped(list);
  return g.length === 1 ? `收到${g[0].n > 1 ? ` ${g[0].n} 顆` : '一顆'}「${g[0].label}」` : `收到 ${list.length} 顆新的蛋`;
};

function onStateSaved(s) {
  const before = read(SEEN_KEY, null);
  const now = holdings(s);
  write(SEEN_KEY, now);
  if (!before) return; // 第一次：只記下來，不跳
  const list = arrivals(before, s);
  if (!list.length) return;
  if (list.length > RESYNC_OVER) return;
  write(NEW_KEY, [...newEggs(), ...list].slice(-40));
  paintBadges();
  // 收到的當下已經有視窗開著（探索附近、全服信、化石交換、戰報…那些自己會講收到什麼）：只亮首頁小蛋，不再跳小卡
  const quiet = busy();
  queue.push(...list.map((e) => ({ ...e, quiet })));
  arrivedAt = Date.now();
  clearTimeout(timer);
  timer = setTimeout(flush, 700); // 同一個動作連發好幾顆時合成一次
}

// 有其他視窗開著（禮物信、章節完成、孵化演出…）就等它關掉再出來，不要疊在一起
const busy = () => Boolean(document.querySelector('dialog[open]:not(#egg-arrive)') || document.querySelector('.hfx, .mo-fx, .lfx, .twx'));
function flush() {
  if (!queue.length) return;
  if (busy() || document.hidden) { timer = setTimeout(flush, 800); return; }
  const list = queue; queue = [];
  const style = ctx?.style?.() || 'a';
  if (style === 'c' || list.every((e) => e.quiet)) popBubble(list, style === 'c');
  else if (style === 'b') { showBanner(list); popBubble(list); } else showCard(list);
}

/* ---------- 角標：研究者手記、手記裡的「培育」、培育室的「選擇蛋」 ---------- */
function paintBadges() {
  const n = newEggs().length;
  const put = (host, cls) => {
    if (!host) return;
    let el = host.querySelector(`:scope > .egg-new-dot`);
    if (!n) { el?.remove(); return; }
    if (!el) { el = document.createElement('i'); el.className = `egg-new-dot ${cls}`; el.setAttribute('aria-hidden', 'true'); host.append(el); }
    el.textContent = cls === 'is-pill' ? `新蛋 ${n}` : String(n);
  };
  put(document.getElementById('open-center'), 'is-corner');
  put(document.querySelector('#nav .nav__item[data-view="incubate"]'), 'is-corner');
  put(document.getElementById('open-eggs'), 'is-pill');
  const bubble = document.getElementById('egg-bubble');
  if (bubble) { bubble.hidden = !n; const b = bubble.querySelector('b'); if (b) b.textContent = `+${n}`; }
}

function go() {
  document.getElementById('egg-arrive')?.close?.();
  document.getElementById('egg-banner')?.classList.remove('is-on');
  ctx?.openPicker?.();
}

/* ---------- A：小卡＋蛋落到研究者手記 ---------- */
function showCard(list) {
  let d = document.getElementById('egg-arrive');
  if (!d) {
    d = document.createElement('dialog');
    d.id = 'egg-arrive'; d.className = 'sheet egg-arrive'; d.setAttribute('aria-labelledby', 'egg-arrive-title');
    d.innerHTML = '<small class="egg-arrive__eyebrow">A NEW EGG ARRIVED</small><div class="egg-arrive__stage" aria-hidden="true"><span class="egg-arrive__halo"></span><img class="egg-arrive__shell" alt="" width="150" height="150"><span class="egg-arrive__spark s1">✦</span><span class="egg-arrive__spark s2">✧</span><span class="egg-arrive__spark s3">✦</span></div><h2 id="egg-arrive-title"></h2><div class="egg-arrive__chips" id="egg-arrive-chips"></div><p class="egg-arrive__note">已經放進培育室的「選擇蛋」，想孵的時候拿出來就好。</p><div class="egg-arrive__actions"><button class="btn egg-arrive__later" type="button" id="egg-arrive-later">晚點再說</button><button class="btn egg-arrive__go" type="button" id="egg-arrive-go" autofocus>去看看</button></div>';
    document.body.append(d);
    d.querySelector('#egg-arrive-go').addEventListener('click', go);
    d.querySelector('#egg-arrive-later').addEventListener('click', () => { const from = d.querySelector('.egg-arrive__shell').getBoundingClientRect(); d.close(); flyTo(d.dataset.egg, from); });
    d.addEventListener('close', () => setTimeout(flush, 300));
  }
  const g = grouped(list);
  d.dataset.egg = g[0].id;
  d.querySelector('.egg-arrive__shell').src = shell(g[0].id);
  d.querySelector('#egg-arrive-title').textContent = titleFor(list);
  const chips = d.querySelector('#egg-arrive-chips');
  chips.replaceChildren(...(g.length > 1 ? g.map((x) => { const c = document.createElement('span'); c.className = 'egg-arrive__chip'; const i = document.createElement('img'); i.src = shell(x.id); i.alt = ''; c.append(i, `${x.label}${x.n > 1 ? ` ×${x.n}` : ''}`); return c; }) : []));
  chips.hidden = g.length <= 1;
  d.classList.remove('is-in'); void d.offsetWidth; d.classList.add('is-in');
  if (!d.open) d.showModal();
  ctx?.buzz?.([18, 40, 26]);
}
// 關掉小卡時，小小一顆蛋飛進首頁左邊的「新蛋」泡泡（在別的畫面就直接出現）
function flyTo(id, from) {
  const target = document.getElementById('egg-bubble');
  if (target) target.hidden = !newEggs().length;
  const to = target?.getBoundingClientRect();
  if (!to?.width || !from || matchMedia('(prefers-reduced-motion: reduce)').matches) { popBubble(); return; }
  target.style.visibility = 'hidden';
  const img = document.createElement('img'); img.src = shell(id); img.alt = ''; img.className = 'egg-fly';
  const size = 44; Object.assign(img.style, { left: `${from.left + from.width / 2 - size / 2}px`, top: `${from.top + from.height / 2 - size / 2}px`, width: `${size}px`, height: `${size}px` });
  document.body.append(img);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2), dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const anim = img.animate?.([{ transform: 'translate(0,0) scale(1.3)', opacity: 1 }, { transform: `translate(${dx * 0.45}px, ${dy * 0.25 - 60}px) scale(1)`, opacity: 1, offset: 0.45 }, { transform: `translate(${dx}px, ${dy}px) scale(.35)`, opacity: 0.2 }], { duration: 760, easing: 'cubic-bezier(.45,.05,.55,.95)' });
  const done = () => { img.remove(); target.style.visibility = ''; popBubble(); };
  if (anim) anim.onfinish = done; else done();
}

/* ---------- B：底部浮出條（不擋畫面，8 秒自己收起） ---------- */
let bannerTimer = 0;
function showBanner(list) {
  let el = document.getElementById('egg-banner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'egg-banner'; el.className = 'egg-banner'; el.setAttribute('role', 'status');
    el.innerHTML = '<span class="egg-banner__art" aria-hidden="true"><img alt="" width="52" height="52"></span><span class="egg-banner__text"><small>NEW EGG · 收到新的蛋</small><b></b><em>放在培育室的「選擇蛋」</em></span><button type="button" class="egg-banner__go">去看看</button><button type="button" class="egg-banner__x" aria-label="收起">×</button>';
    document.body.append(el);
    el.querySelector('.egg-banner__go').addEventListener('click', go);
    el.querySelector('.egg-banner__x').addEventListener('click', () => { el.classList.remove('is-on'); setTimeout(flush, 300); });
  }
  const g = grouped(list);
  el.querySelector('img').src = shell(g[0].id);
  el.querySelector('b').textContent = g.length === 1 ? `${g[0].label}${g[0].n > 1 ? ` ×${g[0].n}` : ''}` : g.map((x) => `${x.label}${x.n > 1 ? `×${x.n}` : ''}`).join('、');
  el.classList.remove('is-on'); void el.offsetWidth; el.classList.add('is-on');
  ctx?.buzz?.([18, 40, 26]);
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => { el.classList.remove('is-on'); setTimeout(flush, 300); }, 8000);
}

/* ---------- 首頁小蛋泡泡：三種樣式都有，留著直到打開「選擇蛋」；C 只有這個 ---------- */
function popBubble(list, buzzIt = false) {
  const b = document.getElementById('egg-bubble');
  if (!b) return;
  paintBadges();
  const first = list?.[0] || newEggs().slice(-1)[0];
  if (first) b.querySelector('img').src = shell(first.id);
  b.setAttribute('aria-label', `${list ? titleFor(list) : '有新的蛋'}，點一下去選擇蛋`);
  b.classList.remove('is-pop'); void b.offsetWidth; b.classList.add('is-pop');
  if (buzzIt) ctx?.buzz?.([14, 30, 20]);
}
function mountBubble() {
  const host = document.getElementById('room-left');
  if (!host || document.getElementById('egg-bubble')) return;
  const b = document.createElement('button');
  b.type = 'button'; b.id = 'egg-bubble'; b.className = 'egg-bubble'; b.hidden = true;
  b.innerHTML = '<img alt="" width="44" height="44"><b>+1</b><small>新蛋</small>';
  b.addEventListener('click', go);
  host.append(b);
  const last = newEggs().slice(-1)[0]; if (last) b.querySelector('img').src = shell(last.id);
}

export function setupEggArrive(options) {
  ctx = options;
  mountBubble();
  watchDialogs();
  onSave(onStateSaved);
  write(SEEN_KEY, holdings(loadState())); // 開遊戲時重新記一次：只提示這次玩的時候收到的蛋（雲端換存檔、別的分頁的不算）
  paintBadges();
}
export const repaintEggBadges = paintBadges;
