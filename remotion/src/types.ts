export type Word = {text: string; t: number; end: number; emph?: boolean};
export type Line =
  | {kind: "text"; words: Word[]; size?: string; box?: boolean; color?: string; emphColor?: string; underline?: boolean; fit?: boolean; annot?: "underline" | "circle" | "highlight" | "box" | "bracket"}
  | {kind: "icon"; name: string; w?: number; t: number; rotate?: number; color?: string; bg?: string}
  | {kind: "image"; src: string; w?: number; t: number; tilt?: number; blur?: number; reveal?: boolean; pan?: [number, number]}
  | {kind: "card"; name: string; w?: number; t: number; title?: string; subtitle?: string}
  | {kind: "diagram"; variant: "bridge" | "tree"; t: number; nodes?: string[]; left?: string}
  | {kind: "terminal"; lines: string[]; w?: number; title?: string; t: number}
  | {kind: "chat"; text: string; who?: "you" | "ai"; w?: number; t: number; label?: string}
  | {kind: "phone"; src: string; w?: number; t: number}
  | {kind: "badge"; text?: string; icon?: string; size?: number; t: number}
  | {kind: "clip"; src: string; w?: number; t: number; h?: number}
  | {kind: "lottie"; src: string; w?: number; t: number; loop?: boolean; speed?: number}
  | {kind: "code"; lines: string[]; lang?: string; title?: string; w?: number; t: number; theme?: string; typing?: boolean}
  | {kind: "gap"; h: number};
export type Beat = {
  id: string; start: number; end: number; lines: Line[];
  layout?: "center" | "top"; grid?: boolean; deco?: boolean;
  transition?: "zoom" | "whip" | "cut" | "wipe" | "fade" | "slide" | "push" | "leak";
  anim?: "pop" | "typewriter" | "rise" | "fill";
  bg?: {src?: string; color?: string; overlay?: number; start?: number; rate?: number};
  camera?: {zoom?: [number, number]; pan?: [number, number]};
};
export type ShortProps = {
  fps: number; durationSec: number; voSrc: string; musicSrc?: string; musicVolume?: number;
  watermark?: string; accent?: string; beats: Beat[]; sfx?: boolean; sfxLevel?: number;
  theme?: "paper" | "midnight" | "bold" | "film" | "terminal"; anim?: "pop" | "typewriter" | "rise" | "fill";
  annot?: "underline" | "circle" | "highlight" | "box" | "bracket";
};
