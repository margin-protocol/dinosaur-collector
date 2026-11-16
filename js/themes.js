export const THEME_KEY = 'siang-collector:theme:v1';
export const THEMES = [
  { id: 'cream', name: '晨光奶油', caption: '暖暖陽光，柔柔地醒來', color: '#f9f2e6' },
  { id: 'sakura', name: '櫻花汽水', caption: '一點粉紅，今天也可愛', color: '#fff0f3' },
  { id: 'daylight', name: '晴空藍', caption: '把好心情，交給晴朗天空', color: '#eef6fc' },
  { id: 'lilac', name: '月霧紫', caption: '溫柔月光，最初的相遇', color: '#151722' },
  { id: 'mint', name: '薄荷星海', caption: '清透綠意，安靜地陪伴', color: '#101e20' },
  { id: 'blue', name: '靜夜藍', caption: '把每個心願，留給星空', color: '#111b2b' },
  { id: 'rose', name: '玫瑰暮色', caption: '一點暖意，慢慢靠近你', color: '#24191f' },
];
export const validTheme = id => THEMES.some(theme => theme.id === id) ? id : 'lilac';
export function readTheme() {
  try { return validTheme(localStorage.getItem(THEME_KEY)); } catch { return 'lilac'; }
}
export function applyTheme(id) {
  const theme = THEMES.find(theme => theme.id === validTheme(id));
  document.documentElement.dataset.theme = theme.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.color);
  return theme;
}
export function setupThemes({ onOpen = () => {} } = {}) {
  const $ = id => document.getElementById(id);
  const dialog = $('theme-dialog');
  const choices = $('theme-choices');
  choices.replaceChildren(...THEMES.map(theme => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'theme-choice'; button.dataset.palette = theme.id;
    const art = document.createElement('span'); art.className = 'theme-choice__preview'; art.setAttribute('aria-hidden', 'true');
    art.innerHTML = '<i></i><i></i><i></i><span>SIANG</span>';
    const name = document.createElement('b'); name.textContent = theme.name;
    const caption = document.createElement('small'); caption.textContent = theme.caption;
    const status = document.createElement('span'); status.className = 'theme-choice__state';
    button.append(art, name, caption, status); return button;
  }));
  let selected = readTheme();
  function render(message) {
    const theme = applyTheme(selected);
    for (const button of choices.children) {
      const active = button.dataset.palette === theme.id;
      button.setAttribute('aria-pressed', String(active));
      button.querySelector('.theme-choice__state').textContent = active ? '✓ 使用中' : '點選套用';
    }
    $('theme-status').textContent = message || `現在是${theme.name}，選一個喜歡的顏色吧。`;
  }
  choices.addEventListener('click', event => {
    const button = event.target.closest('[data-palette]'); if (!button) return;
    const id = validTheme(button.dataset.palette);
    selected = id;
    try { localStorage.setItem(THEME_KEY, id); render(`已換成${THEMES.find(t => t.id === id).name}，下次回來也會記得。`); }
    catch { render('已套用；目前無法儲存配色，下次開啟可能需要再選一次。'); }
  });
  $('open-themes').addEventListener('click', () => { $('function-center').close(); render(); dialog.showModal(); onOpen(); });
  $('close-themes').addEventListener('click', () => dialog.close());
  $('theme-done').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { if (!document.querySelector('dialog[open]')) $('open-center').focus({ preventScroll: true }); });
  addEventListener('storage', event => { if (event.key === THEME_KEY || event.key === null) { selected = readTheme(); render(); } });
  render();
}
