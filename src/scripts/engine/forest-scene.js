/* Decorative SVG world; no gameplay clock or additional frame loop. */
(function (root) {
  'use strict';
  const screen = document.getElementById('typingGame');
  const field = document.getElementById('typingField');
  const host = field.querySelector('.spell-forest');
  const tree = (x, y, scale) => `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-8 0L-13-115H13L8 0Z" fill="#8b7461"/><path d="M0-180C-82-177-88-89-38-76C-89-23-4-15 0-38C40-9 91-51 49-86C85-137 41-183 0-180Z" fill="var(--forest-canopy)"/><path d="M-25-137Q-42-113-25-102M13-158Q37-159 44-136" fill="none" stroke="var(--forest-light)" stroke-width="8" stroke-linecap="round"/></g>`;
  const mushroom = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-8 0L-5-28H7L10 0" fill="#fff1ce"/><path d="M-30-24Q-23-61 0-61Q25-59 32-24Q0-12-30-24" fill="var(--forest-accent)" stroke="#fff1ce" stroke-width="3"/><g fill="#fff8e8"><circle cx="-12" cy="-36" r="5"/><circle cx="8" cy="-47" r="4"/><circle cx="21" cy="-30" r="3"/></g></g>`;
  host.innerHTML = `<svg class="forest-landscape" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <path fill="var(--forest-sky)" d="M0 0H1200V400H0Z"/>
    <circle cx="940" cy="62" r="37" fill="#fff7d7"/>
    <g fill="var(--forest-cloud)" opacity=".8"><path d="M150 72Q130 44 161 40Q172 12 196 35Q227 30 229 56Q253 78 218 79H162Z"/><path d="M680 57Q660 25 693 28Q711 6 730 30Q766 27 765 58Z"/></g>
    <path d="M0 154Q180 20 370 138Q580 32 800 144Q1040 20 1200 121V400H0Z" fill="var(--forest-far)"/>
    <g opacity=".52">${tree(230,190,.65)}${tree(650,168,.55)}${tree(1020,198,.8)}${tree(1140,180,.8)}</g>
    <path d="M0 212Q300 154 540 216Q950 153 1200 205V400H0Z" fill="var(--forest-ground)"/>
    <path d="M1200 233Q590 204 460 280Q390 320 230 400H840Q460 321 730 280Q990 245 1200 271" fill="var(--forest-path)"/>
    <g transform="translate(1040 147)"><path d="M-28 0V-49Q0-69 28-49V0Z" fill="#fff1ce"/><path d="M-49-49Q0-120 49-49Z" fill="var(--forest-accent)"/><path d="M-8 0V-23Q0-35 8-23V0" fill="#6b596d"/><circle cy="-49" r="7" fill="#ffe4a2"/></g>
    ${tree(30,355,1.8)}${tree(1220,370,1.6)}
    <g class="forest-front"><path d="M0 368Q120 328 270 382Q400 362 470 400H0ZM840 400Q1000 342 1200 346V400Z" fill="var(--forest-canopy)"/>${mushroom(190,380,.9)}${mushroom(235,389,.6)}${mushroom(1080,376,1)}${mushroom(1130,389,.65)}<g fill="var(--forest-light)"><path d="M80 378Q36 335 53 326Q84 334 80 378Q96 337 112 346Q115 370 80 378ZM995 388Q952 354 970 343Q996 352 995 388Q1006 351 1023 358Q1025 381 995 388Z"/></g></g>
    <g class="forest-motes" fill="#fff5b0"><circle cx="330" cy="130" r="3"/><circle cx="570" cy="330" r="3"/><circle cx="850" cy="105" r="3"/><path d="M1100 225l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/></g>
  </svg>`;
  const gate = field.querySelector('.typing-gate');
  gate.insertAdjacentHTML('afterbegin', '<svg class="forest-portal" viewBox="0 0 100 160" aria-hidden="true"><ellipse cx="50" cy="143" rx="43" ry="10" fill="#567b73" opacity=".3"/><path d="M12 140V62C12 0 88 0 88 62V140" fill="#cff5dc" stroke="#598b83" stroke-width="12"/><path d="M21 133V62C21 13 79 13 79 62V133" fill="none" stroke="#fff3ad" stroke-width="4"/><g fill="#fffbe0"><path d="M50 27l4 9 9 4-9 4-4 9-4-9-9-4 9-4Z"/><circle cx="27" cy="92" r="3"/><circle cx="74" cy="111" r="3"/></g></svg>');
  const biomes = ['garden', 'sunset', 'moon', 'frost', 'pearl'];
  function setStage(index) { root.StoryWorld?.typingStage(index); screen.dataset.biome = biomes[Math.min(4, Math.max(0, Math.floor((index || 0) / 2)))]; }
  function setRunning(value) {
    screen.dataset.forestMotion = value && !document.hidden ? 'running' : 'paused';
    if (!value) gate.querySelector('.hero-wand')?.getAnimations().forEach(a => a.cancel());
  }
  function cast() {
    if (root.GameExperience?.quality() === 'off') return;
    const wand = gate.querySelector('.hero-wand');
    if (!wand?.animate) return;
    wand.getAnimations().forEach(animation => animation.cancel());
    wand.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-24deg)', offset: .35 }, { transform: 'rotate(0deg)' }], { duration: 320, easing: 'ease-out' });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) setRunning(false); });
  document.addEventListener('effects:change', () => { if (root.GameExperience?.quality() === 'off') gate.getAnimations({ subtree: true }).forEach(a => a.cancel()); });
  setStage(0); setRunning(false);
  root.ForestScene = Object.freeze({ setStage, setRunning, cast });
})(window);
