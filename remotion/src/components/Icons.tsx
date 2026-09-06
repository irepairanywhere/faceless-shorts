import React from "react";
import {Img, staticFile} from "remotion";
import * as Lucide from "lucide-react";
import {theme} from "../theme";

const shadow = "drop-shadow(-16px 22px 22px rgba(0,0,0,0.26))";

export const ClaudeMascot: React.FC<{size?: number; face?: "happy" | "confused"; outline?: boolean}> = ({size = 220, face = "happy", outline = true}) => {
  const s = size / 220;
  const eyeStyle = {fontFamily: "Menlo, monospace", fontWeight: 800, fontSize: 46 * s, fill: "#111"} as React.CSSProperties;
  return (
    <svg width={size} height={size * 0.8} viewBox="-30 -10 280 176" style={{overflow: "visible"}}>
      <g stroke={outline ? "#fff" : "none"} strokeWidth={12} strokeLinejoin="round" fill={theme.accent}>
        <rect x={-22} y={28} width={34} height={44} rx={4} />
        <rect x={208} y={28} width={34} height={44} rx={4} />
        <rect x={0} y={0} width={220} height={130} rx={6} />
        <rect x={40} y={128} width={36} height={40} rx={3} />
        <rect x={144} y={128} width={36} height={40} rx={3} />
      </g>
      <text x={52} y={92} style={eyeStyle}>{face === "confused" ? ">" : ">"}</text>
      <text x={138} y={92} style={eyeStyle}>{face === "confused" ? ">" : "<"}</text>
      {face === "confused" && <text x={238} y={60} style={{...eyeStyle, fontSize: 64 * s}}>!?</text>}
    </svg>
  );
};

export const GeminiIcon: React.FC<{size?: number}> = ({size = 130}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <linearGradient id="gemgrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4285F4" /><stop offset="0.55" stopColor="#9B72CB" /><stop offset="1" stopColor="#D96570" />
      </linearGradient>
    </defs>
    <path d="M50 0 C55 30 70 45 100 50 C70 55 55 70 50 100 C45 70 30 55 0 50 C30 45 45 30 50 0 Z" fill="url(#gemgrad)" />
  </svg>
);

const Tile: React.FC<{size: number; children: React.ReactNode}> = ({size, children}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.18, background: "#151515", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", color: "#fff", fontFamily: theme.font}}>{children}</div>
);
export const KimiIcon: React.FC<{size?: number}> = ({size = 130}) => (
  <Tile size={size}>
    <span style={{fontSize: size * 0.62, fontWeight: 700, letterSpacing: -2}}>K</span>
    <span style={{position: "absolute", top: size * 0.14, right: size * 0.14, width: size * 0.12, height: size * 0.12, borderRadius: "50%", background: "#3B82F6"}} />
  </Tile>
);
export const GlmIcon: React.FC<{size?: number}> = ({size = 130}) => (
  <Tile size={size}><span style={{fontSize: size * 0.34, fontWeight: 800, letterSpacing: -1}}>GLM</span></Tile>
);
export const BookmarkIcon: React.FC<{size?: number}> = ({size = 150}) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M6 2h12a2 2 0 0 1 2 2v18l-8-5-8 5V4a2 2 0 0 1 2-2z" fill="#222" /></svg>
);
export const PhoneIcon: React.FC<{size?: number; color?: string}> = ({size = 160, color = theme.accent}) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill={color} /></svg>
);
export const GithubIcon: React.FC<{size?: number}> = ({size = 200}) => (
  <Img src={staticFile("icons/github.svg")} style={{width: size, height: size}} />
);

const pascal = (n: string) => n.split(/[-_\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
/** Any Lucide icon by kebab/snake name (e.g. "mouse-pointer-click", "phone-call", "search", "sparkles"). */
export const LucideIcon: React.FC<{name: string; size?: number; color?: string; strokeWidth?: number; bg?: string}> = ({name, size = 160, color = "#1E1E1E", strokeWidth = 2, bg}) => {
  const key = pascal(name.replace(/^lucide:/, "")) as keyof typeof Lucide;
  const Cmp = (Lucide as unknown as Record<string, React.ComponentType<{size?: number; color?: string; strokeWidth?: number; absoluteStrokeWidth?: boolean}>>)[key as string];
  if (!Cmp) return <span style={{fontSize: size * 0.3, color: "#E0443E", fontFamily: "Menlo"}}>?{name}</span>;
  const pad = bg ? size * 0.22 : 0;
  return (
    <div style={{width: size + pad * 2, height: size + pad * 2, borderRadius: size * 0.28, background: bg, display: "flex", alignItems: "center", justifyContent: "center"}}>
      <Cmp size={size} color={color} strokeWidth={strokeWidth} />
    </div>
  );
};

export const Icon: React.FC<{name: string; size?: number; withShadow?: boolean; color?: string; bg?: string}> = ({name, size, withShadow = true, color, bg}) => {
  let el: React.ReactNode = null;
  switch (name) {
    case "github": el = <GithubIcon size={size ?? 200} />; break;
    case "gemini": el = <GeminiIcon size={size ?? 130} />; break;
    case "kimi": el = <KimiIcon size={size ?? 130} />; break;
    case "glm": el = <GlmIcon size={size ?? 130} />; break;
    case "bookmark": el = <BookmarkIcon size={size ?? 150} />; break;
    case "phone": el = <PhoneIcon size={size ?? 160} />; break;
    case "phone_missed": el = <PhoneIcon size={size ?? 160} color="#E0443E" />; break;
    case "phone_dark": el = <PhoneIcon size={size ?? 160} color="#1E1E1E" />; break;
    case "claude": el = <ClaudeMascot size={size ?? 220} />; break;
    case "claude_confused": el = <ClaudeMascot size={size ?? 260} face="confused" />; break;
    case "starburst": el = <StarburstIcon size={size ?? 200} />; break;
    default: el = <LucideIcon name={name} size={size ?? 160} color={color} bg={bg} />; break; // any Lucide icon by kebab name
  }
  return <div style={{filter: withShadow ? shadow : undefined, display: "inline-block", lineHeight: 0}}>{el}</div>;
};
import {Starburst} from "./Starburst";
const StarburstIcon: React.FC<{size: number}> = ({size}) => <Starburst size={size} rays={11} />;
