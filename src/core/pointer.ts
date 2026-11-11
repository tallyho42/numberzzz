/** Palm rejection: once Apple Pencil has been seen, finger/palm touches are ignored for drawing. */
let penSeen = false;

export function acceptPointer(e: PointerEvent): boolean {
  if (e.pointerType === 'pen') {
    penSeen = true;
    return true;
  }
  if (e.pointerType === 'touch' && penSeen) return false;
  return true;
}

/** Capture a pointer so moves outside the element still arrive (ignores synthetic/stale ids). */
export function capture(el: Element, id: number) {
  try {
    el.setPointerCapture(id);
  } catch {
    /* not capturable – fine */
  }
}

/** Pointer position in the local (unscaled) coordinate space of `el`, whose CSS size is w×h. */
export function localPoint(e: { clientX: number; clientY: number }, el: Element, w: number, h: number) {
  const r = el.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * w, y: ((e.clientY - r.top) / r.height) * h };
}
