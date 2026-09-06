import React from "react";
import {cancelRender, continueRender, delayRender} from "remotion";
import {highlight, getThemeColors} from "@code-hike/lighter";
import {easeOutCubic} from "../anim";

type Token = {content: string; style?: React.CSSProperties};
type Highlighted = {lines: Token[][]; bg: string; fg: string};

const cache = new Map<string, Highlighted>();

/** Syntax-highlighted code window (code-hike lighter), revealed line by line with optional typing on the current line.
 *  Themes: github-dark (default), dracula, one-dark-pro, monokai, nord, github-light, min-light, … (lighter THEME_NAMES). */
export const CodeBlock: React.FC<{lines: string[]; lang?: string; title?: string; w?: number; themeName?: string; typing?: boolean; frame: number; startF: number; fps: number; dark?: boolean}> = ({lines, lang = "html", title, w = 980, themeName, typing = true, frame, startF, fps, dark = true}) => {
  const theme = themeName ?? (dark ? "github-dark" : "github-dark");
  const code = lines.join("\n");
  const key = `${theme}|${lang}|${code}`;
  const [hl, setHl] = React.useState<Highlighted | null>(cache.get(key) ?? null);
  const [handle] = React.useState(() => (cache.has(key) ? null : delayRender(`highlight ${lang}`)));
  React.useEffect(() => {
    if (cache.has(key)) { setHl(cache.get(key)!); return; }
    Promise.all([highlight(code, lang as never, theme as never), getThemeColors(theme as never)])
      .then(([res, colors]) => {
        const out: Highlighted = {
          lines: (res.lines as Token[][]).map((ln) => ln.map((t) => ({content: t.content, style: t.style as React.CSSProperties}))),
          bg: (colors as {background?: string}).background ?? "#0d1117",
          fg: (colors as {foreground?: string}).foreground ?? "#e6edf3",
        };
        cache.set(key, out); setHl(out); if (handle !== null) continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [key, code, lang, theme, handle]);

  const f = frame - startF;
  const stag = Math.round(0.32 * fps);
  const fontSize = 28, lh = 38;
  const chrome = (
    <div style={{height: 54, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10, padding: "0 20px"}}>
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <span key={c} style={{width: 16, height: 16, borderRadius: 8, background: c, display: "inline-block"}} />)}
      <span style={{marginLeft: 14, color: "#9a9a9a", fontSize: 22, fontFamily: "Menlo, SFMono-Regular, Consolas, monospace"}}>{title ?? lang}</span>
    </div>
  );
  const bg = hl?.bg ?? "#0d1117";
  return (
    <div style={{width: w, background: bg, borderRadius: 18, boxShadow: "-18px 26px 34px rgba(0,0,0,0.3)", overflow: "hidden", fontFamily: "Menlo, SFMono-Regular, Consolas, monospace", textAlign: "left"}}>
      {chrome}
      <div style={{padding: "22px 28px", display: "flex", flexDirection: "column", gap: 0}}>
        {lines.map((raw, i) => {
          const lf = f - i * stag;
          if (lf < 0) return <div key={i} style={{height: lh}} />;
          const toks = hl?.lines[i] ?? [{content: raw}];
          const total = raw.length;
          const shown = typing ? Math.min(total, Math.ceil((lf / (0.45 * fps)) * Math.max(1, total))) : total;
          const op = typing ? 1 : easeOutCubic(Math.min(1, lf / (0.25 * fps)));
          let used = 0;
          const spans: React.ReactNode[] = [];
          for (let k = 0; k < toks.length; k++) {
            const t = toks[k];
            const take = Math.max(0, Math.min(t.content.length, shown - used));
            used += t.content.length;
            if (take <= 0) break;
            spans.push(<span key={k} style={{...(t.style ?? {}), color: (t.style as {color?: string} | undefined)?.color ?? hl?.fg ?? "#e6edf3"}}>{t.content.slice(0, take)}</span>);
          }
          const cursor = typing && shown < total;
          return (
            <div key={i} style={{fontSize, lineHeight: `${lh}px`, height: lh, whiteSpace: "pre", opacity: op, color: hl?.fg ?? "#e6edf3"}}>
              {spans}{cursor ? <span style={{color: "#E5744C"}}>▍</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
