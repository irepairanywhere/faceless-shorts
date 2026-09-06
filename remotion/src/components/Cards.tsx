import React from "react";
import {Img, staticFile} from "remotion";
import {theme} from "../theme";
import {easeOutCubic} from "../anim";
import {ClaudeMascot, GithubIcon} from "./Icons";

export const ClaudeCard: React.FC<{w?: number; title?: string; subtitle?: string}> = ({w: wIn, title: tIn, subtitle: sIn}) => {
  const w = wIn ?? 760;
  const title = tIn ?? "Claude Code";
  const subtitle = sIn ?? "Free · Unlimited · Automatic";
  const h = w * 0.52;
  return (
    <div style={{width: w, height: h, background: theme.accent, borderRadius: 10, boxShadow: "-22px 30px 34px rgba(0,0,0,0.28)", display: "flex", alignItems: "center", gap: w * 0.05, padding: `0 ${w * 0.06}px`, boxSizing: "border-box", fontFamily: theme.font}}>
      <ClaudeMascot size={w * 0.3} outline={false} />
      <div style={{display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 0}}>
        <div style={{fontSize: w * 0.078, fontWeight: 800, color: "#1E1E1E", lineHeight: 1, whiteSpace: "nowrap"}}>{title}</div>
        <div style={{fontSize: w * 0.038, fontWeight: 600, color: "#2b2b2b"}}>{subtitle}</div>
      </div>
    </div>
  );
};

export const RepoCard: React.FC<{w?: number; title?: string; subtitle?: string}> = ({w: wIn, title: tIn, subtitle: sIn}) => {
  const w = wIn ?? 900;
  const title = tIn ?? "decolua / 9router";
  const subtitle = sIn ?? "FREE AI Router & Token Saver. Auto-fallback to free and cheap AI models. Works with Claude Code, Cursor, Codex, Antigravity and more.";
  return (
    <div style={{width: w, background: "#fff", border: "2px solid #E2E2E2", borderRadius: 16, boxShadow: "-22px 30px 34px rgba(0,0,0,0.22)", padding: w * 0.04, boxSizing: "border-box", fontFamily: theme.font, display: "flex", flexDirection: "column", gap: w * 0.022}}>
      <div style={{display: "flex", alignItems: "center", gap: w * 0.02}}>
        <GithubIcon size={w * 0.05} />
        <div style={{fontSize: w * 0.042, fontWeight: 700, color: "#0969DA"}}>{title}</div>
        <div style={{marginLeft: "auto", fontSize: w * 0.026, fontWeight: 600, color: "#57606A", border: "1.5px solid #D0D7DE", borderRadius: 8, padding: "4px 12px"}}>Public</div>
      </div>
      <div style={{fontSize: w * 0.03, color: "#24292F", lineHeight: 1.35}}>{subtitle}</div>
      <div style={{display: "flex", gap: w * 0.02, fontSize: w * 0.026, color: "#57606A", fontWeight: 600}}>
        <span>★ Star</span><span>⑂ Fork</span><span style={{color: "#1a7f37"}}>● MIT license</span>
      </div>
    </div>
  );
};

export const Card: React.FC<{name: string; w?: number; title?: string; subtitle?: string}> = ({name, w, title, subtitle}) => {
  if (name === "claude") return <ClaudeCard w={w} title={title} subtitle={subtitle} />;
  if (name === "repo") return <RepoCard w={w} title={title} subtitle={subtitle} />;
  return <div style={{width: w ?? 600, height: 300, background: "#ddd", borderRadius: 16}} />;
};

export const Shot: React.FC<{src: string; w?: number; tilt?: number; blur?: number; reveal?: boolean; pan?: [number, number]; frame: number; startF: number; lenF: number; fps: number}> = ({src, w: wIn, tilt, blur, reveal, pan, frame, startF, lenF, fps}) => {
  const w = wIn ?? 900;
  const f = Math.max(0, frame - startF);
  const rv = reveal === false ? 0 : 10 * (1 - easeOutCubic(Math.min(1, f / (0.7 * fps))));
  const total = (blur ?? 0) + rv;
  const p = lenF > 0 ? Math.min(1, f / lenF) : 0;
  const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const tx = pan ? pan[0] + (pan[1] - pan[0]) * ease : 0;
  return (
    <div style={{width: w, borderRadius: 14, overflow: "hidden", boxShadow: "-22px 30px 34px rgba(0,0,0,0.26)", transform: `translateX(${tx}px) rotate(${tilt ?? 0}deg)`, filter: total > 0.2 ? `blur(${total}px)` : undefined, lineHeight: 0, background: "#fff"}}>
      <Img src={staticFile(src)} style={{width: "100%"}} />
    </div>
  );
};
