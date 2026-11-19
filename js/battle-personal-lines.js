// 小湘收集器｜原本沒有專屬討伐台詞的 61 位：出征、勝利、戰敗。
// No.001–061 中缺少專屬台詞者的原創台詞；另外 30 位的原有正式文案仍由其他模組提供。
import { BATTLE_EARLY_LINES } from './battle-lines-early.js';
import { BATTLE_COUNTY_LINES } from './battle-lines-county.js';
import { BATTLE_COLLECTION_LINES } from './battle-lines-collection.js';

export const BATTLE_PERSONAL_LINES = { ...BATTLE_EARLY_LINES, ...BATTLE_COUNTY_LINES, ...BATTLE_COLLECTION_LINES };
