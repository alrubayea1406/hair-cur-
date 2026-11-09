import React from 'react';

// Text with a thick outline that never eats into the glyphs (stroke layer behind fill layer).
export const Outlined: React.FC<{
  children: React.ReactNode;
  color: string;
  stroke?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
  shadow?: boolean;
}> = ({children, color, stroke = '#2A1650', strokeWidth = 14, style, shadow = true}) => (
  <span style={{position: 'relative', display: 'inline-block', ...style}}>
    <span
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        color: stroke,
        WebkitTextStroke: `${strokeWidth}px ${stroke}`,
        textShadow: shadow ? `0 ${strokeWidth * 0.6}px 0 rgba(0,0,0,0.35)` : undefined,
      }}
    >
      {children}
    </span>
    <span style={{position: 'relative', color}}>{children}</span>
  </span>
);
