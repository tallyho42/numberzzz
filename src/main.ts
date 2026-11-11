import './styles.css';
import { h } from './core/dom';
import { W, H, rotateHint } from './core/ui';
import { initApp } from './app';

const app = document.getElementById('app')!;
const stage = h('div', { id: 'stage' });
app.append(stage, rotateHint());

/**
 * Size of the visible area, measured on #app itself (a fixed, non-scrolling box covering the window).
 * Measuring the container avoids iPadOS quirks where the page ends up scrolled or zoomed after rotation.
 */
function viewport() {
  const r = app.getBoundingClientRect();
  return { w: r.width || window.innerWidth, h: r.height || window.innerHeight };
}

/**
 * The game is laid out on a fixed 1180×820 stage (iPad landscape) scaled to fit the window.
 * After a fit, `stagefit` tells drawing canvases to re-measure their pixel size.
 */
function fit() {
  window.scrollTo(0, 0);
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

// No zoom or long-press menus while playing. Scrolling is blocked by `touch-action: none` in CSS;
// a global touchmove preventDefault is avoided on purpose – iPadOS then drops taps that move slightly.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => e.preventDefault());

// iPad Safari ignores user-scalable=no: a quick double tap zooms in and there is no way back.
// Cancel the second tap of a double tap (taps are handled on pointerup, so nothing is lost)…
let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now();
    const t = e.target as HTMLElement | null;
    const typing = t?.closest('input, textarea, select');
    if (!typing && now - lastTouchEnd < 400) e.preventDefault();
    lastTouchEnd = now;
  },
  { passive: false },
);
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
// …and if the page got zoomed anyway, snap it back.
const viewportMeta = document.querySelector<HTMLMetaElement>('meta[name=viewport]');
function unzoom() {
  const vv = window.visualViewport;
  if (!vv || vv.scale <= 1.01 || !viewportMeta) return;
  const content = viewportMeta.content;
  viewportMeta.content = `${content.replace(/,?\s*maximum-scale=[^,]*/, '')}, maximum-scale=1.0`;
  setTimeout(() => {
    viewportMeta.content = content;
    refit();
  }, 300);
}
window.visualViewport?.addEventListener('resize', unzoom);
window.visualViewport?.addEventListener('scroll', unzoom);

initApp(stage);
