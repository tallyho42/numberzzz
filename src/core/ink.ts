import { acceptPointer, localPoint, capture } from './pointer';
import { reducedMotion } from './dom';

export interface InkPoint {
  x: number;
  y: number;
  t: number;
  p: number;
}

export interface Stroke {
  pts: InkPoint[];
  colors: string[];
  alpha: number;
  width: number;
}

export interface InkOptions {
  color?: string;
  width?: number;
  /** Optional live colouring per point (e.g. lighter outside the tracing corridor). */
  pointColor?: (p: InkPoint) => string | null;
  onStart?: (s: Stroke) => void;
  onMove?: (s: Stroke) => void;
  onEnd?: (s: Stroke) => void;
}

/** A Canvas 2D drawing surface driven by Pointer Events (Pencil-first, mouse works for development). */
export class Ink {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  strokes: Stroke[] = [];
  private active: Stroke | null = null;
  private activeId = -1;
  enabled = true;

  constructor(parent: HTMLElement, readonly w: number, readonly h: number, private opt: InkOptions = {}) {
    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, { position: 'absolute', left: '0', top: '0', width: `${w}px`, height: `${h}px`, touchAction: 'none' });
    parent.append(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    requestAnimationFrame(() => this.resize());
    window.addEventListener('resize', this.resize);
    this.canvas.addEventListener('pointerdown', this.down);
    this.canvas.addEventListener('pointermove', this.move);
    this.canvas.addEventListener('pointerup', this.up);
    this.canvas.addEventListener('pointercancel', this.up);
  }

  destroy() {
    window.removeEventListener('resize', this.resize);
  }

  set color(c: string) {
    this.opt.color = c;
  }

  private resize = () => {
    const r = this.canvas.getBoundingClientRect();
    const k = Math.max(1, (r.width / this.w) * (window.devicePixelRatio || 1));
    this.canvas.width = Math.round(this.w * k);
    this.canvas.height = Math.round(this.h * k);
    this.ctx.setTransform(k, 0, 0, k, 0, 0);
    this.redraw();
  };

  private toPoint(e: PointerEvent): InkPoint {
    const q = localPoint(e, this.canvas, this.w, this.h);
    return { x: q.x, y: q.y, t: e.timeStamp, p: e.pointerType === 'pen' ? e.pressure || 0.5 : 0.5 };
  }

  private colorFor(p: InkPoint) {
    return this.opt.pointColor?.(p) ?? this.opt.color ?? '#E2558C';
  }

  private down = (e: PointerEvent) => {
    if (!this.enabled || this.active || !acceptPointer(e)) return;
    e.preventDefault();
    capture(this.canvas, e.pointerId);
    this.activeId = e.pointerId;
    const p = this.toPoint(e);
    this.active = { pts: [p], colors: [this.colorFor(p)], alpha: 1, width: this.opt.width ?? 11 };
    this.strokes.push(this.active);
    this.drawDot(this.active, 0);
    this.opt.onStart?.(this.active);
  };

  private move = (e: PointerEvent) => {
    if (!this.active || e.pointerId !== this.activeId) return;
    const evs = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];
    for (const ev of evs.length ? evs : [e]) {
      const p = this.toPoint(ev);
      const s = this.active;
      const last = s.pts[s.pts.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < 0.8) continue;
      s.pts.push(p);
      s.colors.push(this.colorFor(p));
      this.drawSeg(s, s.pts.length - 1);
    }
    this.opt.onMove?.(this.active);
  };

  private up = (e: PointerEvent) => {
    if (!this.active || e.pointerId !== this.activeId) return;
    const s = this.active;
    this.active = null;
    this.activeId = -1;
    this.opt.onEnd?.(s);
  };

  private lineWidth(s: Stroke, i: number) {
    return s.width * (0.8 + 0.4 * s.pts[i].p);
  }

  private drawDot(s: Stroke, i: number) {
    const c = this.ctx;
    const p = s.pts[i];
    c.globalAlpha = s.alpha;
    c.fillStyle = s.colors[i];
    c.beginPath();
    c.arc(p.x, p.y, this.lineWidth(s, i) / 2, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
  }

  private drawSeg(s: Stroke, i: number) {
    const c = this.ctx;
    const a = s.pts[i - 1];
    const b = s.pts[i];
    c.globalAlpha = s.alpha;
    c.strokeStyle = s.colors[i];
    c.lineWidth = this.lineWidth(s, i);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.stroke();
    c.globalAlpha = 1;
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.w, this.h);
    for (const s of this.strokes) {
      if (s.alpha <= 0) continue;
      this.drawDot(s, 0);
      for (let i = 1; i < s.pts.length; i++) this.drawSeg(s, i);
    }
  }

  /** Recolour a whole stroke (e.g. after acceptance). */
  paint(s: Stroke, color: string, alpha = 1) {
    s.colors = s.colors.map(() => color);
    s.alpha = alpha;
    this.redraw();
  }

  remove(s: Stroke) {
    this.strokes = this.strokes.filter((x) => x !== s);
    this.redraw();
  }

  /** Gently fade a stroke out and remove it. */
  fade(s: Stroke, ms = 700): Promise<void> {
    return new Promise((resolve) => {
      if (reducedMotion()) {
        this.remove(s);
        return resolve();
      }
      const t0 = performance.now();
      const step = (t: number) => {
        s.alpha = Math.max(0, 1 - (t - t0) / ms);
        this.redraw();
        if (s.alpha > 0) requestAnimationFrame(step);
        else {
          this.remove(s);
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  clear() {
    this.strokes = [];
    this.active = null;
    this.redraw();
  }
}
