import React from "react";
import {theme} from "../theme";
export const DotGrid: React.FC<{opacity: number; frame?: number}> = ({opacity, frame = 0}) => (
  <svg width={1080} height={1920} style={{position: "absolute", left: 0, top: 0, opacity, transform: `translate(${-frame * 0.15}px, ${-frame * 0.1}px)`}}>
    <defs>
      <pattern id="plusgrid" width={64} height={64} patternUnits="userSpaceOnUse">
        <path d="M32 25 V39 M25 32 H39" stroke={theme.grid} strokeWidth={2.2} strokeLinecap="round" />
      </pattern>
    </defs>
    <rect x={64} y={470} width={1020} height={1020} fill="url(#plusgrid)" />
  </svg>
);
