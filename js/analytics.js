// Cloudflare Web Analytics（湘 11/26）：免費、不用 cookie、不記個人資料，只看「有多少人來、看了哪些頁」。
// 兩個網址各一組 token（在 Cloudflare 後台 Web Analytics 看）；測試服（?test）、本機不載入。
(function () {
  var TOKENS = {
    'margin-protocol.github.io': '9ad11b4dc9bb4b59812cd5f4b4985067',
    'betweenthepages.pages.dev': 'afc16aeb39ab45ca84f86176d71a2abc',
  };
  try {
    if (globalThis.__SIANG_TEST__ || /(^|[?&])test(=|&|$)/.test(location.search.slice(1))) return;
    var token = TOKENS[location.hostname];
    if (!token) return;
    var s = document.createElement('script');
    s.defer = true;
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', JSON.stringify({ token: token }));
    document.head.appendChild(s);
  } catch (e) {}
})();
