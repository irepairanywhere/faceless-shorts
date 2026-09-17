import React from "react";
import {Img, staticFile} from "remotion";
import {theme} from "../theme";
import {easeOutCubic} from "../anim";
import {Icon} from "./Icons";

export const Terminal: React.FC<{lines: string[]; w?: number; title?: string; frame: number; startF: number; fps: number}> = ({lines, w: wIn, title: tIn, frame, startF, fps}) => {
  const w = wIn ?? 900;
  const title = tIn ?? "claude";
  const f = frame - startF;
  const stag = Math.round(0.5 * fps);
  return (
    <div style={{width: w, background: "#141414", borderRadius: 18, boxShadow: "-18px 26px 34px rgba(0,0,0,0.3)", overflow: "hidden", fontFamily: "Menlo, SFMono-Regular, Consolas, monospace", textAlign: "left"}}>
      <div style={{height: 54, background: "#242424", display: "flex", alignItems: "center", gap: 10, padding: "0 20px"}}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <span key={c} style={{width: 16, height: 16, borderRadius: 8, background: c, display: "inline-block"}} />)}
        <span style={{marginLeft: 14, color: "#9a9a9a", fontSize: 22}}>{title}</span>
      </div>
      <div style={{padding: "22px 28px", display: "flex", flexDirection: "column", gap: 12}}>
        {lines.map((ln, i) => {
          const lf = f - i * stag;
          if (lf < 0) return <div key={i} style={{height: 38}} />;
          const isCmd = ln.startsWith("$");
          const chars = isCmd ? Math.min(ln.length, Math.floor((lf / (0.7 * fps)) * ln.length)) : ln.length;
          const op = isCmd ? 1 : easeOutCubic(Math.min(1, lf / (0.25 * fps)));
          const color = ln.startsWith("✓") ? "#5AD27A" : isCmd ? "#FFFFFF" : "#CFCFCF";
          return <div key={i} style={{fontSize: 30, lineHeight: "38px", color, opacity: op, whiteSpace: "pre"}}>{ln.slice(0, chars)}{isCmd && chars < ln.length ? "▍" : ""}</div>;
        })}
      </div>
    </div>
  );
};

export const Chat: React.FC<{text: string; who?: "you" | "ai"; w?: number; label?: string}> = ({text, who, w: wIn, label}) => {
  const w = wIn ?? 820;
  const you = (who ?? "you") === "you";
  const name = label ?? (you ? "You" : "Claude");
  return (
    <div style={{width: w, display: "flex", flexDirection: "column", alignItems: you ? "flex-end" : "flex-start", gap: 8, fontFamily: theme.font}}>
      <div style={{fontSize: 28, color: "#8E8E8E", fontWeight: 600, padding: "0 12px", display: "flex", alignItems: "center", gap: 8}}>
        {!you && <span style={{width: 14, height: 14, borderRadius: 4, background: theme.accent, display: "inline-block"}} />}
        {name}
      </div>
      <div style={{maxWidth: w * 0.94, background: you ? "#1B1B1B" : "#FFFFFF", color: you ? "#fff" : "#1E1E1E", border: you ? "none" : "2px solid #E4E4E4", borderRadius: 26, borderBottomRightRadius: you ? 8 : 26, borderBottomLeftRadius: you ? 26 : 8, padding: "20px 28px", fontSize: 46, fontWeight: 500, lineHeight: 1.25, boxShadow: "-14px 20px 30px rgba(0,0,0,0.18)", textAlign: "left"}}>{text}</div>
    </div>
  );
};

export const Phone: React.FC<{src: string; w?: number}> = ({src, w: wIn}) => {
  const w = wIn ?? 460;
  const h = w * 2.06;
  return (
    <div style={{width: w, height: h, background: "#111", borderRadius: w * 0.13, padding: w * 0.03, boxSizing: "border-box", boxShadow: "-22px 30px 40px rgba(0,0,0,0.3)", position: "relative"}}>
      <div style={{width: "100%", height: "100%", borderRadius: w * 0.105, overflow: "hidden", background: "#000"}}>
        <Img src={staticFile(src)} style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: "top"}} />
      </div>
      <div style={{position: "absolute", top: w * 0.05, left: "50%", transform: "translateX(-50%)", width: w * 0.32, height: w * 0.07, borderRadius: w * 0.035, background: "#111"}} />
    </div>
  );
};

export const Badge: React.FC<{text?: string; icon?: string; iconSrc?: string; size?: number}> = ({text, icon, iconSrc, size: sIn}) => {
  const size = sIn ?? 150;
  return (
    <div style={{width: size, height: size, borderRadius: "50%", background: "#1B1B1B", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "-16px 22px 30px rgba(0,0,0,0.28)", color: "#fff", fontFamily: theme.font, fontSize: size * 0.5, fontWeight: 800}}>
      {icon || iconSrc ? <div style={{filter: icon === "github" ? "invert(1)" : undefined, lineHeight: 0}}><Icon name={icon} src={iconSrc} size={size * 0.55} withShadow={false} /></div> : text}
    </div>
  );
};
