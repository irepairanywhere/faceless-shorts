import React from "react";
import {Composition} from "remotion";
import {KineticShort} from "./KineticShort";
import type {ShortProps} from "./types";

const demo: ShortProps = {
  fps: 30, durationSec: 6, voSrc: "", watermark: "rocketlaunchmedia.com",
  beats: [
    {id: "a", start: 0, end: 3, deco: true, grid: false, lines: [
      {kind: "text", size: "md", words: [{text: "You", t: 0.2, end: 0.4}, {text: "can", t: 0.4, end: 0.6}, {text: "now", t: 0.6, end: 0.8}, {text: "run", t: 0.8, end: 1.0}]},
      {kind: "text", size: "xl", words: [{text: "CLAUDE", t: 1.1, end: 1.4, emph: true}, {text: "CODE", t: 1.4, end: 1.7, emph: true}]},
      {kind: "card", name: "claude", w: 760, t: 1.8},
      {kind: "text", size: "lg", box: true, words: [{text: "completely", t: 2.2, end: 2.5}, {text: "free", t: 2.5, end: 2.8, emph: true}]},
    ]},
    {id: "b", start: 3, end: 6, layout: "top", lines: [
      {kind: "text", size: "md", words: [{text: "It", t: 3.2, end: 3.3}, {text: "acts", t: 3.3, end: 3.5}, {text: "as", t: 3.5, end: 3.6}, {text: "a", t: 3.6, end: 3.7}, {text: "bridge", t: 3.7, end: 4.0, emph: true}]},
      {kind: "diagram", variant: "bridge", t: 4.0},
    ]},
  ],
};


export const Root: React.FC = () => (
  <>
  <Composition
    id="KineticShort"
    component={KineticShort}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={180}
    defaultProps={demo}
    calculateMetadata={async ({props}) => ({durationInFrames: Math.max(30, Math.ceil(props.durationSec * 30)), fps: 30, width: props.width ?? 1080, height: props.height ?? 1920})}
  />
  </>
);
