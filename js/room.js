// Home display preferences are separate from the unchanged game save.
import { CHARACTERS, characterSources, loadWithFallback } from './eggs.js';
import { createSiangActor } from './actors.js';

export const ROOM_KEY = 'siang-collector:residents:v1';
export const ROOM_LIMIT = 3;
export function residentsFor(dex) {
  const owned = Object.keys(CHARACTERS).filter(no => dex[no]);
  try {
    const raw = localStorage.getItem(ROOM_KEY);
    if (raw !== null) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved)) return [...new Set(saved)].filter(no => owned.includes(no)).slice(0, ROOM_LIMIT);
    }
  } catch { /* Malformed preferences never alter the game save. */ }
  return owned.slice(0, ROOM_LIMIT);
}
export function saveResidents(ids) {
  try { localStorage.setItem(ROOM_KEY, JSON.stringify(ids)); return true; }
  catch { return false; }
}
export function welcomeResident(no, dex) {
  if (!CHARACTERS[no] || !dex[no]) return;
  const beforeArrival = { ...dex };
  delete beforeArrival[no];
  const current = residentsFor(beforeArrival);
  if (current.length < ROOM_LIMIT) current.push(no);
  // Freeze the previous residents even when an implicit default home was full.
  saveResidents(current);
}

export function createRoom(host, onGreet) {
  let signature = null;
  let actors = [];
  let active = false;
  const applyActivity = () => {
    host.dataset.active = String(active);
    actors.forEach(actor => active ? actor.start() : actor.stop());
  };
  return {
    update(dex) {
      const ids = residentsFor(dex);
      const next = ids.join(',');
      if (next === signature) return ids;
      actors.forEach(actor => actor.destroy());
      actors = [];
      host.replaceChildren();
      host.dataset.count = ids.length;
      signature = next;
      ids.forEach((no, index) => {
        const character = CHARACTERS[no];
        const lane = document.createElement('div');
        lane.className = `resident-slot resident-slot--${index}`;
        lane.dataset.character = no;
        let portrait;
        if (no === '001') {
          const actor = createSiangActor(lane, { initialX: .5, bounds: [.43, .57], inspectAt: .46 });
          actor.show(true);
          actors.push(actor);
          portrait = actor.el;
        } else {
          portrait = document.createElement('button');
          portrait.type = 'button';
          portrait.className = 'resident-static';
          const image = document.createElement('img');
          image.alt = character.name;
          loadWithFallback(image, characterSources(character.image));
          portrait.append(image);
          lane.append(portrait);
        }
        portrait.setAttribute('role', 'button');
        portrait.tabIndex = 0;
        portrait.setAttribute('aria-label', `與${character.name}打招呼`);
        portrait.addEventListener('click', () => onGreet(character));
        if (portrait.tagName !== 'BUTTON') portrait.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onGreet(character); }
        });
        const label = document.createElement('span');
        label.className = 'resident-name';
        label.textContent = character.name;
        lane.append(label);
        host.append(lane);
      });
      applyActivity();
      return ids;
    },
    setActive(value) { if (value !== active) { active = value; applyActivity(); } },
    cheer() { actors.forEach(actor => actor.cheer()); },
  };
}
