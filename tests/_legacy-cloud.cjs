// 舊版 GitHub 連線的測試用：雲端設定裡的「舊方式」區塊預設是收起來的，這裡讓每個新分頁一打開就展開
const pw = require('playwright');
const launch = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async (...args) => {
  const browser = await launch(...args);
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (...a) => {
    const ctx = await newContext(...a);
    await ctx.addInitScript(() => document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('#cloud-legacy,#rv-legacy').forEach((d) => { d.open = true; })));
    return ctx;
  };
  return browser;
};
