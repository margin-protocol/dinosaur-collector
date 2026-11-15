const {chromium} = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
  for (const width of [360, 390, 430]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:8000'); await page.locator('#intro-ok').click();
    assert.equal(await page.locator('main[data-view="home"] .incubator').count(), 0);
    assert.equal(await page.locator('.resident-slot').count(), 0);
    assert(await page.locator('#room-empty').isVisible());
    await page.locator('#open-residents').click();
    assert.equal(await page.locator('.resident-choice').count(), 0);
    await page.getByRole('button', {name:'前往培育', exact:true}).click();
    assert(await page.locator('.incubator').isVisible());
    await page.reload(); assert.equal(await page.locator('body').getAttribute('data-view'), 'incubate');
    await page.locator('#back-home').click();
    // Existing collection fixture, not new unlocks or production save data.
    await page.evaluate(() => { const k='siang-collector:v1'; const s=JSON.parse(localStorage.getItem(k));
      s.dex=Object.fromEntries(['001','002','003','004'].map(no=>[no,{at:'2026-11-15T00:00:00Z'}]));
      s.energy=70; s.fossils=3; localStorage.setItem(k,JSON.stringify(s)); });
    await page.reload();
    assert.equal(await page.locator('.resident-slot').count(), 3);
    const before = await page.evaluate(() => localStorage.getItem('siang-collector:v1'));
    await page.waitForFunction(() => [...document.images].every(i=>i.complete));
    await page.screenshot({path:`docs/review/companion-three-${width}.png`,fullPage:true});
    await page.locator('#open-residents').click();
    assert.equal(await page.locator('#resident-lanes').getAttribute('data-active'), 'false');
    assert.equal(await page.locator('.resident-choice').count(), 4);
    const fontFamilies = await page.locator('#nav .nav__item').evaluateAll(items=>items.map(i=>getComputedStyle(i).fontFamily));
    assert(fontFamilies.every(f=>f===fontFamilies[0]));
    await page.locator('[data-no="004"]').click();
    assert.match(await page.locator('#residents-feedback').textContent(), /最多入住三位/);
    await page.locator('[data-no="002"]').click();
    await page.locator('[data-no="004"]').click();
    await page.screenshot({path:`docs/review/companion-residents-${width}.png`,fullPage:true});
    await page.locator('#residents-done').click();
    await page.reload();
    assert.deepEqual(await page.locator('.resident-slot').evaluateAll(nodes=>nodes.map(n=>n.dataset.character)), ['001','003','004']);
    assert.equal(await page.evaluate(() => localStorage.getItem('siang-collector:v1')), before, 'roster must not mutate game progress');
    // A second tab observes roster changes through the storage event.
    const second=await context.newPage(); await second.goto('http://127.0.0.1:8000');
    await page.locator('#open-residents').click();
    for (const no of ['001','003','004']) await page.locator(`[data-no="${no}"]`).click();
    await page.locator('#residents-done').click();
    await second.waitForFunction(()=>document.querySelectorAll('.resident-slot').length===0);
    await second.close(); await page.reload();
    assert.equal(await page.locator('.resident-slot').count(),0,'explicit empty home persists');
    // Unknown, duplicate and unowned ids never become home characters.
    await page.evaluate(()=>{const k='siang-collector:v1';const s=JSON.parse(localStorage.getItem(k));s.dex={'001':s.dex['001']};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['unknown','002','001','001']));});
    await page.reload(); assert.equal(await page.locator('.resident-slot').count(),1);
    await page.waitForFunction(()=>[...document.images].every(i=>i.complete));
    await page.screenshot({path:`docs/review/companion-single-${width}.png`,fullPage:true});
    for (const height of [612,844]) {
      await page.setViewportSize({width,height});
      assert(await page.evaluate(w=>innerWidth===w && document.documentElement.scrollWidth<=w,width));
      assert(await page.evaluate(()=>document.querySelector('.game-footer').getBoundingClientRect().top>=document.querySelector('.home-actions').getBoundingClientRect().bottom));
      await page.locator('#enter-incubator').click(); await page.locator('#back-home').click();
    }
    await page.evaluate(()=>localStorage.setItem('siang-collector:residents:v1','{broken'));
    await page.reload(); assert.equal(await page.locator('.resident-slot').count(),1,'malformed display preferences preserve the collection');
    // A newly hatched companion never evicts a full home; duplicates award fossils only.
    await page.evaluate(()=>{const k='siang-collector:v1';const s=JSON.parse(localStorage.getItem(k));s.dex=Object.fromEntries(['002','003','004'].map(no=>[no,{at:'2026-11-15T00:00:00Z'}]));s.egg={id:'origin',warmth:100,since:new Date().toISOString()};localStorage.setItem(k,JSON.stringify(s));localStorage.removeItem('siang-collector:residents:v1');location.hash='incubate';});
    await page.reload(); await page.locator('#cultivate').click(); await page.locator('#reveal-ok').click();
    assert.equal(await page.locator('.resident-slot').count(),3);
    assert.deepEqual(await page.locator('.resident-slot').evaluateAll(nodes=>nodes.map(n=>n.dataset.character)),['002','003','004']);
    const fossils=await page.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')).fossils);
    assert(await page.evaluate(()=>Boolean(JSON.parse(localStorage.getItem('siang-collector:v1')).dex['001'])));
    await page.evaluate(()=>{const k='siang-collector:v1';const s=JSON.parse(localStorage.getItem(k));s.egg={id:'origin',warmth:100,since:new Date().toISOString()};localStorage.setItem(k,JSON.stringify(s));location.hash='incubate';});
    await page.reload(); await page.locator('#cultivate').click(); await page.locator('#reveal-ok').click();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')).fossils),fossils+3);
    assert.equal(await page.locator('.resident-slot').count(),3);
    assert.equal(errors.length,0,errors.join('\n'));
    console.log(`${width}px: empty/three/single home, three-resident limit, saved choices, cross-tab sync, unchanged progress, owned-only selection, routing and bounds PASS`);
    await context.close();
  }
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
