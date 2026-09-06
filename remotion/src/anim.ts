import {spring} from "remotion";
export const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
export const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const sec = (s: number, fps: number) => Math.round(s * fps);
export type PopOpts = {fromScale?: number; fromY?: number; fromX?: number; fromRot?: number; damping?: number; stiffness?: number};
export function popIn(frame: number, startFrame: number, fps: number, durSec = 0.3, o: PopOpts = {}) {
  const fromScale = o.fromScale ?? 0.6, fromY = o.fromY ?? 34, fromX = o.fromX ?? 0, fromRot = o.fromRot ?? 0;
  const f = frame - startFrame;
  if (f < 0) return {opacity: 0, scale: fromScale, y: fromY, x: fromX, rot: fromRot, blur: 10, p: 0};
  const p = Math.min(1, f / (durSec * fps));
  const e = easeOutCubic(p);
  const s = spring({frame: f, fps, config: {damping: o.damping ?? 9, stiffness: o.stiffness ?? 190, mass: 0.6}});
  return {opacity: Math.min(1, p * 2.5), scale: fromScale + (1 - fromScale) * s, y: fromY * (1 - e), x: fromX * (1 - e), rot: fromRot * (1 - e), blur: 10 * (1 - e), p};
}
const hexToRgb = (h: string) => { const x = h.replace("#", ""); return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)]; };
export function mixColor(a: string, b: string, t: number) {
  if (!a.startsWith("#") || !b.startsWith("#")) return t > 0.5 ? b : a;
  const A = hexToRgb(a), B = hexToRgb(b); const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
const NUM_RE = /^(\$?)(\d[\d,]*)(\.\d+)?([^\d]*)$/;
export function countUpText(token: string, frame: number, startFrame: number, fps: number, durSec = 0.7): string {
  const m = token.match(NUM_RE);
  if (!m || m[3]) return token;
  const digits = m[2].replace(/,/g, "");
  const value = parseInt(digits, 10);
  if (!Number.isFinite(value) || value < 100) return token;
  const p = Math.max(0, Math.min(1, (frame - startFrame) / (durSec * fps)));
  const cur = Math.round(value * easeOutCubic(p));
  const withCommas = m[2].includes(",") || value >= 1000;
  const s = withCommas ? cur.toLocaleString("en-US") : String(cur);
  return `${m[1]}${s}${m[4]}`;
}
