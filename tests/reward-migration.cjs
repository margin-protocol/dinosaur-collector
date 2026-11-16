const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:8000');
  await page.locator('#intro-ok').click();
  await page.locator('#intro').waitFor({ state: 'hidden' });
  const key = 'siang-collector:v1';
  const egg = await page.evaluate(key => {
    const state = JSON.parse(localStorage.getItem(key));
    state.energy = 7;
    state.player.xp = 60;
    state.player.claimed = ['growth:1:1', 'growth:1:2'];
    delete state.player.energyClaimed;
    localStorage.setItem(key, JSON.stringify(state));
    return state.egg;
  }, key);
  const tabs = await Promise.all([context.newPage(), context.newPage()]);
  await Promise.all(tabs.map(tab => tab.goto('http://127.0.0.1:8000')));
  await Promise.all(tabs.map(tab => tab.locator('#energy-value').filter({ hasText: '47' }).waitFor()));
  for (let attempt = 0; attempt < 2; attempt++) {
    const state = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    assert.equal(state.energy, 47, 'two old claims receive 40 energy once across startup tabs');
    assert.equal(state.player.xp, 60, 'old XP is never awarded again');
    assert.deepEqual(state.egg, egg, 'incubation progress remains untouched');
    assert.deepEqual(state.player.energyClaimed, ['growth:1:1', 'growth:1:2']);
    await Promise.all(tabs.map(tab => tab.reload()));
  }
  console.log('Two-tab legacy growth energy backfill and repeated reload: single payment PASS');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
