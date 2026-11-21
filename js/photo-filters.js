// 外出合照濾鏡：預覽用 CSS filter（iPhone Safari 的影片也能即時套用），
// 存檔時用同一組步驟逐點算在畫布上（Safari 的 canvas 不支援 ctx.filter），所以預覽和照片長得一樣。
// 每個濾鏡 = 幾個 CSS 濾鏡函式（steps）＋ 可選的一層色調（tint）和暗角（vignette）。

export const PHOTO_FILTERS = [
  { id: 'none', name: '原圖', steps: [] },
  { id: 'warm', name: '暖陽', steps: [['sepia', 0.22], ['saturate', 1.18], ['brightness', 1.04]], tint: 'rgba(255,170,90,.08)' },
  { id: 'film', name: '底片', steps: [['sepia', 0.3], ['contrast', 0.88], ['saturate', 0.9], ['brightness', 1.06]], vignette: 0.32 },
  { id: 'mono', name: '黑白', steps: [['grayscale', 1], ['contrast', 1.15], ['brightness', 1.03]], vignette: 0.18 },
  { id: 'soft', name: '粉嫩', steps: [['contrast', 0.9], ['brightness', 1.08], ['saturate', 1.1]], tint: 'rgba(255,190,205,.16)' },
  { id: 'sakura', name: '櫻花', steps: [['hue-rotate', -8], ['saturate', 1.15], ['brightness', 1.05]], tint: 'rgba(255,150,185,.2)', vignette: 0.12 },
  { id: 'lilac', name: '薰衣草', steps: [['saturate', 0.85], ['hue-rotate', 12], ['brightness', 1.05]], tint: 'rgba(175,155,240,.2)' },
];
export const filterById = (id) => PHOTO_FILTERS.find((f) => f.id === id) || PHOTO_FILTERS[0];

const unit = { 'hue-rotate': 'deg' };
export function cssFilter(f) {
  return f.steps.length ? f.steps.map(([k, v]) => `${k}(${v}${unit[k] || ''})`).join(' ') : 'none';
}
// 疊在畫面最上層的色調／暗角（CSS background），和 drawOverlay 畫的一樣
export function overlayCss(f) {
  const layers = [];
  if (f.vignette) layers.push(`radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,${f.vignette}) 100%)`);
  if (f.tint) layers.push(`linear-gradient(${f.tint}, ${f.tint})`);
  return layers.join(', ') || 'none';
}

// Filter Effects 規格裡各函式對應的 3×3 色彩矩陣（＋ 位移）
function matrix([k, a]) {
  const s = 1 - a;
  switch (k) {
    case 'grayscale': return { m: [0.2126 + 0.7874 * s, 0.7152 - 0.7152 * s, 0.0722 - 0.0722 * s, 0.2126 - 0.2126 * s, 0.7152 + 0.2848 * s, 0.0722 - 0.0722 * s, 0.2126 - 0.2126 * s, 0.7152 - 0.7152 * s, 0.0722 + 0.9278 * s], o: 0 };
    case 'sepia': return { m: [0.393 + 0.607 * s, 0.769 - 0.769 * s, 0.189 - 0.189 * s, 0.349 - 0.349 * s, 0.686 + 0.314 * s, 0.168 - 0.168 * s, 0.272 - 0.272 * s, 0.534 - 0.534 * s, 0.131 + 0.869 * s], o: 0 };
    case 'saturate': return { m: [0.213 + 0.787 * a, 0.715 - 0.715 * a, 0.072 - 0.072 * a, 0.213 - 0.213 * a, 0.715 + 0.285 * a, 0.072 - 0.072 * a, 0.213 - 0.213 * a, 0.715 - 0.715 * a, 0.072 + 0.928 * a], o: 0 };
    case 'hue-rotate': {
      const r = a * Math.PI / 180, c = Math.cos(r), n = Math.sin(r);
      return { m: [0.213 + c * 0.787 - n * 0.213, 0.715 - c * 0.715 - n * 0.715, 0.072 - c * 0.072 + n * 0.928,
        0.213 - c * 0.213 + n * 0.143, 0.715 + c * 0.285 + n * 0.140, 0.072 - c * 0.072 - n * 0.283,
        0.213 - c * 0.213 - n * 0.787, 0.715 - c * 0.715 + n * 0.715, 0.072 + c * 0.928 + n * 0.072], o: 0 };
    }
    case 'brightness': return { m: [a, 0, 0, 0, a, 0, 0, 0, a], o: 0 };
    case 'contrast': return { m: [a, 0, 0, 0, a, 0, 0, 0, a], o: (0.5 - 0.5 * a) * 255 };
    default: return { m: [1, 0, 0, 0, 1, 0, 0, 0, 1], o: 0 };
  }
}

// 逐點套用（每一步都夾在 0–255，和瀏覽器一步一步算的結果一致）
export function applyToPixels(data, f) {
  const ms = f.steps.map(matrix); if (!ms.length) return data;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];
    for (const { m, o } of ms) {
      const nr = m[0] * r + m[1] * g + m[2] * b + o, ng = m[3] * r + m[4] * g + m[5] * b + o, nb = m[6] * r + m[7] * g + m[8] * b + o;
      r = nr < 0 ? 0 : nr > 255 ? 255 : nr; g = ng < 0 ? 0 : ng > 255 ? 255 : ng; b = nb < 0 ? 0 : nb > 255 ? 255 : nb;
    }
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
  return data;
}

export function drawOverlay(g, W, H, f) {
  if (f.vignette) {
    // CSS 的 ellipse at center（farthest-corner）：半徑 = 半寬／半高 × √2
    const R = (W / 2) * Math.SQRT2;
    g.save(); g.translate(W / 2, H / 2); g.scale(1, H / W);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, R);
    grad.addColorStop(0.55, 'rgba(0,0,0,0)'); grad.addColorStop(1, `rgba(0,0,0,${f.vignette})`);
    g.fillStyle = grad; g.fillRect(-W / 2, -W / 2, W, W); g.restore();
  }
  if (f.tint) { g.save(); g.fillStyle = f.tint; g.fillRect(0, 0, W, H); g.restore(); }
}

export function applyPhotoFilter(g, W, H, f) {
  if (f.steps.length) { const img = g.getImageData(0, 0, W, H); applyToPixels(img.data, f); g.putImageData(img, 0, 0); }
  drawOverlay(g, W, H, f);
}
