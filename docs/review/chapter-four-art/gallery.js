const viewer = document.getElementById('viewer');
let opener = null;
function close() { viewer.close(); }
document.querySelectorAll('[data-art]').forEach(link => link.addEventListener('click', event => {
  if (typeof viewer.showModal !== 'function' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault(); opener = link;
  const card = link.closest('article'), source = link.querySelector('img'), image = document.createElement('img');
  image.src = link.href; image.alt = source.alt; image.width = source.width; image.height = source.height;
  const area = document.getElementById('viewer-image'); area.classList.toggle('cutout',link.classList.contains('cutout')); area.replaceChildren(image);
  document.getElementById('viewer-title').textContent = card.querySelector('h2').textContent;
  document.getElementById('viewer-caption').textContent = card.querySelector('.card-copy>p').textContent;
  document.getElementById('viewer-original').href = card.querySelector('.file-links a').href;
  image.onerror = () => { document.getElementById('viewer-caption').textContent = '圖片暫時無法載入，可開啟下方 PNG 原圖。'; };
  viewer.showModal(); viewer.scrollTop = 0; document.getElementById('close').focus({preventScroll:true});
}));
document.getElementById('close').onclick = close;
viewer.addEventListener('click', event => {
  if (event.target !== viewer) return;
  const r = viewer.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
});
viewer.addEventListener('close', () => { document.getElementById('viewer-image').replaceChildren(); if(opener?.isConnected) opener.focus({preventScroll:true}); });
