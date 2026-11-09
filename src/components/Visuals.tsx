import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import type {PropSpec} from '../lib/episode';
import {FONT_DISPLAY, FONT_UI} from '../lib/fonts';
import {Outlined} from './Outlined';

export type PlacedProp = PropSpec & {x: number; y: number; size: number};

// white "sticker" outline so icons read on any background
const STICKER = (size: number) => {
  const w = Math.max(4, Math.round(size * 0.022));
  return `drop-shadow(${w}px 0 0 #fff) drop-shadow(-${w}px 0 0 #fff) drop-shadow(0 ${w}px 0 #fff) drop-shadow(0 -${w}px 0 #fff) drop-shadow(0 ${w * 2.5}px 0 rgba(0,0,0,0.22))`;
};

const motion = (p: PlacedProp, frame: number, fps: number, appear: number, exit: number, index: number) => {
  const t = frame / fps;
  const k = spring({frame: frame - appear, fps, config: {damping: 11, stiffness: 150, mass: 0.7}});
  const e = interpolate(frame, [exit, exit + 9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  let tx = 0;
  let ty = 0;
  let sc = 1;
  let rot = p.rotate ?? 0;
  switch (p.anim ?? 'pop') {
    case 'drop':
      ty = (1 - k) * -700;
      break;
    case 'slide':
      tx = (1 - k) * 900 * (index % 2 ? -1 : 1);
      break;
    case 'spin':
      sc = k;
      rot += (1 - k) * 360;
      break;
    case 'grow':
      sc = interpolate(frame - appear, [0, 18], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
      break;
    default:
      sc = k;
      rot += (1 - k) * -24;
  }
  let iconRot = 0;
  switch (p.loop ?? (p.type && p.type !== 'icon' ? 'none' : 'float')) {
    case 'float':
      ty += Math.sin(t * 2.1 + index * 1.7) * 10;
      iconRot += Math.sin(t * 1.5 + index) * 4;
      break;
    case 'pulse':
      sc *= 1 + Math.sin(t * 6.5) * 0.05;
      break;
    case 'shake':
      iconRot += Math.sin(t * 28) * 7;
      break;
    case 'spin':
      iconRot += t * 70;
      break;
    default:
      break;
  }
  return {tx, ty, sc: sc * (1 - e), rot, iconRot, visible: frame >= appear && frame <= exit + 10};
};

const Label: React.FC<{text: string; size: number}> = ({text, size}) => (
  <div
    style={{
      position: 'absolute',
      top: '100%',
      left: '-60%',
      right: '-60%',
      marginTop: 6,
      textAlign: 'center',
      fontFamily: FONT_UI,
      fontWeight: 900,
      fontSize: Math.max(30, size * 0.15),
      lineHeight: 1.1,
      textTransform: 'uppercase',
    }}
  >
    <Outlined color="#fff" stroke="#0B1530" strokeWidth={Math.max(8, size * 0.035)}>
      {text}
    </Outlined>
  </div>
);

const Chart: React.FC<{p: PlacedProp; progress: number}> = ({p, progress}) => {
  const pts = p.points ?? [1, 2, 3];
  const w = p.size * 1.5;
  const h = p.size;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const xy = pts.map((v, i) => [(i / (pts.length - 1)) * (w - 40) + 20, h - 20 - ((v - min) / (max - min || 1)) * (h - 40)]);
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
  const falling = pts[pts.length - 1] < pts[0];
  const color = p.color ?? (falling ? '#FF5A5F' : '#3DDC84');
  const len = xy.reduce((acc, [x, y], i) => (i ? acc + Math.hypot(x - xy[i - 1][0], y - xy[i - 1][1]) : 0), 0);
  const head = xy[Math.min(xy.length - 1, Math.floor(progress * (xy.length - 1)))];
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: (p.size - w) / 2, top: 0, overflow: 'visible'}}>
      <rect x={0} y={0} width={w} height={h} rx={28} fill="rgba(8,16,36,0.72)" stroke="rgba(255,255,255,0.25)" strokeWidth={4} />
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={20} x2={w - 20} y1={h * g} y2={h * g} stroke="rgba(255,255,255,0.12)" strokeWidth={3} />
      ))}
      <path d={d} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - progress)} />
      <circle cx={head[0]} cy={head[1]} r={13} fill={color} stroke="#fff" strokeWidth={4} />
    </svg>
  );
};

export const PropView: React.FC<{p: PlacedProp; svg?: string; frame: number; fps: number; appear: number; exit: number; index: number}> = ({
  p,
  svg,
  frame,
  fps,
  appear,
  exit,
  index,
}) => {
  const m = motion(p, frame, fps, appear, exit, index);
  if (!m.visible) return null;
  const type = p.type ?? 'icon';
  let body: React.ReactNode = null;
  if (type === 'icon') {
    body = <div style={{width: '100%', height: '100%', transform: `rotate(${m.iconRot}deg)`}} dangerouslySetInnerHTML={{__html: svg ?? ''}} />;
  } else if (type === 'stat' || type === 'year') {
    const big = type === 'year';
    body = (
      <div
        style={{
          position: 'absolute',
          left: big ? 0 : -p.size * 0.35,
          right: big ? 0 : -p.size * 0.35,
          top: p.size * 0.18,
          height: p.size * 0.64,
          borderRadius: big ? p.size : 32,
          background: big ? '#F6C445' : 'rgba(8,16,36,0.78)',
          border: `${Math.max(6, p.size * 0.03)}px solid ${big ? '#0B1530' : '#F6C445'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT_DISPLAY,
          fontSize: p.size * (big ? 0.36 : (p.value?.length ?? 4) > 9 ? 0.2 : 0.28),
          color: big ? '#0B1530' : '#F6C445',
          lineHeight: 1,
          paddingTop: p.size * 0.04,
          boxShadow: '0 14px 0 rgba(0,0,0,0.25)',
          transform: `rotate(${m.iconRot}deg)`,
        }}
      >
        {p.value}
      </div>
    );
  } else if (type === 'chart') {
    const progress = interpolate(frame - appear, [4, 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
    body = <Chart p={p} progress={progress} />;
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: p.x - p.size / 2,
        top: p.y - p.size / 2,
        width: p.size,
        height: p.size,
        transform: `translate(${m.tx}px, ${m.ty}px) scale(${m.sc}) rotate(${m.rot}deg)`,
        filter: type === 'icon' ? STICKER(p.size) : undefined,
      }}
    >
      {body}
      {p.label ? <Label text={p.label} size={p.size} /> : null}
    </div>
  );
};

export const BigText: React.FC<{text: string; cx: number; y: number; maxWidth: number; frame: number; fps: number; appear: number; exit: number; scale?: number}> = ({
  text,
  cx,
  y,
  maxWidth,
  frame,
  fps,
  appear,
  exit,
  scale = 1,
}) => {
  if (frame < appear || frame > exit + 10) return null;
  const k = spring({frame: frame - appear, fps, config: {damping: 9, stiffness: 170, mass: 0.7}});
  const e = interpolate(frame, [exit, exit + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wobble = Math.sin((frame / fps) * 3) * 1.5;
  const size = (text.length > 16 ? 96 : text.length > 9 ? 124 : 160) * scale;
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - maxWidth / 2,
        width: maxWidth,
        top: y,
        textAlign: 'center',
        transform: `translateY(-50%) scale(${k * (1 - e)}) rotate(${-3 + wobble}deg)`,
        fontFamily: FONT_DISPLAY,
        fontSize: size,
        lineHeight: 1.08,
        textTransform: 'uppercase',
      }}
    >
      <Outlined color="#F6C445" stroke="#0B1530" strokeWidth={size * 0.13}>
        {text}
      </Outlined>
    </div>
  );
};
