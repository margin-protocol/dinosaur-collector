// 節日小湘：節日前後 3 天（共 7 天）打開遊戲，會收到一顆紀念蛋，固定孵出那個節日的小湘。每年各一次。
// 壽星小湘只在 7/14 當天（企劃書已定：不提供補救）。七夕用農曆判斷。
const lunar = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', { month: 'numeric', day: 'numeric' });
const lunarMD = (d) => { const p = Object.fromEntries(lunar.formatToParts(d).map((x) => [x.type, x.value])); return [p.month, p.day]; };
const solar = (m, day) => (d) => d.getMonth() + 1 === m && d.getDate() === day;

export const HOLIDAYS = [
  { id: 'valentine', name: '情人節', no: '056', on: solar(2, 14), window: 3, when: '2/14' },
  { id: 'white-day', name: '白色情人節', no: '057', on: solar(3, 14), window: 3, when: '3/14' },
  { id: 'birthday', name: '小湘生日', no: '015', on: solar(7, 14), window: 0, when: '7/14 當天' },
  { id: 'qixi', name: '七夕', no: '059', on: (d) => { const [m, day] = lunarMD(d); return m === '7' && day === '7'; }, window: 3, when: '農曆 7/7' },
  { id: 'halloween', name: '萬聖節', no: '060', on: solar(10, 31), window: 3, when: '10/31' },
  { id: 'christmas', name: '聖誕節', no: '058', on: solar(12, 25), window: 3, when: '12/25' },
];

// 今天落在哪些節日的期間裡；key 用節日當天的年份，每年各一次
export function activeHolidays(now = new Date()) {
  const out = [];
  for (const h of HOLIDAYS) {
    for (let off = -h.window; off <= h.window; off += 1) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + off, 12);
      if (h.on(d)) { out.push({ ...h, key: `${h.id}-${d.getFullYear()}` }); break; }
    }
  }
  return out;
}

// 一次性的紀念活動：期間內打開遊戲領一顆紀念蛋（每個活動一次）
export const EVENTS = [
  { id: 'civic-2026', key: 'civic-2026', name: '115 年九合一大選紀念', no: '099', from: '2026-11-20', to: '2026-11-27', when: '115/11/20–11/27' },
];
export function activeEvents(now = new Date()) {
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return EVENTS.filter((e) => d >= e.from && d <= e.to);
}
// 投票日提醒（湘 11/20）：當天第一次打開遊戲跳一次
export const VOTE_DAYS = [{ key: 'vote-2026', date: '2026-11-28', no: '099' }];

export const TAIWAN_NO = '061';
