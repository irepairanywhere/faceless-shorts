import React from "react";
import {easeOutCubic, popIn} from "../anim";
import {Icon} from "./Icons";
import {Starburst} from "./Starburst";

const Line: React.FC<{x1: number; y1: number; x2: number; y2: number; frame: number; startF: number; fps: number; dashed?: boolean}> = ({x1, y1, x2, y2, frame, startF, fps, dashed}) => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const p = Math.max(0, Math.min(1, (frame - startF) / (0.35 * fps)));
  const e = easeOutCubic(p);
  if (dashed) return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1E1E1E" strokeWidth={3.5} strokeDasharray="14 12" opacity={e} strokeLinecap="round" />;
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1E1E1E" strokeWidth={3.5} strokeDasharray={`${len}`} strokeDashoffset={len * (1 - e)} strokeLinecap="round" />;
};

const Pop: React.FC<{frame: number; startF: number; fps: number; x: number; y: number; children: React.ReactNode}> = ({frame, startF, fps, x, y, children}) => {
  const a = popIn(frame, startF, fps, 0.32);
  return <div style={{position: "absolute", left: x, top: y, opacity: a.opacity, transform: `translateY(${a.y}px) scale(${a.scale})`, filter: `blur(${a.blur}px)`}}>{children}</div>;
};

export const BridgeDiagram: React.FC<{frame: number; startF: number; fps: number; nodes?: string[]; left?: string}> = ({frame, startF, fps, nodes: nodesIn, left: leftIn}) => {
  const nodes = nodesIn ?? ["gemini", "kimi", "glm"]; const left = leftIn ?? "claude";
  const W = 900, H = 560, iconS = 130;
  const ys = [30, 215, 400];
  const stag = Math.round(0.18 * fps);
  return (
    <div style={{position: "relative", width: W, height: H}}>
      <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0}}>
        {nodes.map((_, i) => <Line key={i} x1={260} y1={280} x2={640} y2={ys[i] + iconS / 2} frame={frame} startF={startF + 4 + i * stag} fps={fps} />)}
      </svg>
      <Pop frame={frame} startF={startF} fps={fps} x={20} y={190}><Icon name={left} size={230} /></Pop>
      {nodes.map((n, i) => <Pop key={n} frame={frame} startF={startF + 10 + i * stag} fps={fps} x={640} y={ys[i]}><Icon name={n} size={iconS} /></Pop>)}
    </div>
  );
};

export const TreeDiagram: React.FC<{frame: number; startF: number; fps: number; nodes?: string[]}> = ({frame, startF, fps, nodes: nodesIn}) => {
  const nodes = nodesIn ?? ["gemini", "kimi", "glm"];
  const W = 900, H = 540, iconS = 140;
  const xs = [150, 450, 750];
  const stag = Math.round(0.14 * fps);
  const rot = (frame - startF) * 0.6;
  return (
    <div style={{position: "relative", width: W, height: H}}>
      <Pop frame={frame} startF={startF} fps={fps} x={450 - 110} y={0}><Starburst size={220} rays={11} rotation={rot} /></Pop>
      <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0}}>
        <Line x1={450} y1={230} x2={450} y2={300} frame={frame} startF={startF + 6} fps={fps} dashed />
        <Line x1={150} y1={300} x2={750} y2={300} frame={frame} startF={startF + 10} fps={fps} dashed />
        {xs.map((x, i) => <Line key={i} x1={x} y1={300} x2={x} y2={360} frame={frame} startF={startF + 14 + i * stag} fps={fps} dashed />)}
      </svg>
      {nodes.map((n, i) => <Pop key={n} frame={frame} startF={startF + 18 + i * stag} fps={fps} x={xs[i] - iconS / 2} y={370}><Icon name={n} size={iconS} /></Pop>)}
    </div>
  );
};
