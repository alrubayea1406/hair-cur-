import React from 'react';
import {random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Leesho} from './Leesho';
import {
  FACES,
  POSES,
  blendFace,
  blendPose,
  lerp,
  type Antenna,
  type Expression,
  type Pose,
  type Vec,
} from './params';

// A "beat" changes one or more things about Leesho at a given frame.
// Anything not mentioned keeps its previous value; changes are blended with springs.
export interface Beat {
  at: number;
  expression?: Expression;
  pose?: Pose;
  antenna?: Antenna;
  look?: Vec;
  hop?: boolean;
}

interface Key<T> {
  at: number;
  value: T;
}

type SpringCfg = {damping: number; stiffness: number; mass: number};
const FACE_SPRING: SpringCfg = {damping: 18, stiffness: 190, mass: 0.7};
const POSE_SPRING: SpringCfg = {damping: 11, stiffness: 120, mass: 0.8};
const ANTENNA_SPRING: SpringCfg = {damping: 8, stiffness: 150, mass: 0.6};
const LOOK_SPRING: SpringCfg = {damping: 20, stiffness: 210, mass: 0.6};
const SETTLE = 75; // frames after which a spring is considered finished

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

// Continuous even when a new change starts before the previous one finished.
const sample = <T,>(
  keys: Key<T>[],
  f: number,
  fps: number,
  cfg: SpringCfg,
  mix: (a: T, b: T, t: number) => T,
): T => {
  let idx = 0;
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].at <= f) idx = i;
    else break;
  }
  if (idx === 0) return keys[0].value;
  const since = f - keys[idx].at;
  if (since > SETTLE) return keys[idx].value;
  const from = sample(keys.slice(0, idx), keys[idx].at, fps, cfg, mix);
  const t = spring({frame: since, fps, config: cfg});
  return mix(from, keys[idx].value, t);
};

export const blinkAt = (f: number, seed: string): number => {
  let start = 12 + Math.floor(random(`${seed}-b0`) * 40);
  let i = 0;
  while (start + 8 <= f) {
    i++;
    start += 66 + Math.floor(random(`${seed}-b${i}`) * 84);
  }
  const k = f - start;
  const curve = [0.35, 0.8, 1, 1, 0.75, 0.45, 0.2, 0.05];
  return k >= 0 && k < curve.length ? curve[k] : 0;
};

const hopAt = (k: number) => {
  if (k < 0 || k > 27) return {jump: 0, squash: 0};
  if (k < 4) return {jump: 0, squash: 0.11 * (k / 4)};
  if (k < 18) {
    const p = (k - 4) / 14;
    return {jump: Math.sin(p * Math.PI) * 78, squash: -0.09 * Math.sin(p * Math.PI)};
  }
  const q = (k - 18) / 9;
  return {jump: 0, squash: 0.13 * (1 - q)};
};

export interface LeeshoActorProps {
  beats: Beat[];
  envelope?: number[]; // loudness per frame (0..1) for lip-sync
  envelopeOffset?: number; // frame of envelope[0] relative to this actor
  seed?: string;
  style?: React.CSSProperties;
}

export const LeeshoActor: React.FC<LeeshoActorProps> = ({beats, envelope, envelopeOffset = 0, seed = 'leesho', style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const faceKeys = keysOf(beats, (b) => (b.expression ? FACES[b.expression] : undefined), FACES.happy);
  const poseKeys = keysOf(beats, (b) => (b.pose ? POSES[b.pose] : undefined), POSES.idle);
  const antKeys = keysOf(beats, (b) => (b.antenna ? (b.antenna === 'idea' ? 1 : 0) : undefined), 0);
  const lookKeys = keysOf(beats, (b) => b.look, {x: 0, y: 0});

  const face = sample(faceKeys, frame, fps, FACE_SPRING, blendFace);
  const pose = sample(poseKeys, frame, fps, POSE_SPRING, blendPose);
  const antenna = sample(antKeys, frame, fps, ANTENNA_SPRING, lerp);
  const lookBase = sample(lookKeys, frame, fps, LOOK_SPRING, (a, b, k) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)}));
  const look = {x: lookBase.x + Math.sin(t * 0.9) * 0.07, y: lookBase.y + Math.cos(t * 0.7) * 0.05};

  // lip-sync: lightly smoothed loudness
  const env = (i: number) => (envelope ? envelope[i - envelopeOffset] ?? 0 : 0);
  const talk = Math.min(1, env(frame - 1) * 0.25 + env(frame) * 0.5 + env(frame + 1) * 0.25);

  let jump = 0;
  let squash = Math.sin(t * Math.PI * 2 * 0.33) * 0.012 + talk * 0.015;
  let swing = Math.sin(t * Math.PI * 2 * 0.45) * 3;
  const swingEvents: number[] = [];
  beats.forEach((b) => {
    if (b.hop) {
      const h = hopAt(frame - b.at);
      jump += h.jump;
      squash += h.squash;
      swingEvents.push(b.at + 4);
    }
    if (b.antenna) swingEvents.push(b.at);
  });
  swingEvents.forEach((at) => {
    const dt = (frame - at) / fps;
    if (dt >= 0 && dt < 3) swing += 15 * Math.exp(-3.2 * dt) * Math.sin(13 * dt);
  });
  const lean = Math.sin(t * Math.PI * 2 * 0.21) * 1.3 + talk * 1.6 * Math.sin(t * 7.3);
  const glow = antenna > 0.5 ? Math.min(1, (antenna - 0.5) * 2) * (0.85 + 0.15 * Math.sin(t * 6)) : 0;

  return (
    <Leesho
      face={face}
      pose={pose}
      t={t}
      talk={talk}
      blink={blinkAt(frame, seed)}
      look={look}
      antenna={antenna}
      glow={glow}
      jump={jump}
      squash={squash}
      lean={lean}
      antennaSwing={swing}
      style={style}
    />
  );
};
