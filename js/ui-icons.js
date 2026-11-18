// Local, scalable interface icons. Colour follows the selected theme through currentColor.
const PATHS = {
  wish: '<path d="m12 3 2.6 5.6 6.1.9-4.4 4.3 1 6.2-5.3-2.9-5.3 2.9 1-6.2-4.4-4.3 6.1-.9Z"/>',
  incubate: '<path d="M18 14c0 4-2.7 7-6 7s-6-3-6-7S9 3 12 3s6 7 6 11Z"/><path d="M8.5 14.5c0 2 1.1 3.5 2.5 4"/>',
  dex: '<rect x="4" y="4" width="6" height="6" rx="1.4"/><rect x="14" y="4" width="6" height="6" rx="1.4"/><rect x="4" y="14" width="6" height="6" rx="1.4"/><rect x="14" y="14" width="6" height="6" rx="1.4"/>',
  bond: '<path d="M20.5 5.5a5 5 0 0 0-7.1 0L12 7l-1.4-1.5a5 5 0 0 0-7.1 7.1L12 21l8.5-8.4a5 5 0 0 0 0-7.1Z"/>',
  errand: '<circle cx="5" cy="18" r="2"/><path d="M7 18h7a3 3 0 0 0 3-3v-3"/><path d="M17 12s4-3.8 4-6a4 4 0 0 0-8 0c0 2.2 4 6 4 6Z"/><circle cx="17" cy="6" r="1.1"/>',
  wheel: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2"/><path d="M12 3.5V10m0 4v6.5M3.5 12H10m4 0h6.5M6 6l4.5 4.5m3 3L18 18M6 18l4.5-4.5m3-3L18 6"/>',
  battle: '<path d="M12 3 4.5 6v5.5c0 4.5 3.5 7.8 7.5 10 4-2.2 7.5-5.5 7.5-10V6Z"/><path d="m12 7 1.2 3.8L17 12l-3.8 1.2L12 17l-1.2-3.8L7 12l3.8-1.2Z"/>',
  archive: '<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v15H7.5A2.5 2.5 0 0 0 5 20.5Zm0 15A2.5 2.5 0 0 0 7.5 23H20v-5M9 7h7M9 11h5"/>',
  fossils: '<path d="m12 3 7 6-3 11H8L5 9Zm-7 6h14M9 9l3 11 3-11M8.5 6h7"/>',
};
export function featureIcon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('feature-icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.6');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = PATHS[name] || PATHS.archive;
  return svg;
}
