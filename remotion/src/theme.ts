export type ThemeName = "paper" | "midnight" | "bold" | "film" | "terminal";
export type AnimName = "pop" | "typewriter" | "rise" | "fill";
export type Theme = {
  name: ThemeName; bg: string; altBg?: string; ink: string; muted: string; accent: string; gradient?: string[];
  boxBg: string; boxText: string; boxBorder?: string; fontHead: "Inter" | "InterTight" | "Anton" | "BebasNeue" | "Mono";
  fontBody: "Inter" | "Mono"; uppercase: boolean; grid: boolean; decor: "starburst" | "orbs" | "none" | "grain" | "scanlines";
  anim: AnimName; transition: "zoom" | "whip" | "cut" | "wipe"; sizes: Record<string, number>; emphMul: number; watermark: string; shadow: string;
};
const base = {fontBody: "Inter" as const, sizes: {sm: 42, md: 58, lg: 76, xl: 104}, emphMul: 1.3};
export const THEMES: Record<ThemeName, Theme> = {
  paper: {...base, name: "paper", bg: "#F6F6F6", ink: "#1E1E1E", muted: "#8E8E8E", accent: "#E5744C", boxBg: "#1B1B1B", boxText: "#FFFFFF", fontHead: "Inter", uppercase: false, grid: true, decor: "starburst", anim: "pop", transition: "zoom", watermark: "#BDBDBD", shadow: "-14px 24px 36px rgba(0,0,0,0.22)"},
  midnight: {...base, name: "midnight", bg: "#0B0B11", ink: "#F5F5F7", muted: "#9CA3AF", accent: "#8B5CF6", gradient: ["#EC4899", "#8B5CF6", "#3B82F6"], boxBg: "#13131F", boxText: "#F5F5F7", boxBorder: "#2A2A35", fontHead: "InterTight", uppercase: false, grid: false, decor: "orbs", anim: "rise", transition: "whip", watermark: "#4B5563", shadow: "0 24px 60px rgba(139,92,246,0.25)"},
  bold: {...base, name: "bold", bg: "#F5D90A", altBg: "#111111", ink: "#111111", muted: "#5A5200", accent: "#111111", boxBg: "#111111", boxText: "#F5D90A", fontHead: "Anton", uppercase: true, grid: false, decor: "none", anim: "rise", transition: "wipe", sizes: {sm: 46, md: 70, lg: 96, xl: 150}, emphMul: 1.25, watermark: "#7A6E00", shadow: "12px 12px 0 rgba(0,0,0,0.25)"},
  film: {...base, name: "film", bg: "#0E0E0E", ink: "#FFFFFF", muted: "#C9C9C9", accent: "#FFD166", boxBg: "rgba(0,0,0,0.55)", boxText: "#FFFFFF", boxBorder: "rgba(255,255,255,0.25)", fontHead: "BebasNeue", uppercase: true, grid: false, decor: "grain", anim: "rise", transition: "cut", sizes: {sm: 48, md: 72, lg: 100, xl: 150}, emphMul: 1.3, watermark: "rgba(255,255,255,0.5)", shadow: "0 10px 40px rgba(0,0,0,0.6)"},
  terminal: {...base, name: "terminal", bg: "#0A0A0A", ink: "#E6E6E6", muted: "#6B7280", accent: "#5AD27A", boxBg: "#111111", boxText: "#5AD27A", boxBorder: "#2A2A2A", fontHead: "Mono", fontBody: "Mono", uppercase: false, grid: false, decor: "scanlines", anim: "typewriter", transition: "cut", sizes: {sm: 36, md: 48, lg: 62, xl: 84}, emphMul: 1.25, watermark: "#3F3F46", shadow: "none"},
};
export const theme = THEMES.paper;
