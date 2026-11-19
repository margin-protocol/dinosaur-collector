// 普通蛋、願望蛋與討伐徽章兌換｜勇者小隊（No.062–064）
// 台詞來源：data/characters/badge-heroes-dialogue.json（皮寶 11/18 交付）。遊戲不直接讀 JSON，改台詞時兩邊一起改。
// 價格與條件：湘寶 11/18 拍板——騎士、魔法師各 20 枚，勇者 40 枚且兩章 Boss 都打過。

export const HERO_SHOP = [
  { no: '062', key: 'knight', cost: 20 },
  { no: '063', key: 'mage', cost: 20 },
  { no: '064', key: 'hero', cost: 40, requires: ['caramel-king', 'thunder-king'], requireText: '先打倒第 1 章和第 2 章的 Boss' },
];

export const HERO_LINES = {
  '062': {
    signature: '別怕，我會保護你的！……等一下，盾牌是不是拿反了？',
    dispatch: '騎士小湘，奉命出征！今天也要把大家平平安安帶回家！',
    victory: '任務完成！嘿嘿，有沒有覺得我剛剛超帥氣？',
    defeat: '嗚……這次沒守住。但下次，我一定會站得更穩！',
    idle: '盾牌擦亮了，披風也整理好了！隨時可以出發！',
    bond: '如果是你的話，我願意一直當你的騎士喔。',
    redeem: '鏘鏘！專屬騎士報到！以後就由我守護你啦！',
  },
  '063': {
    signature: '站好不要動喔！這次的魔法……應該不會爆炸吧？',
    dispatch: '星星、月亮、還有一點點草莓糖漿……好！魔法準備完成！',
    victory: '成功了耶！我就說這次不會爆炸嘛！……咦，那邊怎麼在冒煙？',
    defeat: '奇怪，咒語沒有錯呀……啊！我把『攻擊』念成『開飯』了！',
    idle: '噓……我正在研究把星期一變成星期日的魔法。',
    bond: '我把最珍貴的幸運魔法留給你，這個不會爆炸，真的！',
    redeem: '叮咚！魔法師小湘加入隊伍！請不要隨便翻我的魔法書喔！',
  },
  '064': {
    signature: '魔王打完了嗎？那我可以回家吃點心了吧？',
    dispatch: '好啦好啦，我知道了。魔王在哪裡？我想趕在甜點店打烊前回家。',
    victory: '咦？結束了？那我剛剛預訂的布丁還來得及拿吧？',
    defeat: '唔……看來今天得認真一點了。先說好，打完要請我吃兩份。',
    idle: '大劍很重欸……可以先放下來吃個點心嗎？',
    bond: '世界和平很重要，但我最想守護的，還是和你一起的日常。',
    redeem: '傳說中的勇者小湘登場！所以……慶功宴在哪裡？',
  },
};

export const PARTY_LINES = [
  { speaker: '騎士小湘', text: '我負責保護大家！' },
  { speaker: '魔法師小湘', text: '我負責最厲害的魔法！' },
  { speaker: '勇者小湘', text: '……那我負責吃戰勝後的慶功宴？' },
  { speaker: '騎士小湘、魔法師小湘', text: '妳倒是負責打魔王啊！！' },
];
export const PARTY_REPORT = '勇者小隊集結！盾牌擋住攻擊，星光照亮戰場，勇者小湘終於放下點心拔出了大劍！';

export const isHero = (no) => Boolean(HERO_LINES[no]);
export const heroOffer = (no) => HERO_SHOP.find((x) => x.no === no) || null;
