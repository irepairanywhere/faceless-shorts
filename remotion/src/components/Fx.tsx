import React from "react";
import {Easing, Solid, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {lightLeak} from "@remotion/effects/light-leak";
import {Box, Bracket, Circle, Highlight, Underline} from "@remotion/rough-notation";
import {fitText} from "@remotion/layout-utils";
import {Lottie, type LottieAnimationData} from "@remotion/lottie";
import {cancelRender, continueRender, delayRender, staticFile} from "remotion";

export type AnnotKind = "underline" | "circle" | "highlight" | "box" | "bracket";

/** Light leak that evolves then retracts over its own Sequence (use inside <TransitionSeries.Overlay>).
 *  Needs WebGL2 during renders: remotion.config.ts sets Config.setChromiumOpenGlRenderer("angle"). */
export const LeakOverlay: React.FC<{seed?: number; hue?: number; opacity?: number}> = ({seed = 0, hue = 0, opacity = 1}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const progress = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <Solid
      width={1080}
      height={1920}
      style={{position: "absolute", left: 0, top: 0, mixBlendMode: "screen", opacity, pointerEvents: "none"}}
      effects={[lightLeak({seed, hueShift: hue, progress})]}
    />
  );
};

/** Hand-drawn annotation (rough-notation) around an inline element, drawn from startFrame over durSec. */
export const Annot: React.FC<{kind: AnnotKind; color: string; frame: number; startFrame: number; fps: number; durSec?: number; strokeWidth?: number; children: React.ReactNode}> = ({kind, color, frame, startFrame, fps, durSec = 0.45, strokeWidth, children}) => {
  const progress = interpolate(frame, [startFrame, startFrame + durSec * fps], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const sw = strokeWidth ?? 6;
  if (kind === "circle") return <Circle color={color} strokeWidth={sw} padding={{left: 18, right: 18, top: 8, bottom: 8}} iterations={2} progress={progress}>{children}</Circle>;
  if (kind === "highlight") return <Highlight color={color} padding={{left: 6, right: 6, top: 0, bottom: 0}} iterations={2} progress={progress}>{children}</Highlight>;
  if (kind === "box") return <Box color={color} strokeWidth={sw} padding={{left: 14, right: 14, top: 8, bottom: 8}} iterations={2} progress={progress}>{children}</Box>;
  if (kind === "bracket") return <Bracket color={color} strokeWidth={sw} bracketLeft bracketRight padding={{left: 10, right: 10, top: 6, bottom: 6}} progress={progress}>{children}</Bracket>;
  return <Underline color={color} strokeWidth={sw} iterations={2} progress={progress}>{children}</Underline>;
};

/** Font size that makes `text` fill `width` (capped). Falls back to `fallback` until the font is loaded, so a
 *  fallback-font measurement never gets cached. Pass the bare loaded family name, not a fallback stack. */
export const fitSize = (text: string, width: number, fontFamily: string, fontWeight: number | string, cap: number, fallback: number, letterSpacing = 0, uppercase = false): number => {
  try {
    const {fontSize} = fitText({
      text: uppercase ? text.toUpperCase() : text,
      withinWidth: width,
      fontFamily,
      fontWeight,
      letterSpacing: letterSpacing ? `${letterSpacing}px` : undefined,
      validateFontIsLoaded: true,
    });
    return Math.max(24, Math.min(cap, Math.floor(fontSize)));
  } catch {
    return fallback;
  }
};

/** "#RRGGBB" -> "rgba(r,g,b,a)"; non-hex colors pass through. */
export const withAlpha = (hex: string, a: number): string => {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

/** Lottie animation from remotion/public/lottie/<file>.json (drop free LottieFiles JSONs there). */
export const LottieEl: React.FC<{src: string; w?: number; loop?: boolean; speed?: number}> = ({src, w = 420, loop = true, speed = 1}) => {
  const [data, setData] = React.useState<LottieAnimationData | null>(null);
  const [handle] = React.useState(() => delayRender(`lottie ${src}`));
  React.useEffect(() => {
    fetch(staticFile(src)).then((r) => r.json()).then((d) => { setData(d as LottieAnimationData); continueRender(handle); }).catch((e) => cancelRender(e));
  }, [handle, src]);
  if (!data) return <div style={{width: w, height: w}} />;
  return <Lottie animationData={data} loop={loop} playbackRate={speed} style={{width: w}} />;
};
