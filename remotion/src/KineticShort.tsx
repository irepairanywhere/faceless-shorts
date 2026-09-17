import React from "react";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {Video} from "@remotion/media";
import {TransitionSeries, linearTiming, springTiming, pushCut} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {slide} from "@remotion/transitions/slide";
import {wipe} from "@remotion/transitions/wipe";
import {flip} from "@remotion/transitions/flip";
import {clockWipe} from "@remotion/transitions/clock-wipe";
import {filmBurn} from "@remotion/transitions/film-burn";
import {ripple} from "@remotion/transitions/ripple";
import {zoomBlur} from "@remotion/transitions/zoom-blur";
import {dissolve} from "@remotion/transitions/dissolve";
import {dreamyZoom} from "@remotion/transitions/dreamy-zoom";
import {glassWipe} from "./components/onda/transitions/glass-wipe/glassWipe";
import {chromaticAberration} from "./components/onda/transitions/chromatic-aberration/chromaticAberration";
import {iris} from "./components/onda/transitions/iris/iris";
import {BarChart, barChartSchema} from "./components/onda/bar-chart/BarChart";
import {BrowserFrame, browserFrameSchema} from "./components/onda/browser-frame/BrowserFrame";
import {DeviceFrame, deviceFrameSchema} from "./components/onda/device-frame/DeviceFrame";
import {Cursor, cursorSchema} from "./components/onda/cursor/Cursor";
import {Annot, EmojiEl, GifEl, LeakOverlay, LottieEl, fitSize, withAlpha, type AnnotKind} from "./components/Fx";
import {CodeBlock} from "./components/Code";
import {Trail} from "@remotion/motion-blur";
import {noise2D} from "@remotion/noise";
import {loadFont as loadInter} from "@remotion/google-fonts/Inter";
import {loadFont as loadInterTight} from "@remotion/google-fonts/InterTight";
import {loadFont as loadAnton} from "@remotion/google-fonts/Anton";
import {loadFont as loadBebas} from "@remotion/google-fonts/BebasNeue";
import {THEMES, type AnimName, type Theme} from "./theme";
import {countUpText, easeOutCubic, mixColor, popIn, sec} from "./anim";
import {DotGrid} from "./components/Background";
import {Icon} from "./components/Icons";
import {Card, Shot} from "./components/Cards";
import {BridgeDiagram, TreeDiagram} from "./components/Diagrams";
import {Badge, Chat, Phone, Terminal} from "./components/Widgets";
import {TierBoard} from "./components/TierBoard";
import {Grain, Orbs, Scanlines, Starbursts, StockBg} from "./components/Decor";
import type {Beat, Line, ShortProps} from "./types";

const inter = loadInter("normal", {weights: ["400", "500", "600", "700", "800"], subsets: ["latin"]}).fontFamily;
const interTight = loadInterTight("normal", {weights: ["500", "700", "800", "900"], subsets: ["latin"]}).fontFamily;
const anton = loadAnton("normal", {weights: ["400"], subsets: ["latin"]}).fontFamily;
const bebas = loadBebas("normal", {weights: ["400"], subsets: ["latin"]}).fontFamily;
const FONT_NAMES: Record<string, string> = {Inter: inter, InterTight: interTight, Anton: anton, BebasNeue: bebas, Mono: "Menlo"};
const FONTS: Record<string, string> = {Inter: `${inter}, Helvetica, Arial, sans-serif`, InterTight: `${interTight}, ${inter}, sans-serif`, Anton: `${anton}, Impact, sans-serif`, BebasNeue: `${bebas}, Impact, sans-serif`, Mono: "Menlo, SFMono-Regular, Consolas, monospace"};

const Ctx = React.createContext<{theme: Theme; anim: AnimName; annot?: AnnotKind}>({theme: THEMES.paper, anim: "pop"});

const gradientStyle = (theme: Theme): React.CSSProperties => theme.gradient
  ? {backgroundImage: `linear-gradient(90deg, ${theme.gradient.join(", ")})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent"}
  : {};

const Word: React.FC<{w: {text: string; t: number; end: number; emph?: boolean}; i: number; base: number; mul: number; color: string; beatStart: number; frame: number; fps: number; anim: AnimName; theme: Theme; showBar: boolean; box: boolean; emphColor?: string; lineStartF: number; annot?: AnnotKind; fsOverride?: number}> = ({w, i, base, mul, color, beatStart, frame, fps, anim, theme, showBar, box, emphColor, lineStartF, annot, fsOverride}) => {
  const wf = sec(w.t - beatStart, fps);
  const fs = fsOverride ?? base * (w.emph ? mul : 1);
  const finalColor = w.emph && emphColor ? emphColor : (w.emph && !box && theme.gradient ? undefined : color);
  const flash = w.emph && anim === "pop" ? Math.max(0, 1 - (frame - wf) / 10) : 0;
  const c = finalColor && flash > 0 && finalColor.startsWith("#") ? mixColor(finalColor, theme.accent, flash) : finalColor;
  const text = w.emph ? countUpText(w.text, frame, wf, fps) : w.text;
  const shown = theme.uppercase ? text.toUpperCase() : text;
  const grad = w.emph && !box && !emphColor && theme.gradient ? gradientStyle(theme) : {};
  const common: React.CSSProperties = {position: "relative", display: "inline-block", fontSize: fs, fontWeight: w.emph ? 800 : 500, lineHeight: 1.08, whiteSpace: "pre", letterSpacing: w.emph ? (theme.uppercase ? 1 : -1) : 0, fontFamily: w.emph ? FONTS[theme.fontHead] : FONTS[theme.fontBody], ...(c ? {color: c} : {}), ...grad};
  const u = showBar ? easeOutCubic(Math.max(0, Math.min(1, (frame - wf - 5) / (0.35 * fps)))) : 0;
  const bar = showBar ? <span style={{position: "absolute", left: 0, bottom: -4, height: Math.max(6, fs * 0.09), width: `${u * 100}%`, background: theme.accent, opacity: 0.9, borderRadius: 6}} /> : null;
  const wrap = (node: React.ReactNode) => (w.emph && annot ? <Annot kind={annot} color={annot === "highlight" ? withAlpha(theme.accent, 0.55) : (emphColor ?? theme.accent)} frame={frame} startFrame={wf + 4} fps={fps}>{node}</Annot> : node);

  if (anim === "typewriter") {
    const dur = Math.max(0.18, w.end - w.t);
    const p = Math.max(0, Math.min(1, (frame - wf) / (dur * fps)));
    if (frame < wf) return null;
    const n = Math.max(1, Math.ceil(shown.length * p));
    const typing = p < 1;
    return wrap(<span style={common}>{shown.slice(0, n)}{typing ? <span style={{color: theme.accent}}>▍</span> : null}</span>);
  }
  if (anim === "rise") {
    const f = frame - wf;
    if (f < 0) return <span style={{...common, opacity: 0}}>{shown}</span>;
    const e = easeOutCubic(Math.min(1, f / (0.28 * fps)));
    return wrap(
      <span style={{display: "inline-block", overflow: "hidden", paddingBottom: 8, marginBottom: -8, verticalAlign: "baseline"}}>
        <span style={{...common, transform: `translateY(${(1 - e) * 110}%)`, opacity: Math.min(1, f / 4)}}>{shown}{bar}</span>
      </span>
    );
  }
  if (anim === "fill") {
    const visible = frame >= lineStartF;
    const spoken = frame >= wf;
    const b = spoken ? 1 + 0.15 * Math.max(0, 1 - (frame - wf) / (0.25 * fps)) : 1;
    return wrap(<span style={{...common, opacity: visible ? (spoken ? 1 : 0.28) : 0, transform: `scale(${b})`, transition: "none"}}>{shown}{spoken ? bar : null}</span>);
  }
  const a = popIn(frame, wf, fps, 0.26, w.emph ? {fromScale: 0.35, fromY: 50, damping: 8} : {fromScale: 0.65, fromY: 30, damping: 10});
  return wrap(<span style={{...common, opacity: a.opacity, transform: `translateY(${a.y}px) scale(${a.scale})`, filter: a.blur > 0.3 ? `blur(${a.blur}px)` : undefined}}>{shown}{bar}</span>);
};

const TextLine: React.FC<{line: Extract<Line, {kind: "text"}>; beatStart: number; frame: number; fps: number; index: number; anim: AnimName; ink: string; boxBg: string; boxText: string}> = ({line, beatStart, frame, fps, index, anim, ink, boxBg, boxText}) => {
  const {theme, annot: annotDefault} = React.useContext(Ctx);
  const {width: VW, height: VH} = useVideoConfig(); const wide = VW > VH;
  const base = (theme.sizes[line.size ?? "md"] ?? theme.sizes.md) * (wide ? 1.22 : 1);
  const allEmph = line.words.length > 0 && line.words.every((w) => w.emph);
  const mul = allEmph ? 1 : theme.emphMul;
  const annot: AnnotKind | undefined = line.annot ?? (annotDefault && (line.size === "lg" || line.size === "xl") ? annotDefault : undefined);
  const lineAnnot = !!annot && allEmph && anim !== "typewriter"; // one continuous annotation around the whole line
  const wordAnnot = lineAnnot ? undefined : annot;
  // auto-fit: size the whole line so it fills the column (two passes so the word gap scales with the result)
  let fsFit: number | undefined;
  if (line.fit && line.words.length > 0) {
    const anyEmph = line.words.some((w) => w.emph);
    const fam = FONT_NAMES[anyEmph ? theme.fontHead : theme.fontBody];
    const weight = anyEmph ? 800 : 500;
    const ls = anyEmph ? (theme.uppercase ? 1 : -1) : 0;
    const text = line.words.map((w) => w.text).join(" ");
    const col = (wide ? 1460 : 940) - (line.box ? base * 1.1 : 0) - (annot === "box" || annot === "circle" || annot === "bracket" ? 70 : 0);
    const cap = Math.round(theme.sizes.xl * 1.75 * (wide ? 1.22 : 1));
    const fb = base * (anyEmph ? mul : 1);
    const gaps = Math.max(0, line.words.length - 1);
    const f0 = fitSize(text, col, fam, weight, cap, fb, ls, theme.uppercase);
    fsFit = gaps ? fitSize(text, col - gaps * f0 * 0.26 + gaps * f0 * 0.25, fam, weight, cap, fb, ls, theme.uppercase) : f0;
  }
  const color = line.color ?? (line.box ? boxText : ink);
  const firstF = sec((line.words[0]?.t ?? beatStart) - beatStart, fps);
  const lineStartF = firstF - Math.round(0.15 * fps);
  const slide = anim === "pop" ? popIn(frame, firstF, fps, 0.4, {fromX: index % 2 ? 44 : -44, fromScale: 1, fromY: 0}) : {x: 0};
  const box = popIn(frame, firstF - 3, fps, 0.35, {fromScale: 0.7, fromY: 24});
  const words = line.words.map((w, i) => (
    <Word key={i} w={w} i={i} base={base} mul={mul} color={color} beatStart={beatStart} frame={frame} fps={fps} anim={anim} theme={theme} box={!!line.box} emphColor={line.emphColor} lineStartF={lineStartF} annot={wordAnnot} fsOverride={fsFit}
      showBar={!annot && !!w.emph && !line.box && line.underline !== false && (line.size === "lg" || line.size === "xl") && !theme.gradient && anim !== "typewriter"} />
  ));
  const inner = <div style={{display: "flex", flexWrap: "wrap", justifyContent: theme.name === "terminal" ? "flex-start" : "center", alignItems: "baseline", columnGap: (fsFit ?? base) * 0.26, rowGap: 6, textAlign: theme.name === "terminal" ? "left" : "center", maxWidth: wide ? 1500 : 960, transform: `translateX(${slide.x}px)`}}>{theme.name === "terminal" && index === 0 ? <span style={{color: theme.accent, fontFamily: FONTS.Mono, fontSize: base}}>›</span> : null}{words}</div>;
  const lastWf = line.words.length ? sec((line.words[line.words.length - 1].t) - beatStart, fps) : firstF;
  const annotColor = annot === "highlight" ? withAlpha(theme.accent, 0.55) : (line.emphColor ?? theme.accent);
  const annotated = lineAnnot && annot ? <Annot kind={annot} color={annotColor} frame={frame} startFrame={lastWf + 4} fps={fps} durSec={0.5}>{inner}</Annot> : inner;
  if (line.box) {
    return (
      <div style={{background: boxBg, border: theme.boxBorder ? `2px solid ${theme.boxBorder}` : undefined, borderRadius: theme.name === "bold" ? 0 : 18, padding: `${base * 0.18}px ${base * 0.55}px`, opacity: box.opacity, transform: `translateY(${box.y}px) scale(${box.scale})`, boxShadow: theme.shadow}}>{annotated}</div>
    );
  }
  return annotated;
};

const PopLine: React.FC<{t: number; beatStart: number; frame: number; fps: number; children: React.ReactNode; rotate?: number; fromX?: number; fromRot?: number}> = ({t, beatStart, frame, fps, children, rotate, fromX, fromRot}) => {
  const a = popIn(frame, sec(t - beatStart, fps), fps, 0.3, {fromScale: 0.55, fromY: 60, fromX: fromX ?? 0, fromRot: fromRot ?? -6, damping: 9});
  return <div style={{opacity: a.opacity, transform: `translate(${a.x}px, ${a.y}px) scale(${a.scale}) rotate(${a.rot + (rotate ?? 0) * a.p}deg)`, filter: a.blur > 0.3 ? `blur(${a.blur}px)` : undefined, lineHeight: 0}}>{children}</div>;
};

const Clip: React.FC<{src: string; w?: number; h?: number}> = ({src, w, h}) => (
  <div style={{width: w ?? 760, height: h ?? (w ?? 760) * 0.62, borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.45)"}}>
    <Video src={staticFile(src)} muted loop objectFit="cover" style={{width: "100%", height: "100%"}} />
  </div>
);

const Scene: React.FC<{beat: Beat; index: number; firstDecoIndex: number}> = ({beat, index, firstDecoIndex}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const wide = W > H;
  const {theme, anim: animDefault} = React.useContext(Ctx);
  const anim = beat.anim ?? animDefault;
  const len = Math.max(1, sec(beat.end - beat.start, fps));
  const prog = Math.min(1, frame / len);
  const [z0, z1] = beat.camera?.zoom ?? [1, theme.name === "film" ? 1.0 : 1.08];
  const [px, py] = beat.camera?.pan ?? [0, 0];
  const zoom = z0 + (z1 - z0) * prog;
  const dx = theme.name === "bold" ? 0 : noise2D("cam-x", frame / 55, 0) * 9, dy = theme.name === "bold" ? 0 : noise2D("cam-y", 0, frame / 63) * 7; // organic handheld drift
  const tr = beat.transition ?? theme.transition;
  const internal = tr === "zoom"; // only the zoom push-in stays in-scene; slide/wipe/whip/push/fade/leak run in TransitionSeries
  const entry = index === 0 || !internal ? 1 : Math.min(1, frame / 5);
  const entryTx = 0;
  const entryScale = internal ? 1.14 - 0.14 * easeOutCubic(entry) : 1;
  const entryBlur = internal ? 16 * (1 - entry) : 0;
  const gridOp = Math.min(1, frame / 12) * 0.9;
  const layout = beat.layout ?? "center";
  const bgColor = beat.bg?.color ?? (theme.altBg && index % 2 === 1 ? theme.altBg : theme.bg);
  const onAlt = !!theme.altBg && bgColor === theme.altBg;
  const overFootage = !!beat.bg?.src;
  const darkOnLight = !!beat.bg?.color && isDark(beat.bg.color) && !isDark(theme.bg); // v8: a dark color beat on a light theme flips to white ink
  const ink = overFootage || darkOnLight ? "#FFFFFF" : onAlt ? theme.bg : theme.ink;
  const boxBg = overFootage || darkOnLight ? "rgba(255,255,255,0.12)" : onAlt ? theme.bg : theme.boxBg;
  const boxText = overFootage || darkOnLight ? "#FFFFFF" : onAlt ? (theme.altBg as string) : theme.boxText;
  const emphOver = theme.name === "bold" ? "#F5D90A" : theme.name === "paper" ? "#FFB27A" : theme.accent;
  let elIndex = 0;
  return (
    <AbsoluteFill style={{background: bgColor}}>
      {beat.bg?.src ? <StockBg src={beat.bg.src} frame={frame} lenF={len} overlay={beat.bg.overlay} theme={theme} start={beat.bg.start} rate={beat.bg.rate} fps={fps} /> : null}
      <AbsoluteFill style={{transform: `scale(${zoom * entryScale}) translate(${px * prog + entryTx + dx}px, ${py * prog + dy}px)`, filter: entryBlur > 0.3 ? `blur(${entryBlur}px)` : undefined}}>
        {theme.grid && beat.grid !== false && <DotGrid opacity={gridOp} frame={frame} />}
        {theme.decor === "starburst" && beat.deco && index >= 2 && index === firstDecoIndex && <Starbursts frame={frame} fps={fps} color={theme.accent} />}
        {theme.decor === "orbs" && beat.deco !== false && <Orbs frame={frame} colors={theme.gradient ?? [theme.accent]} />}
        <div style={{position: "absolute", left: 0, top: 0, width: W, height: H, display: "flex", flexDirection: "column", alignItems: theme.name === "terminal" ? "flex-start" : "center", justifyContent: layout === "top" ? "flex-start" : "center", paddingTop: layout === "top" ? (wide ? 110 : 250) : 0, paddingBottom: layout === "center" ? (wide ? 90 : 220) : 0, paddingLeft: theme.name === "terminal" ? 90 : (wide ? 140 : 60), paddingRight: wide ? 140 : 60, gap: 30, boxSizing: "border-box", fontFamily: FONTS[theme.fontBody]}}>
          {beat.lines.map((line, i) => {
            if (line.kind === "text") return <TextLine key={i} line={(overFootage || darkOnLight) && !line.emphColor && !line.box ? {...line, emphColor: emphOver} : line} beatStart={beat.start} frame={frame} fps={fps} index={i} anim={anim} ink={ink} boxBg={boxBg} boxText={boxText} />;
            if (line.kind === "gap") return <div key={i} style={{height: line.h}} />;
            const startF = sec(line.t - beat.start, fps);
            const lenF = len - startF;
            const side = (elIndex++ % 2 ? 1 : -1) * 140;
            if (line.kind === "icon") {
              const sz = line.w ?? 160;
              return <PopLine key={i} t={line.t} beatStart={beat.start} frame={frame} fps={fps} rotate={line.rotate} fromRot={-14}><div style={{position: "relative", width: sz * 1.5, height: sz * 1.5, display: "flex", alignItems: "center", justifyContent: "center"}}><Trail layers={3} lagInFrames={0.6} trailOpacity={0.35}><div style={{display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%"}}><Icon name={line.name} src={line.src} size={sz} color={line.color} bg={line.bg} /></div></Trail></div></PopLine>;
            }
            if (line.kind === "emoji") return <PopLine key={i} t={line.t} beatStart={beat.start} frame={frame} fps={fps} rotate={line.rotate} fromRot={-22} fromX={side * 0.5}><EmojiEl src={line.src} name={line.name} animated={line.animated} w={line.w} frame={frame} startF={startF} float={line.float} /></PopLine>;
            if (line.kind === "gif") return <PopLine key={i} t={line.t} beatStart={beat.start} frame={frame} fps={fps} fromX={side} fromRot={0}><GifEl src={line.src} w={line.w} h={line.h} /></PopLine>;
            if (line.kind === "lottie") return <PopLine key={i} t={line.t} beatStart={beat.start} frame={frame} fps={fps} fromRot={0}><LottieEl src={line.src} w={line.w} loop={line.loop} speed={line.speed} /></PopLine>;
            if (line.kind === "code") return <PopLine key={i} t={line.t} beatStart={beat.start} frame={frame} fps={fps} fromRot={-3}><CodeBlock lines={line.lines} lang={line.lang} title={line.title} w={line.w} themeName={line.theme} typing={line.typing} frame={frame} startF={startF} fps={fps} dark={theme.name !== "paper" || !!overFootage || !!beat.bg?.color} /></PopLine>;
            if (line.kind === "card") return <PopLine key={i} t={line.t} beatStart={beat.start} frame={frame} fps={fps} fromRot={-4}><Card name={line.name} w={line.w} title={line.title} subtitle={line.subtitle} /></PopLine>;
            if (line.kind === "image") return <PopLine key={i} t={line.t} beatStart={beat.start} frame={frame} fps={fps} fromX={side} fromRot={0}><Shot src={line.src} w={line.w} tilt={line.tilt} blur={line.blur} reveal={line.reveal} pan={line.pan} frame={frame} startF={startF} lenF={lenF} fps={fps} /></PopLine>;
            if (line.kind === "clip") return <PopLine key={i} t={line.t} beatStart={beat.start} frame={frame} fps={fps} fromX={side} fromRot={0}><Clip src={line.src} w={line.w} h={line.h} /></PopLine>;
            if (line.kind === "terminal") return <PopLine key={i} t={line.t} beatStart={beat.start} frame={frame} fps={fps} fromRot={-3}><Terminal lines={line.lines} w={line.w} title={line.title} frame={frame} startF={startF} fps={fps} /></PopLine>;
            if (line.kind === "chat") return <PopLine key={i} t={line.t} beatStart={beat.start} frame={frame} fps={fps} fromX={line.who === "ai" ? -120 : 120} fromRot={0}><Chat text={line.text} who={line.who} w={line.w} label={line.label} /></PopLine>;
            if (line.kind === "phone") return <PopLine key={i} t={line.t} beatStart={beat.start} frame={frame} fps={fps} fromRot={-6}><Phone src={line.src} w={line.w} /></PopLine>;
            if (line.kind === "badge") return <PopLine key={i} t={line.t} beatStart={beat.start} frame={frame} fps={fps} fromRot={-25}><Badge text={line.text} icon={line.icon} iconSrc={line.iconSrc} size={line.size} /></PopLine>;
            if (line.kind === "tierboard") {
              const darkBoard = overFootage || darkOnLight || isDark(bgColor);
              const addsF = line.adds ? line.adds.map((a) => ({label: a.label, grade: a.grade, appearF: sec(a.t - beat.start, fps), landF: sec((a.land ?? a.t) - beat.start, fps), drop: true})) : undefined;
              return <div key={i} style={{lineHeight: 0}}><TierBoard tiers={line.tiers} placed={line.placed} add={line.add} adds={addsF} pulse={line.pulse} enter={line.enter} pop={line.pop} stamp={line.stamp} w={line.w} ratio={line.ratio} frame={frame} startF={startF} appearF={line.appear != null ? sec(line.appear - beat.start, fps) : undefined} landF={line.land != null ? sec(line.land - beat.start, fps) : undefined} fps={fps} dark={darkBoard} font={FONTS[theme.fontHead]} uppercase={theme.uppercase} colors={line.colors} /></div>;
            }
            if (line.kind === "bar-chart") {
              // Onda's own defaults assume a dark canvas (near-white label text) — override with this
              // beat's actual ink/accent so bars stay legible on light themes too (paper, bold).
              // No `placement`: PlacementBox's wrapper has no explicit width, which collapses BarChart's
              // `width: 80%` to zero — omitting it lets the beat's own flex column size it instead
              // (PlacementBox passes through untouched when placement is undefined, per its own docs).
              const chartDefaults = {color: ink, trackColor: withAlpha(ink, 0.15), barColor: withAlpha(ink, 0.4), accentColor: theme.accent};
              return <div key={i} style={{lineHeight: 0, width: "100%"}}><BarChart {...barChartSchema.parse({...chartDefaults, ...line, delay: startF})} /></div>;
            }
            if (line.kind === "browser-frame") return <div key={i} style={{lineHeight: 0}}><BrowserFrame {...browserFrameSchema.parse({...line, delay: startF})} /></div>;
            if (line.kind === "device-frame") return <div key={i} style={{lineHeight: 0}}><DeviceFrame {...deviceFrameSchema.parse({...line, delay: startF})} /></div>;
            if (line.kind === "cursor") return <Cursor key={i} {...cursorSchema.parse({...line, delay: startF})} />;
            if (line.kind === "diagram") {
              return line.variant === "tree"
                ? <TreeDiagram key={i} frame={frame} startF={startF} fps={fps} nodes={line.nodes} />
                : <BridgeDiagram key={i} frame={frame} startF={startF} fps={fps} nodes={line.nodes} left={line.left} />;
            }
            return null;
          })}
        </div>
      </AbsoluteFill>
      {(theme.decor === "grain" || overFootage) && <Grain frame={frame} />}
      {theme.decor === "scanlines" && <Scanlines />}
    </AbsoluteFill>
  );
};

type SfxEvent = {t: number; file: string; vol: number; family: string};
const NUMISH = /^\$?\d[\d,]*\+?[.,;:!?]*$/;
const collectSfx = (beats: Beat[], theme: Theme, level: number): SfxEvent[] => {
  const ev: SfxEvent[] = [];
  // Sound families rotate through a small pool (original ElevenLabs hit + CC0 Kenney variants) so the same clink never repeats back-to-back.
  const POOL: Record<string, string[]> = {
    tick: ["tick", "kenney/click1", "kenney/click3", "kenney/click2"],
    ding: ["ding", "kenney/confirm3", "kenney/confirm4"],
    pop: ["pop", "kenney/drop1", "kenney/pep3"],
    shutter: ["shutter", "kenney/card2", "kenney/card3"],
    // NO thud/boom sounds, ever (Ahmed, 4th time, 2026-09-09): whoosh.mp3 + thud*.mp3 are moved out of public/sfx/ (.retired-sfx/).
    thud: [],
    whoosh: ["kenney/maximize1", "kenney/maximize2", "kenney/maximize3"],
    swish: ["swish", "kenney/minimize1", "kenney/open1"],
    notify: ["notify", "kenney/glass1", "kenney/glass2"],
  };
  const rr: Record<string, number> = {};
  const BANNED = /thud|whoosh\.mp3|boom|hit|impact|bong/;
  const push = (t: number, family: string, vol: number) => {
    const pool = (POOL[family] ?? [family]).filter((f) => !BANNED.test(`${f}.mp3`));
    if (pool.length === 0) return;
    const pick = pool[(rr[family] ?? 0) % pool.length]; rr[family] = (rr[family] ?? 0) + 1;
    ev.push({t, file: `sfx/${pick}.mp3`, vol: vol * level, family});
  };
  beats.forEach((b, i) => {
    const tr = b.transition ?? theme.transition;
    if (i > 0) {
      if (tr === "wipe") push(b.start, "swish", 0.35);
      else if (tr === "whip" || tr === "slide") push(b.start, "whoosh", 0.4);
      else if (tr === "zoom" || tr === "leak") push(b.start, "swish", 0.35);
      else if (tr === "push") push(b.start, "swish", 0.35);
      else if (tr === "flip" || tr === "clock" || tr === "glass" || tr === "iris") push(b.start, "whoosh", 0.4);
      else if (tr === "film" || tr === "ripple" || tr === "blur" || tr === "dissolve" || tr === "dreamy" || tr === "chromatic") push(b.start, "swish", 0.35);
    }
    for (const l of b.lines) {
      if (l.kind === "text") {
        for (const w of l.words) {
          if (!w.emph) continue;
          if (NUMISH.test(w.text) && parseInt(w.text.replace(/[^0-9]/g, ""), 10) >= 100) push(w.t + 0.7, "ding", 0.3);
        }
      } else if (l.kind === "chat") push(l.t, "notify", 0.35);
      else if (l.kind === "badge") push(l.t, "tick", 0.3);
      else if (l.kind === "image" || l.kind === "card" || l.kind === "clip" || l.kind === "phone") push(l.t, "shutter", 0.3);
      else if (l.kind === "icon") push(l.t, "pop", 0.25);
      else if (l.kind === "emoji") push(l.t, "pop", 0.3);
      else if (l.kind === "gif") push(l.t, "shutter", 0.3);
      else if (l.kind === "browser-frame" || l.kind === "device-frame") push(l.t, "shutter", 0.3);
      else if (l.kind === "bar-chart") push(l.t, "swish", 0.3);
      else if (l.kind === "cursor" && l.click !== false) push(l.t + 1.2, "tick", 0.25); // approx. arrival + click, matches Onda's default 24f travel + 6f click delay
      else if (l.kind === "terminal") l.lines.slice(0, 2).forEach((_, k) => push(l.t + 0.5 * k, "tick", 0.2));
      else if (l.kind === "tierboard") { if (l.stamp) push(l.t + 0.25, "shutter", 0.35); if (l.adds) l.adds.forEach((a) => push(a.t + 0.3, "pop", 0.3)); else if (l.add) push(l.land ?? l.t + 0.9, "pop", 0.3); else if (l.enter || l.pop) push(l.t, "swish", 0.3); } // v9: pops on landings (pool rotates, capped); stamp = shutter, never a thud
    }
  });
  ev.sort((a, b) => a.t - b.t);
  const out: SfxEvent[] = []; let lastT = -9; const lastByFam: Record<string, number> = {}; const countByFam: Record<string, number> = {};
  const CAP: Record<string, number> = {ding: 2, tick: 3, shutter: 3, notify: 3, pop: 5, thud: 4, whoosh: 4, swish: 4};
  for (const e of ev) {
    if (e.t - lastT < 0.22) continue;
    if ((lastByFam[e.family] ?? -9) > e.t - 0.6) continue;             // same family never twice within 0.6s
    if ((countByFam[e.family] ?? 0) >= (CAP[e.family] ?? 3)) continue; // and capped per video
    out.push(e); lastT = e.t; lastByFam[e.family] = e.t; countByFam[e.family] = (countByFam[e.family] ?? 0) + 1;
  }
  return out;
};

const LEAK_FRAMES = 18;
const isDark = (c: string) => { if (!c.startsWith("#") || c.length !== 7) return false; const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16); return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 110; };
type Pres = {p: ReturnType<typeof fade>; t: ReturnType<typeof linearTiming>};
const presentationFor = (tr: string, i: number, W = 1080, H = 1920): Pres | null => {
  // v8: Remotion built-ins (flip/clock/film/ripple/blur/dissolve/dreamy) + Onda copy-paste presentations (glass/chromatic/iris).
  if (tr === "flip") return {p: flip({direction: i % 2 ? "from-left" : "from-right", perspective: 1400}) as Pres["p"], t: springTiming({config: {damping: 200}, durationInFrames: 14})};
  if (tr === "clock") return {p: clockWipe({width: W, height: H}) as Pres["p"], t: linearTiming({durationInFrames: 16})};
  if (tr === "film") return {p: filmBurn({seed: i}) as Pres["p"], t: linearTiming({durationInFrames: 14})};
  if (tr === "ripple") return {p: ripple({}) as Pres["p"], t: linearTiming({durationInFrames: 14})};
  if (tr === "blur") return {p: zoomBlur({}) as Pres["p"], t: linearTiming({durationInFrames: 11})};
  if (tr === "dissolve") return {p: dissolve({}) as Pres["p"], t: linearTiming({durationInFrames: 14})};
  if (tr === "dreamy") return {p: dreamyZoom({}) as Pres["p"], t: linearTiming({durationInFrames: 14})};
  if (tr === "glass") return {p: glassWipe({direction: i % 2 ? "left" : "right", frost: 14}) as Pres["p"], t: linearTiming({durationInFrames: 14})};
  if (tr === "chromatic") return {p: chromaticAberration({intensity: 28}) as Pres["p"], t: linearTiming({durationInFrames: 10})};
  if (tr === "iris") return {p: iris({width: W, height: H}) as Pres["p"], t: linearTiming({durationInFrames: 14})};
  if (tr === "whip") return {p: slide({direction: i % 2 ? "from-left" : "from-right"}) as Pres["p"], t: springTiming({config: {damping: 200}, durationInFrames: 12})};
  if (tr === "slide") return {p: slide({direction: "from-bottom"}) as Pres["p"], t: springTiming({config: {damping: 200}, durationInFrames: 14})};
  if (tr === "wipe") return {p: wipe({direction: i % 2 ? "from-right" : "from-left"}) as Pres["p"], t: linearTiming({durationInFrames: 12})};
  if (tr === "fade") return {p: fade(), t: linearTiming({durationInFrames: 10})};
  if (tr === "zoom") return {p: fade(), t: linearTiming({durationInFrames: 8})};
  if (tr === "push") return {p: pushCut({flashColor: "#FFFFFF", flashOpacity: 0.22}) as Pres["p"], t: linearTiming({durationInFrames: 10})};
  return null; // cut, leak (overlay), unknown
};

export const KineticShort: React.FC<ShortProps> = (props) => {
  const {fps, durationInFrames, width: W, height: H} = useVideoConfig();
  const wide = W > H;
  const theme = THEMES[props.theme ?? "paper"] ?? THEMES.paper;
  const anim = props.anim ?? theme.anim;
  const musicVol = props.musicVolume ?? 0.12;
  const sfx = props.sfx ? collectSfx(props.beats, theme, props.sfxLevel ?? 0.8) : [];
  // Real scene transitions via TransitionSeries. Each sequence is extended by the duration of the transition INTO the
  // next beat, so every beat still starts exactly on its VO-derived frame (sum(len_i + out_i) - sum(in_i) == sum(len_i)).
  const starts = props.beats.map((b) => sec(b.start, fps));
  const firstDecoIndex = props.beats.findIndex((b, i) => i >= 2 && b.deco); // starbursts: one beat per video, never the opening two
  const items: React.ReactNode[] = [];
  props.beats.forEach((beat, i) => {
    const trName = i === 0 ? "cut" : (beat.transition ?? theme.transition);
    const pres = i === 0 ? null : presentationFor(trName, i, W, H);
    const next = props.beats[i + 1];
    const nextPres = next ? presentationFor(next.transition ?? theme.transition, i + 1, W, H) : null;
    const outDur = nextPres ? nextPres.t.getDurationInFrames({fps}) : 0;
    const end = i + 1 < props.beats.length ? starts[i + 1] : durationInFrames;
    const len = Math.max(1, end - starts[i]);
    if (i > 0) {
      if (pres) items.push(<TransitionSeries.Transition key={`t${i}`} presentation={pres.p} timing={pres.t} />);
      else if (trName === "leak") items.push(<TransitionSeries.Overlay key={`o${i}`} durationInFrames={LEAK_FRAMES}><LeakOverlay seed={i * 7} hue={theme.name === "midnight" ? 250 : 15} opacity={isDark(beat.bg?.color ?? theme.bg) ? 1 : 0.42} /></TransitionSeries.Overlay>);
    }
    items.push(<TransitionSeries.Sequence key={beat.id} durationInFrames={len + outDur}><Scene beat={beat} index={i} firstDecoIndex={firstDecoIndex} /></TransitionSeries.Sequence>);
  });
  return (
    <Ctx.Provider value={{theme, anim, annot: props.annot}}>
      <AbsoluteFill style={{background: theme.bg, fontFamily: FONTS[theme.fontBody]}}>
        <TransitionSeries>{items}</TransitionSeries>
        {props.watermark ? (
          <div style={{position: "absolute", left: 0, right: 0, top: wide ? H - 96 : 1650, textAlign: "center", fontSize: wide ? 34 : 46, fontWeight: 600, color: theme.watermark, fontFamily: FONTS[theme.fontBody], letterSpacing: 0.5, zIndex: 60}}>{props.watermark}</div>
        ) : null}
        {props.voSrc ? <Audio src={staticFile(props.voSrc)} /> : null}
        {props.musicSrc ? <Audio src={staticFile(props.musicSrc)} loop volume={(f) => musicVol * Math.min(1, f / 15, Math.max(0, (durationInFrames - f) / 30))} /> : null}
        {sfx.map((e, i) => { const from = sec(e.t, fps); if (from >= durationInFrames - 2) return null; return <Sequence key={`sfx${i}`} from={from} durationInFrames={Math.min(40, durationInFrames - from)}><Audio src={staticFile(e.file)} volume={e.vol} /></Sequence>; })}
      </AbsoluteFill>
    </Ctx.Provider>
  );
};
