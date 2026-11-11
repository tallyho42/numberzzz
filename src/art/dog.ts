import { FACE, INK } from './dogShapes';

const TONGUE = '#E07A86';

/** Ink details: 'legs' sit on the body, 'face' on the head (with every expression; CSS shows one). */
export function dogFaceSvg(part: 'legs' | 'face'): string {
  if (part === 'legs') return FACE.legs.map((d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`).join('');
  const pupils = FACE.pupils.map(([x, y, rx, ry]) => `<ellipse class="pupil" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${INK}"/>`).join('');
  const freckles = FACE.freckles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`).join('');
  return `<g class="eyes"><g class="pupils">${pupils}</g>
      <path class="joy" d="M566,502 Q600,460 634,502 M803,492 Q836,450 869,492" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/></g>
    <g class="brows">
      <path d="${FACE.browL}" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
      <path d="${FACE.browR}" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/></g>
    ${freckles}
    <g class="m-tongue"><path d="M772,915 C758,962 770,1014 801,1018 C832,1021 844,976 831,924 C812,935 790,930 772,915 Z" fill="${TONGUE}"/><path d="M801,934 L802,988" stroke="#B8505E" stroke-width="4" stroke-linecap="round"/></g>
    <path class="m-smile" d="${FACE.smile}" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <g class="m-open"><path d="M708,840 C696,902 728,966 776,968 C826,970 854,910 846,846 C816,860 742,860 708,840 Z" fill="${INK}"/><path d="M734,928 C744,970 806,972 818,928 C798,940 756,940 734,928 Z" fill="${TONGUE}"/></g>
    <path d="${FACE.nose}" fill="${INK}"/>`;
}
