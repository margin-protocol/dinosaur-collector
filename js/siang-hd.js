// Native 1254px transparent frames; offsets register supporting soles to y=1149.
const frame = (name, offsetY = 0, scale = 1) => ({ src: `assets/characters/siang-001-hd/${name}.webp?v=1`, offsetY, scale });
const open = frame('idle-open');
const closed = frame('idle-closed');
const crouch = frame('crouch', -1.55742, .93);
const seated = frame('sit-open', .31898);
const sleeping = frame('sit-closed', .39872);
export const SIANG_ANIMS = {
  idle: { frames: [open, closed], ms: [3200, 180] },
  walk: { frames: [frame('walk-01', -.23923), frame('walk-02', .07974), frame('walk-03'), frame('walk-04', .07974), frame('walk-05', -.47847), frame('walk-06', -.15949), frame('walk-07', -.23923), frame('walk-08', -.23923)], ms: Array(8).fill(140) },
  sit: { frames: [seated, sleeping], ms: [4200, 200] },
  lower: { frames: [open, crouch, seated], ms: [80, 140, 80] },
  rise: { frames: [seated, crouch, open], ms: [80, 140, 80] },
};
const decoded = new Map();
export function prepareSiangFrames() {
  for (const { frames } of Object.values(SIANG_ANIMS)) for (const { src } of frames) {
    if (!decoded.has(src)) {
      const image = new Image();
      image.src = new URL(src, new URL('../', import.meta.url)).href;
      decoded.set(src, { image, ready: image.decode().catch(error => { decoded.delete(src); throw error; }) });
    }
  }
  return Promise.all([...decoded.values()].map(entry => entry.ready));
}
