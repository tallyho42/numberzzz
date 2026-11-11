import './styles.css';
import { h } from './core/dom';
import { W, H } from './core/ui';
import { initApp } from './app';

const app = document.getElementById('app')!;
const stage = h('div', { id: 'stage' });
app.append(stage);

/** The game is laid out on a fixed 1180×820 stage (iPad landscape) scaled to fit the window. */
function fit() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  stage.style.transform = `translate(${(window.innerWidth - W * s) / 2}px, ${(window.innerHeight - H * s) / 2}px) scale(${s})`;
}
window.addEventListener('resize', fit);
fit();

// No zoom, scroll, long-press menus or text selection while playing.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener(
  'touchmove',
  (e) => {
    if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
  },
  { passive: false },
);

initApp(stage);
