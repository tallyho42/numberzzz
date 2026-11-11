import './styles.css';
import { h } from './core/dom';
import { W, H, rotateHint } from './core/ui';
import { initApp } from './app';

const app = document.getElementById('app')!;
const stage = h('div', { id: 'stage' });
app.append(stage, rotateHint());

/** Size of the visible area; iPadOS updates visualViewport more reliably than innerWidth after rotation. */
function viewport() {
  const vv = window.visualViewport;
  return { w: vv?.width ?? window.innerWidth, h: vv?.height ?? window.innerHeight };
}

/**
 * The game is laid out on a fixed 1180×820 stage (iPad landscape) scaled to fit the window.
 * After a fit, `stagefit` tells drawing canvases to re-measure their pixel size.
 */
function fit() {
  const { w, h: vh } = viewport();
  const s = Math.min(w / W, vh / H);
  stage.style.transform = `translate(${(w - W * s) / 2}px, ${(vh - H * s) / 2}px) scale(${s})`;
  window.dispatchEvent(new Event('stagefit'));
}

/** Rotation and fullscreen changes report their final size a moment late, so fit again shortly after. */
function refit() {
  fit();
  setTimeout(fit, 120);
  setTimeout(fit, 450);
}

window.addEventListener('resize', refit);
window.addEventListener('orientationchange', refit);
window.visualViewport?.addEventListener('resize', refit);
document.addEventListener('fullscreenchange', refit);
document.addEventListener('webkitfullscreenchange', refit);
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
