import React from "react";
import {spring} from "remotion";
import {easeOutCubic, popIn} from "../anim";

// v9 (2026-09-09): tier-list board. Rows S/A/B/C/F with colored tier cells; chips already `placed` sit static, the `add`
// chip appears large over the centre of the board, hovers, then springs into the next free slot of its row when the
// grade is spoken (landF). The row's tier cell flashes on landing. `pulse` re-highlights a chip that is already placed.
// v9b: `stamp` entrance (the row slams down like a rubber stamp with a flash) and `adds` (several chips dropping in from
// above, each on its own word). Chips wrap to a second line inside a row when they do not fit.
export type TierItem = {label: string; grade: string};
export type TierAdd = TierItem & {appearF: number; landF: number; drop?: boolean};
const DEFAULT_COLORS: Record<string, string> = {S: "#FF5C5C", A: "#FF9F43", B: "#FFD63A", C: "#7BD65C", D: "#4CC9F0", F: "#A66CFF"};

export const TierBoard: React.FC<{
  tiers?: string[]; placed: TierItem[]; add?: TierItem; adds?: TierAdd[]; pulse?: string; enter?: boolean; pop?: boolean; stamp?: boolean; w?: number; ratio?: number;
  frame: number; startF: number; appearF?: number; landF?: number; fps: number; dark: boolean; font: string; uppercase: boolean; colors?: Record<string, string>;
}> = ({tiers: tiersIn, placed, add, adds: addsIn, pulse, enter, pop, stamp, w: wIn, ratio, frame, startF, appearF: appearIn, landF: landIn, fps, dark, font, uppercase, colors: colorsIn}) => {
  const w = wIn ?? 960;
  const tiers = tiersIn ?? ["S", "A", "B", "C", "F"];
  const colors = {...DEFAULT_COLORS, ...(colorsIn ?? {})};
  const rowH = Math.round(w * (ratio ?? 0.115)), gap = Math.round(w * 0.014), cell = rowH;
  const fs = Math.round(Math.min(rowH * 0.34, w * (stamp ? 0.046 : 0.038))), cellFs = Math.round(rowH * (stamp ? 0.62 : 0.5)), chipH = Math.round(fs * 1.9), chipR = Math.round(chipH * 0.24), lineGap = 8;
  const charW = fs * (uppercase ? 0.52 : 0.58);
  const chipW = (label: string) => Math.round(label.length * charW + fs * 1.15);
  const boardH = tiers.length * rowH + (tiers.length - 1) * gap;
  const f = frame - startF;
  const text = (s: string) => (uppercase ? s.toUpperCase() : s);
  const chipBg = dark ? "#F4F4F4" : "#111111", chipInk = dark ? "#111111" : "#F5F5F5";
  const rowBg = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", rowLine = dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)";

  // the chips that move this beat (single `add` = hover-and-spring, `adds` = drops from above)
  const appearF = appearIn ?? startF + Math.round(0.3 * fps);
  const landF = landIn ?? appearF + Math.round(0.6 * fps);
  const moving: TierAdd[] = addsIn ?? (add ? [{...add, appearF, landF, drop: false}] : []);

  // slot layout per row: placed chips first, then moving chips in order; wrap to a new line when the row is full
  type Slot = {it: TierItem; x: number; y: number; cw: number; moving?: TierAdd};
  const rows = tiers.map((tier, r) => {
    const items: {it: TierItem; moving?: TierAdd}[] = [...placed.filter((p) => p.grade === tier).map((it) => ({it})), ...moving.filter((m) => m.grade === tier).map((m) => ({it: m, moving: m}))];
    let x = cell + gap, line = 0;
    const pre = items.map(({it, moving: mv}) => { const cw = chipW(it.label); if (x + cw > w - gap && x > cell + gap) { x = cell + gap; line += 1; } const s = {it, x, line, cw, moving: mv}; x += cw + gap; return s; });
    const lines = line + 1;
    const y0 = (rowH - (lines * chipH + (lines - 1) * lineGap)) / 2;
    const slots: Slot[] = pre.map((s) => ({it: s.it, x: s.x, y: y0 + s.line * (chipH + lineGap), cw: s.cw, moving: s.moving}));
    return {tier, r, slots, y: r * (rowH + gap)};
  });

  const boardPop = pop ? popIn(frame, startF, fps, 0.3, {fromScale: 0.7, fromY: 40, damping: 10}) : null;
  const chipBase = (cw: number): React.CSSProperties => ({position: "absolute", width: cw, height: chipH, background: chipBg, color: chipInk, borderRadius: chipR, display: "flex", alignItems: "center", justifyContent: "center", fontSize: fs, fontWeight: 700, letterSpacing: uppercase ? 1 : 0, whiteSpace: "nowrap"});

  return (
    <div style={{position: "relative", width: w, height: boardH, fontFamily: font, opacity: boardPop ? boardPop.opacity : 1, transform: boardPop ? `translateY(${boardPop.y}px) scale(${boardPop.scale})` : undefined}}>
      {rows.map(({tier, r, slots, y}) => {
        const c = colors[tier] ?? "#999999";
        // entrance: slide (enter) or rubber stamp (stamp)
        let rowOp = 1, rowTx = 0, rowScale = 1, rowRot = 0, flash = 0;
        if (stamp) {
          const sf = f - r * 2;
          const ss = sf < 0 ? 0 : spring({frame: sf, fps, config: {damping: 13, stiffness: 120, mass: 0.9}});
          rowOp = sf < 0 ? 0 : Math.min(1, sf / 3); rowScale = 3.4 - 2.4 * Math.min(1, ss); rowRot = -8 * (1 - Math.min(1, ss));
          flash = sf >= 7 ? Math.max(0, 1 - (sf - 7) / 8) : 0;
        } else if (enter) {
          const er = easeOutCubic(Math.max(0, Math.min(1, (f - r * 3) / (0.32 * fps))));
          rowOp = er; rowTx = (1 - er) * -60;
        }
        // landing glow on the tier cell: any moving chip of this row that just landed
        let glow = 0;
        for (const m of moving) { if (m.grade !== tier) continue; const lf = frame - (m.drop ? m.appearF + 9 : m.landF + 4); if (lf >= 0) glow = Math.max(glow, Math.max(0, 1 - lf / 14)); }
        return (
          <div key={tier} style={{position: "absolute", left: 0, top: y, width: w, height: rowH, opacity: rowOp, transform: `translateX(${rowTx}px) scale(${rowScale}) rotate(${rowRot}deg)`, transformOrigin: "50% 50%"}}>
            <div style={{position: "absolute", left: 0, top: 0, width: w, height: rowH, background: rowBg, border: `2px solid ${rowLine}`, borderRadius: 14, boxSizing: "border-box"}} />
            <div style={{position: "absolute", left: 0, top: 0, width: cell, height: rowH, background: c, borderRadius: "14px 0 0 14px", display: "flex", alignItems: "center", justifyContent: "center", color: "#111111", fontSize: cellFs, fontWeight: 800, letterSpacing: 1, transform: `scale(${1 + 0.1 * glow})`, boxShadow: glow > 0 ? `0 0 ${40 * glow}px ${c}` : undefined, zIndex: 2}}>{tier}</div>
            {slots.map(({it, x, y: cy, cw, moving: mv}, k) => {
              if (!mv) {
                const isPulse = pulse === it.label;
                const pf = frame - landF;
                const ps = isPulse && pf >= 0 ? 1 + 0.16 * Math.max(0, Math.sin(Math.min(Math.PI, pf / 5))) : 1;
                return <div key={k} style={{...chipBase(cw), left: x, top: cy, transform: `scale(${ps})`, boxShadow: isPulse && pf >= 0 ? `0 0 ${30 * Math.max(0, 1 - pf / 18)}px ${c}` : "0 6px 14px rgba(0,0,0,0.25)"}}>{text(it.label)}</div>;
              }
              if (frame < mv.appearF) return null;
              if (mv.drop) {
                // drop from above the row, spring into the slot
                const df = frame - mv.appearF;
                const ds = Math.min(1, spring({frame: df, fps, config: {damping: 10, stiffness: 170, mass: 0.8}}));
                const originY = -rowH * 1.4;
                const landed = df >= 9; const lg = landed ? Math.max(0, 1 - (df - 9) / 12) : 0;
                return <div key={k} style={{...chipBase(cw), left: x, top: cy + (originY - cy) * (1 - ds), zIndex: 5, opacity: Math.min(1, df / 3), transform: `scale(${1.3 - 0.3 * ds}) scaleY(${landed ? 1 - 0.12 * lg : 1})`, boxShadow: `0 ${6 + 26 * (1 - ds)}px ${14 + 40 * (1 - ds)}px rgba(0,0,0,${0.25 + 0.35 * (1 - ds)})`}}>{text(it.label)}</div>;
              }
              // hover over the board centre, then spring into the slot
              const ap = popIn(frame, mv.appearF, fps, 0.28, {fromScale: 0.4, fromY: 40, damping: 9});
              const fl = frame - mv.landF;
              const e = fl < 0 ? 0 : Math.min(1, spring({frame: fl, fps, config: {damping: 11, stiffness: 150, mass: 0.7}}));
              const bob = fl < 0 ? Math.sin(f / 5) * 5 : 0;
              const lg = fl >= 4 ? Math.max(0, 1 - (fl - 4) / 14) : 0;
              const originX = w / 2 - cw / 2 - 0, originY = boardH / 2 - chipH / 2 - y; // origin is the board centre, expressed in row coordinates
              return <div key={k} style={{...chipBase(cw), left: x + (originX - x) * (1 - e), top: cy + (originY - cy) * (1 - e) + bob * (1 - e), zIndex: 5, opacity: ap.opacity, transform: `translateY(${ap.y * (1 - e)}px) scale(${ap.scale * (1.6 - 0.6 * e) * (fl >= 4 ? 1 + 0.12 * lg : 1)}) rotate(${(-6 + 6 * e) * (1 - e) + ap.rot}deg)`, boxShadow: fl >= 4 ? "0 6px 14px rgba(0,0,0,0.25)" : `0 ${30 * (1 - e) + 6}px ${60 * (1 - e) + 14}px rgba(0,0,0,${0.5 * (1 - e) + 0.25})`, filter: ap.blur > 0.3 ? `blur(${ap.blur}px)` : undefined}}>{text(it.label)}</div>;
            })}
            {flash > 0 ? <div style={{position: "absolute", left: -6, top: -6, width: w + 12, height: rowH + 12, borderRadius: 18, background: "#FFFFFF", opacity: 0.85 * flash, zIndex: 6}} /> : null}
          </div>
        );
      })}
    </div>
  );
};
