import React from 'react';
import {AbsoluteFill, random, useVideoConfig} from 'remotion';
import {FONT_DISPLAY} from '../lib/fonts';

type Motif = 'money' | 'map' | 'grid' | 'stars';

export const THEMES: Record<string, {colors: [string, string, string]; motif: Motif; ink: string}> = {
  studio: {colors: ['#0B1530', '#173061', '#2C5AA0'], motif: 'money', ink: '#ffffff'},
  vault: {colors: ['#071F17', '#0F3E2C', '#1E6B4A'], motif: 'money', ink: '#F6C445'},
  parchment: {colors: ['#B98B4E', '#D9BC86', '#F1E2BF'], motif: 'map', ink: '#5A3B1A'},
  desert: {colors: ['#8A3B1C', '#D9772F', '#F7C46C'], motif: 'map', ink: '#FFF3D6'},
  crimson: {colors: ['#22070D', '#4F0F1C', '#8E1D2C'], motif: 'grid', ink: '#ffffff'},
  chart: {colors: ['#08131F', '#10263C', '#1B3D5C'], motif: 'grid', ink: '#7FD1FF'},
  sky: {colors: ['#1D4ED8', '#3B82F6', '#93C5FD'], motif: 'money', ink: '#ffffff'},
  night: {colors: ['#140F3A', '#2E1F6B', '#5B3AA0'], motif: 'stars', ink: '#ffffff'},
};

export type ThemeName = keyof typeof THEMES;

// Animated background: gradient + slowly drifting motif (money signs, map lines, chart grid, stars).
export const Background: React.FC<{theme?: ThemeName; seed?: string; density?: number; t?: number}> = ({
  theme = 'studio',
  seed = 'bg',
  density = 16,
  t = 0,
}) => {
  const {width, height} = useVideoConfig();
  const th = THEMES[theme] ?? THEMES.studio;
  const [c1, c2, c3] = th.colors;
  const items = Array.from({length: density}).map((_, i) => {
    const r = (k: string) => random(`${seed}-${i}-${k}`);
    const size = 50 + r('s') * 150;
    const speed = 12 + r('v') * 22;
    const span = height + 400;
    const y = ((((r('y') * span - t * speed) % span) + span) % span) - 200;
    const x = r('x') * width + Math.sin(t * 0.5 + i) * 25;
    return {size, x, y, rot: (r('r') - 0.5) * 40 + Math.sin(t * 0.7 + i) * 8, kind: r('k'), op: 0.05 + r('o') * 0.07};
  });
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 95% at 50% 25%, ${c3} 0%, ${c2} 48%, ${c1} 100%)`, overflow: 'hidden'}}>
      {th.motif === 'grid' ? (
        <AbsoluteFill
          style={{
            opacity: 0.12,
            backgroundImage: `linear-gradient(${th.ink} 2px, transparent 2px), linear-gradient(90deg, ${th.ink} 2px, transparent 2px)`,
            backgroundSize: '90px 90px',
            backgroundPosition: `${(t * 12) % 90}px ${(t * 6) % 90}px`,
          }}
        />
      ) : null}
      {th.motif === 'map'
        ? Array.from({length: 6}).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: -200,
                right: -200,
                top: (i + 0.5) * (height / 6),
                height: 0,
                borderTop: `3px dashed ${th.ink}`,
                opacity: 0.1,
                transform: `rotate(${(random(`${seed}-m${i}`) - 0.5) * 8}deg) translateX(${Math.sin(t * 0.3 + i) * 30}px)`,
              }}
            />
          ))
        : null}
      {items.map((it, i) => {
        if (th.motif === 'grid') return null;
        if (th.motif === 'stars' || th.motif === 'map') {
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: it.x,
                top: it.y,
                width: it.size * 0.12,
                height: it.size * 0.12,
                borderRadius: '50%',
                background: th.ink,
                opacity: it.op * 1.6,
                transform: 'translate(-50%, -50%)',
              }}
            />
          );
        }
        return it.kind > 0.45 ? (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: it.x,
              top: it.y,
              fontFamily: FONT_DISPLAY,
              fontSize: it.size,
              color: th.ink,
              opacity: it.op,
              transform: `translate(-50%, -50%) rotate(${it.rot}deg)`,
              lineHeight: 1,
            }}
          >
            $
          </div>
        ) : (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: it.x,
              top: it.y,
              width: it.size * 0.5,
              height: it.size * 0.5,
              borderRadius: '50%',
              border: `${Math.max(3, it.size * 0.06)}px solid ${th.ink}`,
              opacity: it.op,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
      <AbsoluteFill style={{background: 'radial-gradient(85% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.32) 100%)'}} />
    </AbsoluteFill>
  );
};
