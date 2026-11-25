// 測試服（湘 11/25）：網址後面加 ?test 就進測試服，用來從頭跑活動劇情、找問題。
// 一般玩家打開遊戲時這個檔案什麼都不做（網址沒有 test）。
// 測試服做的事：
// 1. 所有 localStorage／sessionStorage 的 key 前面自動加上「siang-test:」，跟正式存檔完全分開，不會讀到也不會蓋到。
// 2. 不連後台：Cloudflare Worker（雲端備份、通知、審查室）和 GitHub 備份的請求一律擋掉，不會寫進正式 D1。
// 3. 第一次打開時（js/test-server.js）送一份全滿的存檔：全部小湘和活動居民、好感 Lv.5、5 星、特訓滿級。
// 4. 活動不看日期：上卷、下卷一開就能打；討伐 15 秒回來、不用休息。
// 必須放在 index.html 最前面（主題那行 script 之前），因為它要比任何讀存檔的程式更早執行。
(function () {
  var on = false;
  try { on = /(^|[?&])test(=|&|$)/.test(location.search.slice(1)); } catch (e) {}
  if (!on) return;
  globalThis.__SIANG_TEST__ = true;
  var PREFIX = 'siang-test:';
  var S = Storage.prototype;
  var wrap = function (k) { k = String(k); return k.indexOf(PREFIX) === 0 ? k : PREFIX + k; };
  var get = S.getItem, set = S.setItem, del = S.removeItem;
  S.getItem = function (k) { return get.call(this, wrap(k)); };
  S.setItem = function (k, v) { return set.call(this, wrap(k), v); };
  S.removeItem = function (k) { return del.call(this, wrap(k)); };
  // 清掉測試服的資料（重新拿一份全滿存檔）；正式存檔不會被動到
  globalThis.__SIANG_TEST_RESET__ = function () {
    for (var st of [localStorage, sessionStorage]) {
      var keys = [];
      for (var i = 0; i < st.length; i++) { var k = st.key(i); if (k && k.indexOf(PREFIX) === 0) keys.push(k); }
      keys.forEach(function (k) { del.call(st, k); });
    }
  };
  // 「重新開始」：按鈕先留記號再重新整理，在遊戲程式載入前清（免得關頁面時又把舊進度存回去）
  if (get.call(sessionStorage, PREFIX + '__reset')) globalThis.__SIANG_TEST_RESET__();
  var blocked = function (url) {
    try { var u = new URL(url, location.href); return /workers\.dev$/.test(u.hostname) || u.hostname === 'api.github.com'; } catch (e) { return false; }
  };
  var realFetch = globalThis.fetch;
  globalThis.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input && input.url;
    if (blocked(url)) return Promise.reject(new TypeError('測試服不連後台'));
    return realFetch.call(this, input, init);
  };
  // 畫面上的「測試服」小標籤：點開可以重新拿一份全滿存檔，或回正式服
  addEventListener('DOMContentLoaded', function () {
    var box = document.createElement('div');
    box.id = 'test-server-tag';
    box.innerHTML = '<button type="button" class="tst-pill" aria-expanded="false">測試服</button>'
      + '<div class="tst-menu" hidden><p>這裡的存檔跟正式服分開，不會上傳。<br>討伐 15 秒回來；活動上下卷都開著。</p>'
      + '<button type="button" class="tst-reset">重新開始（回到全滿存檔）</button>'
      + '<a class="tst-exit" href="./">回正式服</a></div>';
    var css = document.createElement('style');
    css.textContent = '#test-server-tag{position:fixed;z-index:2147483000;top:calc(env(safe-area-inset-top,0px) + 4px);left:50%;transform:translateX(-50%);font:600 12px/1.2 system-ui,sans-serif;text-align:center}'
      + '#test-server-tag .tst-pill{border:0;border-radius:999px;padding:3px 10px;background:#e0475b;color:#fff;letter-spacing:.08em;box-shadow:0 2px 6px rgba(0,0,0,.25)}'
      + '#test-server-tag .tst-menu{margin-top:6px;width:min(280px,calc(100vw - 32px));padding:12px;border-radius:12px;background:#fff;color:#2a2230;box-shadow:0 6px 24px rgba(0,0,0,.3);font-weight:400;font-size:13px;line-height:1.5}'
      + '#test-server-tag .tst-menu[hidden]{display:none}#test-server-tag p{margin:0 0 10px}'
      + '#test-server-tag .tst-reset,#test-server-tag .tst-exit{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:9px;border-radius:9px;border:1px solid #e0475b;background:#fff;color:#c2334a;font:600 13px system-ui,sans-serif;text-decoration:none}'
      + '#test-server-tag .tst-reset.is-sure{background:#e0475b;color:#fff}';
    document.head.appendChild(css);
    document.body.appendChild(box);
    var pill = box.querySelector('.tst-pill'), menu = box.querySelector('.tst-menu'), reset = box.querySelector('.tst-reset');
    pill.addEventListener('click', function () { menu.hidden = !menu.hidden; pill.setAttribute('aria-expanded', String(!menu.hidden)); reset.classList.remove('is-sure'); reset.textContent = '重新開始（回到全滿存檔）'; });
    reset.addEventListener('click', function () {
      if (!reset.classList.contains('is-sure')) { reset.classList.add('is-sure'); reset.textContent = '確定？測試服進度會清掉'; return; }
      sessionStorage.setItem('__reset', '1'); location.reload();
    });
  });
  if (navigator.sendBeacon) { var beacon = navigator.sendBeacon.bind(navigator); navigator.sendBeacon = function (url, data) { return blocked(url) ? false : beacon(url, data); }; }
})();
