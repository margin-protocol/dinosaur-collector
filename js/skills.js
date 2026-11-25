// 居民專屬技能（2.0 · 湘 11/25）：一般技能跟好感技能活動結束後也一直有效；活動特性（墨玉加成）寫在 events.js 的 tokenBonus。
// 數值規則（湘 11/25 選推薦）：技能的減時跟羈絆、料理共用同一個上限（battle.js SPEED_CAP 25%），剋制另外算。
// 這樣聞止水＋海棠新娘小湘大約 −20%，還沒碰到上限；別的隊伍配料理也能打到 −25%，不會變成唯一最佳隊伍。
export const SKILLS = {
  'MO-001': {
    name: '寸步不離', text: '擔任隊員時，全隊討伐時間 −10%', speed: 0.10,
    lv5: { name: '此身為盾', text: '好感 Lv.5，和任一位創始系列的小湘同隊時，全隊戰力 +5%', power: 0.05, withWorld: 'origin' },
  },
};
// level(no)：好感等級；world(no)：世界代碼（創始系列＝'origin'）
export function teamSkills(nos, { level = () => 1, world = () => 'origin' } = {}) {
  let speed = 0, power = 0; const list = [];
  for (const no of nos) {
    const s = SKILLS[no]; if (!s) continue;
    if (s.speed || s.power) { speed += s.speed || 0; power += s.power || 0; list.push({ no, name: s.name, text: s.text }); }
    const l5 = s.lv5;
    if (l5 && level(no) >= 5 && (!l5.withWorld || nos.some((n) => n !== no && world(n) === l5.withWorld))) { speed += l5.speed || 0; power += l5.power || 0; list.push({ no, name: l5.name, text: l5.text }); }
  }
  return { speed: Math.round(speed * 100) / 100, power: Math.round(power * 100) / 100, list };
}
