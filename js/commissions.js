// 湘的委託（照片任務）、記憶檔案與約會碼：遊戲端的資料處理
// 檔案結構（玩家的私人資料庫）
//   missions/<id>.json              湘蓋章的委託
//   submissions/<id>/<sid>.jpg|json 玩家提交的照片
//   reviews/<id>__<sid>.json        湘蓋章的審核結果
//   dates/<CODE>.json               湘蓋章的約會碼（幾分鐘內有效）
//   used/date-<CODE>.json           約會碼已使用
const str = (v) => typeof v === 'string';

export function ensureMissions(state) {
  const old = state.missions || {};
  state.missions = {
    list: Array.isArray(old.list) ? old.list.filter((m) => m && str(m.id) && str(m.title)) : [],
    status: old.status && typeof old.status === 'object' ? old.status : {},
    pending: old.pending && typeof old.pending === 'object' ? old.pending : {}, // id → { sid, thumb, at }
    notes: old.notes && typeof old.notes === 'object' ? old.notes : {}, // 退回時湘的批註
  };
  state.memories = Array.isArray(state.memories) ? state.memories.filter((m) => m && str(m.id)) : [];
  return state.missions;
}

// 照片壓縮：上傳用（長邊 1280）與本機縮圖（長邊 220）
export async function compressPhoto(file, max = 1280, quality = 0.82) {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  img.close?.();
  const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', quality));
  return new Uint8Array(await blob.arrayBuffer());
}
export async function thumbnail(file) {
  const bytes = await compressPhoto(file, 220, 0.62);
  let s = ''; for (const b of bytes) s += String.fromCharCode(b);
  return `data:image/jpeg;base64,${btoa(s)}`;
}

export const DATE_CODE = /^[A-HJ-NP-Z2-9]{6}$/; // 去掉容易看錯的 I、O、0、1
export const newDateCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
