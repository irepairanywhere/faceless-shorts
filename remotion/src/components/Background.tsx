import React from "react";
import {useVideoConfig} from "remotion";
import {theme} from "../theme";
export const DotGrid: React.FC<{opacity: number; frame?: number}> = ({opacity, frame = 0}) => {
  const {width: W, height: H} = useVideoConfig(); const wide = W > H;
  return (
  <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, opacity, transform: `translate(${-frame * 0.15}px, ${-frame * 0.1}px)`}}>
    <defs>
      <pattern id="plusgrid" width={64} height={64} patternUnits="userSpaceOnUse">
        <path d="M32 25 V39 M25 32 H39" stroke={theme.grid} strokeWidth={2.2} strokeLinecap="round" />
      </pattern>
    </defs>
    <rect x={64} y={wide ? 64 : 470} width={wide ? W - 128 : 1020} height={wide ? H - 128 : 1020} fill="url(#plusgrid)" />
  </svg>
  );
};
