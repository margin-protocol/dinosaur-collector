import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

mkdirSync('trailer-output/raw', { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 1,
  isMobile: true, hasTouch: true, locale: 'zh-TW', colorScheme: 'dark',
  recordVideo: { dir: 'trailer-output/raw', size: { width: 390, height: 844 } },
});
await context.addInitScript(() => {
  if (location.hostname !== '127.0.0.1') return;
  const today = new Date().toISOString();
  const demo = {
    seenIntro: true, egg: { id: 'ordinary', warmth: 105, since: today },
    dex: { '001': { at: today }, '002': { at: today }, '003': { at: today } },
    energy: 120, fossils: 5, hatched: 3, wishes: null,
  };
  localStorage.setItem('siang-collector:v1', JSON.stringify(demo));
  localStorage.setItem('siang-collector:residents:v1', JSON.stringify(['001']));
  localStorage.setItem('siang-collector:theme:v1', 'rose');
});
const page = await context.newPage();
page.on('pageerror', e => console.error('Page script:', e.message));
await page.goto('http://127.0.0.1:8765/', { waitUntil: 'load', timeout: 30000 });
await page.waitForSelector('#home-wishes', { state: 'visible' });
// A temporary in-browser demo save only: genuine HTML, CSS, JS and game assets.
async function go(view) {
  await page.evaluate(target => {
    document.querySelectorAll('dialog[open]').forEach(d => d.close());
    if (target === 'home') document.querySelector('#back-home')?.click();
    if (target === 'wish') document.querySelector('#home-wishes')?.click();
    if (target === 'incubate') document.querySelector('#enter-incubator')?.click();
    if (target === 'dex') {
      document.querySelector('#open-center')?.click();
      document.querySelector('.nav__item[data-view="dex"]')?.click();
    }
  }, view);
}
await page.waitForTimeout(3000);
await go('wish'); await page.waitForTimeout(3200);
await go('home'); await page.waitForTimeout(800);
await go('incubate'); await page.waitForTimeout(3200);
await go('dex'); await page.waitForTimeout(3000);
await go('home'); await page.waitForTimeout(1800);
const video = await page.video();
await page.close();
await context.close();
await browser.close();
const input = await video.path();
execFileSync('ffmpeg', ['-y','-loglevel','error','-i',input,
  '-vf','scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x16131c,format=yuv420p',
  '-c:v','libx264','-preset','medium','-crf','22','-movflags','+faststart',
  '-an','trailer-output/siang-collector-real-game-teaser.mp4'], { stdio: 'inherit' });
console.log('Created trailer-output/siang-collector-real-game-teaser.mp4');
