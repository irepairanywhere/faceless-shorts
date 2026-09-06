import React from "react";
import {theme} from "../theme";
export const Starburst: React.FC<{size: number; color?: string; rotation?: number; rays?: number; style?: React.CSSProperties}> = ({size, color = theme.accent, rotation = 0, rays = 9, style}) => {
  const L = size / 2, w = size * 0.062;
  return (
    <svg width={size} height={size} viewBox={`${-L} ${-L} ${size} ${size}`} style={{overflow: "visible", ...style}}>
      <g transform={`rotate(${rotation})`}>
        {Array.from({length: rays}).map((_, i) => (
          <path key={i} d={`M0 0 L ${w} ${-L * 0.92} L ${-w} ${-L * 0.92} Z`} fill={color} stroke={color} strokeWidth={size * 0.035} strokeLinejoin="round" transform={`rotate(${(i * 360) / rays})`} />
        ))}
      </g>
    </svg>
  );
};
