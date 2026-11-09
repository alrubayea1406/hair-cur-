import React from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT_DISPLAY} from '../lib/fonts';

export const THEMES = {
  night: ['#1C2C7A', '#4B1F8F', '#7A2E9E'],
  ocean: ['#0B4F8A', '#0E7CA6', '#13B5B1'],
  sky: ['#2563EB', '#3B82F6', '#7DD3FC'],
  sunset: ['#7C1D6F', '#C2366B', '#F2845C'],
  forest: ['#14532D', '#15803D', '#65A30D'],
  space: ['#05061A', '#1B1250', '#3A1C71'],
  candy: ['#5B2A86', '#9D4EDD', '#F15BB5'],
  lab: ['#0F3D3E', '#116466', '#2C9C8F'],
} as const;

export type ThemeName = keyof typeof THEMES;

// Animated brand background: soft gradient + slowly drifting "؟" marks and dots.
export const Background: React.FC<{theme?: ThemeName; seed?: string; density?: number}> = ({
  theme = 'night',
  seed = 'bg',
  density = 14,
}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const [c1, c2, c3] = THEMES[theme];
  const t = frame / fps;
  const items = Array.from({length: density}).map((_, i) => {
    const r = (k: string) => random(`${seed}-${i}-${k}`);
    const size = 60 + r('s') * 170;
    const speed = 18 + r('v') * 30;
    const y = ((r('y') * (height + 400) - t * speed) % (height + 400) + height + 400) % (height + 400) - 200;
    const x = r('x') * width + Math.sin(t * 0.6 + i) * 30;
    const rot = (r('r') - 0.5) * 50 + Math.sin(t * 0.8 + i) * 10;
    const isMark = r('k') > 0.35;
    return {size, x, y, rot, isMark, op: 0.06 + r('o') * 0.08};
  });
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 90% at 50% 20%, ${c3} 0%, ${c2} 45%, ${c1} 100%)`,
        overflow: 'hidden',
      }}
    >
      {items.map((it, i) =>
        it.isMark ? (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: it.x,
              top: it.y,
              fontFamily: FONT_DISPLAY,
              fontSize: it.size,
              color: '#fff',
              opacity: it.op,
              transform: `translate(-50%, -50%) rotate(${it.rot}deg)`,
              lineHeight: 1,
            }}
          >
            ؟
          </div>
        ) : (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: it.x,
              top: it.y,
              width: it.size * 0.35,
              height: it.size * 0.35,
              borderRadius: '50%',
              background: '#fff',
              opacity: it.op,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ),
      )}
      <AbsoluteFill style={{background: 'radial-gradient(80% 60% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.28) 100%)'}} />
    </AbsoluteFill>
  );
};
