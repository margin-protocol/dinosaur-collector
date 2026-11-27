// 研究室調配完成演出（湘 11/27）：時間到存檔先寫好紀念蛋，再播 .lfx；可跳過、會自己結束；兩格同時完成就播兩次；隱藏配方是金色版
const { chromium } = require('playwright'), assert = require('node:assert/strict');
const key = 'siang-collector:v1';
(async () => {
const b = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
const run = async (width, labs, { skip = true } = {}) => {
  const c = await b.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8000'); await p.locator('#intro-ok').click(); await p.locator('#intro').waitFor({ state: 'hidden' });
  await p.evaluate(([k, labs]) => { const s = JSON.parse(localStorage.getItem(k)); s.tutorial = null; const now = Date.now();
    const nos = labs.flatMap(l => l.members); s.dex = Object.fromEntries(['001', ...nos].map(n => [n, { at: '2026-11-01' }])); s.hatched = nos.length + 1; s.labSlots = labs.length;
    labs.forEach((l, i) => { s[i ? 'lab2' : 'lab'] = { recipe: l.recipe, members: l.members, start: new Date(now - 4 * 864e5).toISOString(), until: new Date(now - 6e4).toISOString() }; });
    localStorage.setItem(k, JSON.stringify(s)); }, [key, labs]);
  await p.reload();
  const fx = p.locator('.lfx');
  for (const l of labs) { 
    await fx.waitFor({ timeout: 8000 }); const h = await fx.elementHandle();
    const s = await p.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
    assert.equal(s.lab, null); assert.equal(s.lab2 ?? null, null); assert.equal(s.gifts.eggs.filter(e => String(e.from).startsWith('recipe:')).length, labs.length, 'eggs saved before the show');
    assert.equal(await h.getAttribute('data-secret'), l.secret ? '1' : '0');
    assert.equal(await fx.locator('.lfx__pname').count() > 0, true);
    assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no sideways scroll');
    if (skip) await (await h.$('button')).click();
    await p.waitForFunction(el => !el.isConnected, h, { timeout: 6000 });
  }
  await p.waitForFunction(() => document.getElementById('toast').textContent.includes('調配完成'), null, { timeout: 4000 });
  assert.equal(await fx.count(), 0); assert.equal(errs.length, 0, errs.join('\n')); await c.close();
};
for (const w of [360, 390, 430]) { await run(w, [{ recipe: 'strawberry-cake', members: ['002', '005'] }]); console.log(`${w}px one recipe: show + skip + toast PASS`); }
await run(390, [{ recipe: 'strawberry-cake', members: ['002', '005'] }, { recipe: 'margin-chief', members: ['MO-009', 'MO-010'], secret: true }]); console.log('two slots: two shows, secret is gold PASS');
await run(390, [{ recipe: 'rain-garden', members: ['006', '003'] }], { skip: false }); console.log('auto-finish PASS');
await b.close();
})().catch(e => { console.error(e); process.exit(1); });
