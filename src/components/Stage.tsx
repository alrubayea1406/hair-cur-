import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring} from 'remotion';
import {Actor, type Beat} from '../character/Actor';
import type {Pose} from '../character/params';
import {sceneIndexAt, wordTime, type Episode, type Layout, type Orientation, type PropSpec, type Scene} from '../lib/episode';
import {FONT_UI} from '../lib/fonts';
import {Background, type ThemeName} from './Background';
import {Captions} from './Captions';
import {BigText, PropView, type PlacedProp} from './Visuals';

interface Zone {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  split?: boolean; // place props on both sides of a centred host
}
interface LayoutSpec {
  cx: number;
  bottom: number;
  w: number; // host width (height = 2w)
  zone: Zone;
  cap: {y: number; left: number; right: number};
}

const LANDSCAPE: Record<Layout, LayoutSpec> = {
  left: {cx: 420, bottom: 1190, w: 470, zone: {x0: 800, x1: 1840, y0: 90, y1: 880}, cap: {y: 985, left: 780, right: 1860}},
  right: {cx: 1500, bottom: 1190, w: 470, zone: {x0: 80, x1: 1120, y0: 90, y1: 880}, cap: {y: 985, left: 60, right: 1140}},
  center: {cx: 960, bottom: 1190, w: 480, zone: {x0: 80, x1: 1840, y0: 150, y1: 820, split: true}, cap: {y: 985, left: 360, right: 1560}},
  closeup: {cx: 1180, bottom: 1830, w: 900, zone: {x0: 70, x1: 660, y0: 110, y1: 900}, cap: {y: 985, left: 60, right: 700}},
  full: {cx: 1760, bottom: 1135, w: 250, zone: {x0: 80, x1: 1580, y0: 80, y1: 900}, cap: {y: 985, left: 140, right: 1520}},
  small: {cx: 250, bottom: 1130, w: 300, zone: {x0: 470, x1: 1840, y0: 80, y1: 900}, cap: {y: 985, left: 480, right: 1840}},
};

const VERTICAL: Record<Layout, LayoutSpec> = {
  left: {cx: 540, bottom: 2250, w: 700, zone: {x0: 70, x1: 1010, y0: 250, y1: 690}, cap: {y: 790, left: 50, right: 1030}},
  right: {cx: 540, bottom: 2250, w: 700, zone: {x0: 70, x1: 1010, y0: 250, y1: 690}, cap: {y: 790, left: 50, right: 1030}},
  center: {cx: 540, bottom: 2250, w: 700, zone: {x0: 70, x1: 1010, y0: 250, y1: 690}, cap: {y: 790, left: 50, right: 1030}},
  closeup: {cx: 540, bottom: 2560, w: 1000, zone: {x0: 70, x1: 1010, y0: 140, y1: 460}, cap: {y: 575, left: 50, right: 1030}},
  full: {cx: 540, bottom: 2420, w: 560, zone: {x0: 70, x1: 1010, y0: 150, y1: 1080}, cap: {y: 1200, left: 50, right: 1030}},
  small: {cx: 540, bottom: 2420, w: 560, zone: {x0: 70, x1: 1010, y0: 150, y1: 1080}, cap: {y: 1200, left: 50, right: 1030}},
};

// In vertical videos the visuals sit above the host, so sideways gestures become upward ones.
const VERTICAL_POSE: Partial<Record<Pose, Pose>> = {point: 'pointUp', pointLeft: 'pointUp', present: 'explain', presentLeft: 'explain'};

export const resolveScenes = (ep: Episode) => {
  let layout: Layout = 'left';
  let theme: ThemeName = ep.theme;
  return ep.scenes.map((s) => {
    layout = s.layout ?? layout;
    theme = s.theme ?? theme;
    return {...s, layout, theme};
  });
};

const placeProps = (props: PropSpec[], zone: Zone, hasBigText: boolean, vertical: boolean): PlacedProp[] => {
  const z = {...zone, y0: hasBigText ? zone.y0 + (vertical ? 170 : 200) : zone.y0};
  const n = props.length;
  if (zone.split && !vertical) {
    // two columns either side of a centred host
    const cols = [
      {x: 360, y0: z.y0, y1: z.y1},
      {x: 1560, y0: z.y0, y1: z.y1},
    ];
    return props.map((p, i) => {
      const col = cols[i % 2];
      const rows = Math.ceil(n / 2);
      const row = Math.floor(i / 2);
      const h = (col.y1 - col.y0) / rows;
      const size = p.size ?? Math.min(360, h * 0.78);
      return {...p, x: p.x ?? col.x, y: p.y ?? col.y0 + h * (row + 0.5), size};
    });
  }
  const w = z.x1 - z.x0;
  const h = z.y1 - z.y0;
  const horizontal = w >= h * 0.9;
  return props.map((p, i) => {
    const slot = (i + 0.5) / n;
    const wide = p.type === 'chart' ? 1.5 : p.type === 'stat' ? 1.25 : 1;
    const size = p.size ?? Math.min(vertical ? 380 : 420, ((horizontal ? w / n : h / n) * 0.8) / wide, (horizontal ? h : w) * 0.82);
    const x = vertical ? (p.x !== undefined ? z.x0 + (p.x / 1920) * w : undefined) : p.x;
    const y = vertical ? undefined : p.y;
    return {
      ...p,
      size,
      x: x ?? (horizontal ? z.x0 + slot * w : (z.x0 + z.x1) / 2),
      y: y ?? (horizontal ? (z.y0 + z.y1) / 2 : z.y0 + slot * h),
    };
  });
};

export const buildBeats = (scenes: Scene[], fps: number, vertical: boolean): Beat[] => {
  const mapPose = (p?: Pose) => (p && vertical ? VERTICAL_POSE[p] ?? p : p);
  const mapLook = (l?: {x: number; y: number}) => (l && vertical ? {x: l.x * 0.4, y: Math.min(l.y, 0) - 0.25} : l);
  const out: Beat[] = [];
  scenes.forEach((s) => {
    out.push({at: Math.round(s.start * fps), expression: s.expression, pose: mapPose(s.pose), look: mapLook(s.look), tilt: s.tilt, hop: s.hop, coin: s.coin});
    (s.beats ?? []).forEach((b) => out.push({...b, pose: mapPose(b.pose), look: mapLook(b.look), at: Math.round(wordTime(s, b.word) * fps)}));
  });
  return out;
};

export interface SfxEvent {
  t: number; // episode seconds
  file: string;
  volume: number;
}

export const buildSfx = (ep: Episode): SfxEvent[] => {
  const scenes = resolveScenes(ep);
  const out: SfxEvent[] = [];
  scenes.forEach((s) => {
    (s.props ?? []).forEach((p, j) => out.push({t: wordTime(s, p.word) + (p.word === undefined ? j * 0.17 : 0) + 0.07, file: 'sfx/pop.wav', volume: 0.3}));
    if (s.bigText) out.push({t: wordTime(s, s.bigTextWord), file: 'sfx/whoosh.wav', volume: 0.28});
    if (s.hop) out.push({t: s.start + 0.13, file: 'sfx/boing.wav', volume: 0.18});
    if (s.coin) out.push({t: s.start + 0.05, file: 'sfx/coin.wav', volume: 0.45});
    (s.beats ?? []).forEach((b) => {
      if (b.coin) out.push({t: wordTime(s, b.word) + 0.05, file: 'sfx/coin.wav', volume: 0.45});
      if (b.hop) out.push({t: wordTime(s, b.word) + 0.13, file: 'sfx/boing.wav', volume: 0.18});
    });
    if (s.subscribe) out.push({t: s.start + 0.27 + 2.5, file: 'sfx/click.wav', volume: 0.55});
  });
  return out;
};

const SubscribeButton: React.FC<{frame: number; fps: number; appear: number; cx: number; y: number; scale: number; bell?: string}> = ({
  frame,
  fps,
  appear,
  cx,
  y,
  scale,
  bell,
}) => {
  if (frame < appear) return null;
  const k = spring({frame: frame - appear, fps, config: {damping: 10, stiffness: 150, mass: 0.7}});
  const press = frame - appear - Math.round(2.5 * fps);
  const pressed = press >= 0;
  const pressScale = pressed ? 1 - 0.12 * Math.exp(-press / 4) * Math.sin(Math.min(Math.PI, press / 2)) : 1;
  const bellRot = Math.sin(frame / 2.2) * 18 * (pressed ? Math.exp(-press / 25) : 0.3);
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - 500,
        width: 1000,
        top: y,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24 * scale,
        transform: `translateY(-50%) scale(${k * pressScale * scale})`,
      }}
    >
      <div
        style={{
          background: pressed ? '#3B3B4F' : '#FF1F3D',
          borderRadius: 999,
          padding: '18px 56px',
          fontFamily: FONT_UI,
          fontWeight: 900,
          fontSize: 74,
          color: '#fff',
          border: '8px solid #0B1530',
          boxShadow: '0 12px 0 rgba(0,0,0,0.3)',
          textTransform: 'uppercase',
        }}
      >
        {pressed ? 'Subscribed ✓' : 'Subscribe'}
      </div>
      {bell ? <div style={{width: 130, height: 130, transform: `rotate(${bellRot}deg)`, transformOrigin: '50% 10%'}} dangerouslySetInnerHTML={{__html: bell}} /> : null}
    </div>
  );
};

export const Stage: React.FC<{ep: Episode; frame: number; orientation: Orientation; captions: boolean; hideBigTextUntil?: number}> = ({
  ep,
  frame,
  orientation,
  captions,
  hideBigTextUntil = -1,
}) => {
  const fps = ep.fps;
  const vertical = orientation === 'vertical';
  const table = vertical ? VERTICAL : LANDSCAPE;
  const scenes = useMemo(() => resolveScenes(ep), [ep]);
  const beats = useMemo(() => buildBeats(scenes, fps, vertical), [scenes, fps, vertical]);
  const t = frame / fps;
  const si = sceneIndexAt(scenes, t);
  const scene = scenes[si];
  const prev = scenes[Math.max(0, si - 1)];
  const sceneFrame = Math.round(scene.start * fps);

  const lk = spring({frame: frame - sceneFrame, fps, config: {damping: 16, stiffness: 110, mass: 0.9}});
  const A = table[prev.layout];
  const B = table[scene.layout];
  const mix = (a: number, b: number) => (si === 0 ? b : interpolate(lk, [0, 1], [a, b]));
  const host = {cx: mix(A.cx, B.cx), bottom: mix(A.bottom, B.bottom), w: mix(A.w, B.w)};
  const cap = {y: mix(A.cap.y, B.cap.y), left: mix(A.cap.left, B.cap.left), right: mix(A.cap.right, B.cap.right)};

  const sceneProg = interpolate(t, [scene.start, scene.end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const zoom = mix(prev.zoom ?? 1, scene.zoom ?? 1) * (1 + 0.02 * sceneProg);
  const themeMix = si > 0 && prev.theme !== scene.theme ? interpolate(frame - sceneFrame, [0, 14], [0, 1], {extrapolateRight: 'clamp'}) : 1;

  // only scenes near "now" can have visible props
  const visuals: React.ReactNode[] = [];
  const overlays: React.ReactNode[] = [];
  scenes.forEach((s, i) => {
    if (s.end < t - 1 || s.start > t + 0.1) return;
    const spec = table[s.layout];
    const exit = Math.round(s.end * fps) - 3;
    placeProps(s.props ?? [], spec.zone, Boolean(s.bigText), vertical).forEach((p, j) => {
      const appear = Math.round((wordTime(s, p.word) + (p.word === undefined ? j * 0.17 : 0)) * fps) + 2;
      visuals.push(<PropView key={`p${i}-${j}`} p={p} svg={p.icon ? ep.icons[p.icon] : undefined} frame={frame} fps={fps} appear={appear} exit={exit} index={j} />);
    });
    if (s.bigText) {
      const z = spec.zone;
      const appear = Math.max(Math.round(wordTime(s, s.bigTextWord) * fps), hideBigTextUntil);
      const y = z.split && !vertical ? 125 : s.props?.length ? z.y0 + (vertical ? 85 : 100) : (z.y0 + z.y1) / 2;
      overlays.push(
        <BigText key={`b${i}`} text={s.bigText} cx={(z.x0 + z.x1) / 2} y={y} maxWidth={z.x1 - z.x0} frame={frame} fps={fps} appear={appear} exit={exit} scale={vertical ? 0.95 : 1} />,
      );
    }
  });

  const zoneB = B.zone;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: vertical ? '540px 1000px' : '960px 560px'}}>
        {themeMix < 1 ? <Background theme={prev.theme} seed={ep.id} t={t} /> : null}
        <AbsoluteFill style={{opacity: themeMix}}>
          <Background theme={scene.theme} seed={ep.id} t={t} />
        </AbsoluteFill>
        {visuals}
        <div style={{position: 'absolute', left: host.cx - host.w / 2, top: host.bottom - host.w * 2, width: host.w, height: host.w * 2}}>
          <Actor beats={beats} frame={frame} fps={fps} envelope={ep.envelope} seed={ep.id} style={{width: '100%', height: '100%'}} />
        </div>
        {overlays}
        {scene.subscribe ? (
          <SubscribeButton
            frame={frame}
            fps={fps}
            appear={sceneFrame + 8}
            cx={(zoneB.x0 + zoneB.x1) / 2}
            y={vertical ? 420 : (zoneB.y0 + zoneB.y1) / 2}
            scale={vertical ? 1 : 1.1}
            bell={ep.icons.bell}
          />
        ) : null}
      </AbsoluteFill>
      {captions ? (
        <Captions
          words={scene.words}
          frame={frame}
          fps={fps}
          y={cap.y}
          left={cap.left}
          right={cap.right}
          sceneEnd={scene.end}
          fontSize={vertical ? 80 : 58}
          maxWords={vertical ? 3 : 6}
          maxChars={vertical ? 18 : 34}
        />
      ) : null}
    </AbsoluteFill>
  );
};
