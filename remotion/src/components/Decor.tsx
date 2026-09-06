import React from "react";
import {staticFile} from "remotion";
import {Video} from "@remotion/media";
import {Starburst} from "./Starburst";
import {popIn} from "../anim";
import type {Theme} from "../theme";

export const Starbursts: React.FC<{frame: number; fps: number; color: string}> = ({frame, fps, color}) => {
  const a = popIn(frame, 0, fps, 0.5, {fromScale: 0.3, fromY: 0, damping: 8});
  const rot = frame * 0.3, pulse = 1 + 0.03 * Math.sin(frame / 9);
  const sh = "drop-shadow(-18px 24px 20px rgba(0,0,0,0.26))";
  return (
    <>
      <div style={{position: "absolute", left: -90, top: -70, opacity: a.opacity, transform: `scale(${a.scale * pulse})`, filter: sh}}><Starburst size={420} rotation={18 + rot} color={color} /></div>
      <div style={{position: "absolute", left: 800, top: 1560, opacity: a.opacity, transform: `scale(${a.scale * pulse})`, filter: sh}}><Starburst size={380} rotation={-25 - rot} color={color} /></div>
    </>
  );
};

export const Orbs: React.FC<{frame: number; colors: string[]}> = ({frame, colors}) => {
  const orbs = [
    {x: 120 + 60 * Math.sin(frame / 41), y: 260 + 40 * Math.cos(frame / 37), s: 620, c: colors[0]},
    {x: 640 + 50 * Math.cos(frame / 47), y: 1180 + 70 * Math.sin(frame / 43), s: 720, c: colors[1]},
    {x: 300 + 40 * Math.sin(frame / 53), y: 1500 + 30 * Math.cos(frame / 31), s: 520, c: colors[2] ?? colors[0]},
  ];
  return (
    <>
      {orbs.map((o, i) => (
        <div key={i} style={{position: "absolute", left: o.x - o.s / 2, top: o.y - o.s / 2, width: o.s, height: o.s, borderRadius: "50%", background: `radial-gradient(circle, ${o.c} 0%, rgba(0,0,0,0) 65%)`, opacity: 0.85, filter: "blur(50px)"}} />
      ))}
    </>
  );
};

export const Grain: React.FC<{frame: number}> = ({frame}) => (
  <>
    <svg width={1080} height={1920} style={{position: "absolute", left: 0, top: 0, opacity: 0.09, mixBlendMode: "overlay"}}>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 7} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
    <div style={{position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%)"}} />
  </>
);

export const Scanlines: React.FC = () => (
  <div style={{position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)", pointerEvents: "none"}} />
);

export const StockBg: React.FC<{src: string; frame: number; lenF: number; overlay?: number; theme: Theme; start?: number; rate?: number; fps?: number}> = ({src, frame, lenF, overlay, theme, start, rate, fps}) => {
  const p = lenF > 0 ? Math.min(1, frame / lenF) : 0;
  const scale = 1.06 + 0.08 * p;
  const ov = overlay ?? 0.55;
  return (
    <>
      <div style={{position: "absolute", inset: 0, overflow: "hidden", background: theme.bg}}>
        <Video src={staticFile(src)} muted loop objectFit="cover" trimBefore={Math.round((start ?? 0) * (fps ?? 30))} playbackRate={rate ?? 1} style={{width: 1080, height: 1920, transform: `scale(${scale})`}} />
      </div>
      <div style={{position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,${ov * 0.7}) 0%, rgba(0,0,0,${ov}) 50%, rgba(0,0,0,${Math.min(1, ov + 0.25)}) 100%)`}} />
    </>
  );
};

export const Wipe: React.FC<{frame: number; fps: number; color: string}> = ({frame, fps, color}) => {
  const d = 0.42 * fps;
  if (frame > d) return null;
  const p = frame / d;
  const x = p < 0.5 ? -100 + (p / 0.5) * 100 : (p - 0.5) / 0.5 * 100;
  return <div style={{position: "absolute", inset: 0, background: color, transform: `translateX(${x}%)`, zIndex: 50}} />;
};
