import React from 'react';
import {random, spring} from 'remotion';
import {Sterling} from './Sterling';
import {FACES, POSES, blendFace, blendPose, lerp, type Expression, type Pose, type Vec} from './params';

// A "beat" changes something about the host at a given frame. Anything not mentioned keeps its
// previous value; every change is blended with a spring so motion always looks smooth.
export interface Beat {
  at: number;
  expression?: Expression;
  pose?: Pose;
  look?: Vec;
  tilt?: number;
  hop?: boolean;
  coin?: boolean; // flip the gold coin
}

interface Key<T> {
  at: number;
  value: T;
}
type SpringCfg = {damping: number; stiffness: number; mass: number};
const FACE_SPRING: SpringCfg = {damping: 18, stiffness: 190, mass: 0.7};
const POSE_SPRING: SpringCfg = {damping: 14, stiffness: 120, mass: 0.9};
const LOOK_SPRING: SpringCfg = {damping: 20, stiffness: 160, mass: 0.7};
const SETTLE = 75;
export const COIN_FLIP_FRAMES = 30;

const keysOf = <T,>(beats: Beat[], pick: (b: Beat) => T | undefined, initial: T): Key<T>[] => {
  const out: Key<T>[] = [{at: -1e9, value: initial}];
  [...beats]
    .sort((a, b) => a.at - b.at)
    .forEach((b) => {
      const v = pick(b);
      if (v !== undefined) out.push({at: b.at, value: v});
    });
  return out;
};

const sample = <T,>(keys: Key<T>[], f: number, fps: number, cfg: SpringCfg, mix: (a: T, b: T, t: number) => T): T => {
  let idx = 0;
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].at <= f) idx = i;
    else break;
  }
  if (idx === 0) return keys[0].value;
  const since = f - keys[idx].at;
  if (since > SETTLE) return keys[idx].value;
  const from = sample(keys.slice(0, idx), keys[idx].at, fps, cfg, mix);
  return mix(from, keys[idx].value, spring({frame: since, fps, config: cfg}));
};

export const blinkAt = (f: number, seed: string): number => {
  let start = 10 + Math.floor(random(`${seed}-b0`) * 40);
  let i = 0;
  while (start + 7 <= f) {
    i++;
    start += 70 + Math.floor(random(`${seed}-b${i}`) * 90);
  }
  const k = f - start;
  const curve = [0.4, 0.85, 1, 0.9, 0.55, 0.25, 0.05];
  return k >= 0 && k < curve.length ? curve[k] : 0;
};

const hopAt = (k: number) => {
  if (k < 0 || k > 24) return {jump: 0, squash: 0};
  if (k < 4) return {jump: 0, squash: 0.04 * (k / 4)};
  if (k < 17) {
    const p = (k - 4) / 13;
    return {jump: Math.sin(p * Math.PI) * 42, squash: -0.03 * Math.sin(p * Math.PI)};
  }
  return {jump: 0, squash: 0.05 * (1 - (k - 17) / 7)};
};

export interface ActorProps {
  beats: Beat[];
  frame: number; // episode frame (lets clips jump around the timeline)
  fps: number;
  envelope?: number[];
  seed?: string;
  style?: React.CSSProperties;
}

export const Actor: React.FC<ActorProps> = ({beats, frame, fps, envelope, seed = 'host', style}) => {
  const t = frame / fps;
  const face = sample(keysOf(beats, (b) => (b.expression ? FACES[b.expression] : undefined), FACES.happy), frame, fps, FACE_SPRING, blendFace);
  const pose = sample(keysOf(beats, (b) => (b.pose ? POSES[b.pose] : undefined), POSES.idle), frame, fps, POSE_SPRING, blendPose);
  const lookBase = sample(keysOf(beats, (b) => b.look, {x: 0, y: 0}), frame, fps, LOOK_SPRING, (a, b, k) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)}));
  const tiltBase = sample(keysOf(beats, (b) => b.tilt, 0), frame, fps, LOOK_SPRING, lerp);
  const look = {x: lookBase.x + Math.sin(t * 0.8) * 0.06, y: lookBase.y + Math.cos(t * 0.6) * 0.05};

  const env = (i: number) => (envelope ? envelope[i] ?? 0 : 0);
  const talk = Math.min(1, env(frame - 1) * 0.25 + env(frame) * 0.5 + env(frame + 1) * 0.25);

  let jump = 0;
  let squash = 0;
  let coin = -1;
  let currentPose = 'idle' as Pose;
  for (const b of [...beats].sort((x, y) => x.at - y.at)) {
    if (b.at <= frame && b.pose) currentPose = b.pose;
    if (b.hop) {
      const h = hopAt(frame - b.at);
      jump += h.jump;
      squash += h.squash;
    }
    if (b.coin && frame >= b.at && frame < b.at + COIN_FLIP_FRAMES) coin = (frame - b.at) / COIN_FLIP_FRAMES;
  }
  if (coin < 0 && currentPose === 'coin') coin = 0;

  const lean = Math.sin(t * Math.PI * 2 * 0.17) * 0.8 + talk * 0.6 * Math.sin(t * 5.1);
  const headTilt = tiltBase + Math.sin(t * Math.PI * 2 * 0.23) * 1.6 + talk * 2.2 * Math.sin(t * 6.3);

  return (
    <Sterling
      face={face}
      pose={pose}
      t={t}
      talk={talk}
      blink={blinkAt(frame, seed)}
      look={look}
      jump={jump}
      squash={squash}
      lean={lean}
      headTilt={headTilt}
      coin={coin}
      style={style}
    />
  );
};
