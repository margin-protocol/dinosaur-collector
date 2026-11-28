// 營運後台（湘 11/28）：審核室「營運」分頁用的純函式。
// 資料放在小湘雲端 shared/ops/board.json（只有審核員通行碼讀寫得到，玩家和路人都讀不到）；repo 只放程式。
// 分工：湘決定改什麼、什麼時候上；德寶修＋部署；皮寶抓 bug、複驗。
// 第一版刻意不做：改玩家存檔、手動發獎。
import { EVENT_DEFS, schedule } from './events.js';
import { SIDE_OPEN_AT } from './side.js';
import { OPEN as STUDIO_OPEN } from './studio-jh.js';

export const OPS_PATH = 'shared/ops/board.json';
export const PRIORITIES = { P0: '馬上修', P1: '這兩天', P2: '有空再說' };
export const PEOPLE = ['湘', '德寶', '皮寶', '玩家'];

// 版本號 2026.11.28o：日期＋字母，字母可能變成兩個（…z、za）。先比日期，再比字母長度，再比字母。
export function cmpVersion(a, b) {
  const pa = String(a || '').match(/^(\d{4}\.\d{2}\.\d{2})([a-z]*)$/);
  const pb = String(b || '').match(/^(\d{4}\.\d{2}\.\d{2})([a-z]*)$/);
  if (!pa || !pb) return pa ? 1 : pb ? -1 : 0;
  if (pa[1] !== pb[1]) return pa[1] < pb[1] ? -1 : 1;
  if (pa[2].length !== pb[2].length) return pa[2].length - pb[2].length;
  return pa[2] === pb[2] ? 0 : pa[2] < pb[2] ? -1 : 1;
}

// 一個 bug 走到哪一步：open（待修）→ fixed（主分支已修，玩家版還沒有）→ live（玩家版有了，等複驗）→ verified（玩家版已驗）
export function bugStage(bug, liveVersion) {
  if (!bug.fixed) return 'open';
  if (bug.verified) return 'verified';
  if (bug.fixVersion && liveVersion && cmpVersion(liveVersion, bug.fixVersion) >= 0) return 'live';
  return 'fixed';
}
export const STAGE_LABEL = { open: '待修', fixed: '主分支已修・還沒上線', live: '玩家版有了・待驗', verified: '玩家版已驗' };

const ORDER = { open: 0, live: 1, fixed: 2, verified: 3 };
export function sortBugs(bugs, liveVersion) {
  return [...bugs].sort((a, b) => ORDER[bugStage(a, liveVersion)] - ORDER[bugStage(b, liveVersion)]
    || String(a.priority).localeCompare(String(b.priority))
    || String(b.created || '').localeCompare(String(a.created || '')));
}

// 活動開關時間：從遊戲本身的設定讀，不手抄。回傳依時間排好的 [{ at, label, kind }]
export function timeline() {
  const out = [];
  for (const def of Object.values(EVENT_DEFS)) {
    const s = schedule(def, 0);
    if (s.state === 'unscheduled') continue;
    out.push({ at: s.startMs, label: `${def.name}・開跑`, kind: 'event' });
    for (const p of def.phases) if (p.opensAfterH > 0) out.push({ at: s.startMs + p.opensAfterH * 3600e3, label: `${def.name}・${p.name}開放`, kind: 'event' });
    out.push({ at: s.battleEndMs, label: `${def.name}・討伐結束`, kind: 'event' });
    out.push({ at: s.shopEndMs, label: `${def.name}・活動結束／商店關閉（剩餘代幣換能量）`, kind: 'event' });
  }
  out.push({ at: Date.parse(STUDIO_OPEN), label: '頁邊茶肆・江湖分部出現', kind: 'event' });
  out.push({ at: Date.parse(SIDE_OPEN_AT), label: '島嶼不歸檔支線開放', kind: 'side' });
  return out.sort((a, b) => a.at - b.at);
}

const TPE = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
export function fmtTaipei(ms) {
  const parts = Object.fromEntries(TPE.formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
  return `${parts.month}/${parts.day}（${String(parts.weekday).replace('週', '')}）${parts.hour}:${parts.minute}`;
}
export function fmtLeft(ms) {
  if (ms <= 0) return '已經過了';
  const h = Math.ceil(ms / 3600e3);
  if (h < 24) return `還有 ${h} 小時`;
  const d = Math.floor(h / 24); const r = h % 24;
  return `還有 ${d} 天${r ? ` ${r} 小時` : ''}`;
}

export function emptyBoard() { return { v: 1, bugs: [], checks: {}, updated: null }; }
export function cleanBoard(raw) {
  const b = emptyBoard();
  if (!raw || typeof raw !== 'object') return b;
  const str = (x, n) => String(x ?? '').slice(0, n);
  b.bugs = (Array.isArray(raw.bugs) ? raw.bugs : []).filter((x) => x && x.id && x.title).map((x) => ({
    id: str(x.id, 40), title: str(x.title, 120), steps: str(x.steps, 2000), priority: PRIORITIES[x.priority] ? x.priority : 'P1',
    reporter: str(x.reporter, 20), fixVersion: str(x.fixVersion, 20), fixed: Boolean(x.fixed), verified: Boolean(x.verified),
    verifiedBy: str(x.verifiedBy, 20), verifiedAt: str(x.verifiedAt, 30), note: str(x.note, 600), created: str(x.created, 30),
  }));
  if (raw.checks && typeof raw.checks === 'object') for (const [v, list] of Object.entries(raw.checks)) {
    if (Array.isArray(list)) b.checks[str(v, 20)] = list.filter((c) => c && c.text).map((c) => ({ text: str(c.text, 200), done: Boolean(c.done) }));
  }
  b.updated = raw.updated ? str(raw.updated, 30) : null;
  return b;
}
export const newId = () => `bug-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// 第一次打開、雲端還沒有資料時放進去的範例：11/28 修好的四個 bug（玩家版都還沒驗）
export function sampleBoard(now = new Date().toISOString()) {
  const b = (id, title, priority, fixVersion, steps) => ({ id, title, steps, priority, reporter: '湘', fixVersion, fixed: true, verified: false, verifiedBy: '', verifiedAt: '', note: '', created: now });
  return {
    ...emptyBoard(),
    bugs: [
      b('bug-1128-team-name', '常用隊伍按「覆寫」會把隊名洗回「隊伍 1」', 'P1', '2026.11.28o',
        '1. 討伐 → 常用隊伍，把一隊改名（例如「江湖組」）\n2. 換三位成員後按「覆寫」\n3. 看隊名：修好前會變回「隊伍 1」，修好後要留著「江湖組」'),
      b('bug-1128-overnight-wins', '連戰到天亮只算第一場勝場', 'P1', '2026.11.28p',
        '1. 用「連戰到天亮」打一關，讓它連贏好幾場\n2. 收戰報後看成就（初陣、百戰）的進度\n3. 修好前只 +1，修好後每場打贏都要算；首勝、信物、劇情仍只看第一場'),
      b('bug-1128-moyu-leftover', '墨玉閣關門後剩下的墨玉沒去處', 'P1', '2026.11.28p',
        '1. 手上留一些墨玉\n2. 12/17 12:00 墨玉閣關門後打開遊戲\n3. 剩下的墨玉要 1:1 換成能量，只換一次；切出去再切回遊戲不能再換一次'),
      b('bug-1128-train-overlap', '特訓和討伐畫面疊在一起', 'P0', '2026.11.28m',
        '1. 打開特訓\n2. 等討伐隊伍回來，看完戰報按「再打一次」\n3. 修好前特訓和關卡同時出現；修好後直接換到關卡，特訓收起來'),
      b('bug-1128-train-longpress', '特訓長按小湘跳出「複製圖片／下載圖片」選單', 'P1', '2026.11.28j',
        '1. 用手機打開特訓\n2. 長按任一位小湘的格子\n3. 修好前跳出圖片選單；修好後顯示她的資訊小卡，也不會誤按特訓'),
    ],
    checks: {},
    updated: now,
  };
}
