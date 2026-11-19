// 小湘收集器｜91 位每日願望主持人的個人語氣（2026-11-19）
// 只改畫面台詞，不改願望 ID、選擇題選項、拍照條件與獎勵。
import { WISH_VOICE_EARLY } from './wish-voice-early.js';
import { WISH_VOICE_COLLECTION } from './wish-voice-collection.js';
import { WISH_VOICE_LATE } from './wish-voice-late.js';

export const WISH_CHARACTER_VOICES = { ...WISH_VOICE_EARLY, ...WISH_VOICE_COLLECTION, ...WISH_VOICE_LATE };
