// 台灣小湘故事動畫＋收到她的演出（湘 11/28）：圖鑑按鈕只在擁有 061 時出現、能播完 81 句、關掉回到圖鑑；出貨演出能播完。
const { chromium } = require('playwright'), assert = require('node:assert/strict');
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
  const c = await b.newContext({ viewport: { width: 360, height: 760 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }); const p = await c.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://127.0.0.1:8000'); if (await p.locator('#intro-ok').isVisible()) await p.click('#intro-ok');
  await p.evaluate(() => { const k = 'siang-collector:v1', s = JSON.parse(localStorage.getItem(k)); s.dex = { '001': { at: '2026-11-10T00:00:00Z' }, '016': { at: '2026-11-10T00:00:00Z' } }; s.hatched = 2; s.tutorial = null; localStorage.setItem(k, JSON.stringify(s)); localStorage.setItem('siang-collector:dex-world:v1', 'origin'); });
  await p.reload(); await p.waitForTimeout(400); if (await p.locator('#intro-ok').isVisible()) await p.click('#intro-ok');
  await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach((d) => d.close()); location.hash = 'dex'; }); await p.waitForTimeout(200);
  await p.locator('[data-dex-no="016"]').click(); await p.locator('#dex-detail[open]').waitFor();
  assert.equal(await p.locator('#dex-story-anim').isVisible(), false, '其他小湘不該有故事動畫按鈕');
  await p.evaluate(() => document.getElementById('dex-detail').close());
  await p.evaluate(() => { const k = 'siang-collector:v1', s = JSON.parse(localStorage.getItem(k)); s.dex['061'] = { at: '2026-11-28T00:00:00Z' }; localStorage.setItem(k, JSON.stringify(s)); });
  await p.reload(); await p.waitForTimeout(400); if (await p.locator('#intro-ok').isVisible()) await p.click('#intro-ok');
  await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach((d) => d.close()); location.hash = 'dex'; }); await p.waitForTimeout(200);
  await p.locator('[data-dex-no="061"]').click(); await p.locator('#dex-detail[open]').waitFor();
  await p.click('#dex-story-anim'); await p.locator('.tws').waitFor();
  assert.ok(await p.locator('.tws__county').count() >= 19, '地圖要畫出 19 縣市');
  let n = 0; while (await p.locator('.tws__end').isHidden() && n < 200) { await p.locator('.tws__box-text').click(); n++; }
  assert.equal(await p.locator('.tws__count').textContent(), '81 / 81');
  await p.click('.tws__end [data-a="close"]'); await p.locator('.tws').waitFor({ state: 'detached' });
  await p.locator('#dex-detail[open]').waitFor();
  assert.equal(await p.locator('#dex-detail-name').textContent(), '台灣小湘');
  for (const v of ['a', 'b', 'c']) {
    await p.evaluate(async (v) => { const m = await import('/js/taiwan-fx.js'); await m.playTaiwanFx({ variant: v }); }, v);
    assert.equal(await p.locator('.twx').count(), 0);
  }
  assert.deepEqual(errs, []); console.log('taiwan-story: 圖鑑按鈕、81 句播完回圖鑑、收到演出 a/b/c PASS'); await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
