import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background, type ThemeName} from '../components/Background';
import {Captions} from '../components/Captions';
import {Outlined} from '../components/Outlined';
import {LeeshoActor, type Beat} from '../character/LeeshoActor';
import {sceneIndexAt, type Episode, type EpisodeProps, type Layout, type PropSpec, type Scene} from '../lib/episode';
import {FONT_DISPLAY, FONT_UI} from '../lib/fonts';

const CHAR_ASPECT = 570 / 400;

interface LayoutSpec {
  cx: number;
  bottom: number;
  w: number;
  captionY: number;
  zone: {x0: number; x1: number; y0: number; y1: number};
}

const LAYOUTS: Record<Layout, LayoutSpec> = {
  center: {cx: 540, bottom: 1700, w: 540, captionY: 850, zone: {x0: 80, x1: 1000, y0: 170, y1: 720}},
  small: {cx: 540, bottom: 1700, w: 400, captionY: 960, zone: {x0: 90, x1: 990, y0: 190, y1: 820}},
  left: {cx: 300, bottom: 1720, w: 470, captionY: 300, zone: {x0: 560, x1: 990, y0: 470, y1: 1250}},
  right: {cx: 750, bottom: 1720, w: 470, captionY: 300, zone: {x0: 90, x1: 520, y0: 470, y1: 1250}},
  closeup: {cx: 540, bottom: 1780, w: 1250, captionY: 560, zone: {x0: 90, x1: 990, y0: 120, y1: 300}},
};

const f = (sec: number, fps: number) => Math.round(sec * fps);

// Resolve inherited values (layout/theme) so each scene knows its own.
const resolveScenes = (ep: Episode) => {
  let layout: Layout = 'center';
  let theme: ThemeName = ep.theme;
  return ep.scenes.map((s) => {
    layout = s.layout ?? layout;
    theme = s.theme ?? theme;
    return {...s, layout, theme};
  });
};

const wordTime = (s: Scene, word: number | undefined) =>
  word === undefined ? s.start : s.words[Math.min(word, s.words.length - 1)]?.start ?? s.start;

const placeProps = (props: PropSpec[], zone: LayoutSpec['zone'], hasBigText: boolean) => {
  const z = {...zone, y0: hasBigText ? zone.y0 + 190 : zone.y0};
  const w = z.x1 - z.x0;
  const h = z.y1 - z.y0;
  const n = props.length;
  const horizontal = w >= h;
  return props.map((p, i) => {
    const slot = (i + 0.5) / n;
    const size = p.size ?? Math.min(440, (horizontal ? w / n : h / n) * (horizontal ? 0.84 : 0.95), (horizontal ? h : w) * 0.92);
    // RTL reading order: first prop on the right
    const x = p.x ?? (horizontal ? z.x1 - slot * w : (z.x0 + z.x1) / 2);
    const y = p.y ?? (horizontal ? (z.y0 + z.y1) / 2 + (n === 3 && i === 1 ? -40 : 0) : z.y0 + slot * h);
    return {...p, x, y, size};
  });
};

const PropView: React.FC<{p: Required<Pick<PropSpec, 'x' | 'y' | 'size'>> & PropSpec; svg: string; appear: number; exit: number; index: number}> = ({
  p,
  svg,
  appear,
  exit,
  index,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (frame < appear || frame > exit + 10) return null;
  const k = spring({frame: frame - appear, fps, config: {damping: 10, stiffness: 160, mass: 0.7}});
  const e = interpolate(frame, [exit, exit + 9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  let tx = 0;
  let ty = 0;
  let sc = 1;
  let rot = p.rotate ?? 0;
  switch (p.anim ?? 'pop') {
    case 'drop':
      ty = (1 - k) * -600;
      break;
    case 'slide':
      tx = (1 - k) * (p.x < 540 ? -800 : 800);
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
      rot += (1 - k) * -28;
  }
  switch (p.loop ?? 'float') {
    case 'float':
      ty += Math.sin(t * 2.2 + index * 1.7) * 12;
      rot += Math.sin(t * 1.6 + index) * 4;
      break;
    case 'pulse':
      sc *= 1 + Math.sin(t * 6.5) * 0.06;
      break;
    case 'shake':
      rot += Math.sin(t * 28) * 7;
      break;
    case 'spin':
      rot += t * 70;
      break;
    default:
      break;
  }
  sc *= 1 - e;
  return (
    <div
      style={{
        position: 'absolute',
        left: p.x - p.size / 2,
        top: p.y - p.size / 2,
        width: p.size,
        height: p.size,
        transform: `translate(${tx}px, ${ty}px) scale(${sc})`,
        filter: 'drop-shadow(0 16px 0 rgba(0,0,0,0.18))',
      }}
    >
      <div style={{width: '100%', height: '100%', transform: `rotate(${rot}deg)`}} dangerouslySetInnerHTML={{__html: svg}} />
      {p.label ? (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '-50%',
            right: '-50%',
            textAlign: 'center',
            fontFamily: FONT_UI,
            fontWeight: 800,
            fontSize: 54,
            lineHeight: 1.1,
            direction: 'rtl',
          }}
        >
          <Outlined color="#fff" strokeWidth={12}>
            {p.label}
          </Outlined>
        </div>
      ) : null}
    </div>
  );
};

const BigText: React.FC<{text: string; x: number; y: number; appear: number; exit: number}> = ({text, x, y, appear, exit}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < appear || frame > exit + 10) return null;
  const k = spring({frame: frame - appear, fps, config: {damping: 9, stiffness: 170, mass: 0.7}});
  const e = interpolate(frame, [exit, exit + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wobble = Math.sin((frame / fps) * 3) * 2;
  const size = text.length > 12 ? 118 : text.length > 7 ? 150 : 190;
  return (
    <div
      style={{
        position: 'absolute',
        left: 40,
        right: 40,
        top: y,
        textAlign: 'center',
        transform: `translate(${x - 540}px, -50%) scale(${k * (1 - e)}) rotate(${-4 + wobble}deg)`,
        fontFamily: FONT_DISPLAY,
        fontSize: size,
        lineHeight: 1.15,
        direction: 'rtl',
      }}
    >
      <Outlined color="#FFD23F" stroke="#2A1650" strokeWidth={22}>
        {text}
      </Outlined>
    </div>
  );
};

const PRESS_AT = 75; // frames after the button appears

const SubscribeButton: React.FC<{appear: number; bell?: string}> = ({appear, bell}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < appear) return null;
  const k = spring({frame: frame - appear, fps, config: {damping: 10, stiffness: 150, mass: 0.7}});
  const press = frame - appear - PRESS_AT;
  const pressed = press >= 0;
  const pressScale = pressed ? 1 - 0.12 * Math.exp(-press / 4) * Math.sin(Math.min(Math.PI, press / 2)) : 1;
  const bellRot = Math.sin(frame / 2.2) * 18 * (pressed ? Math.exp(-press / 25) : 0.3);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 470,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 26,
        transform: `scale(${k * pressScale})`,
        direction: 'rtl',
      }}
    >
      <div
        style={{
          background: pressed ? '#3B3B4F' : '#FF1F3D',
          borderRadius: 999,
          padding: '14px 64px 26px',
          fontFamily: FONT_UI,
          fontWeight: 800,
          fontSize: 92,
          color: '#fff',
          border: '8px solid #2A1650',
          boxShadow: '0 14px 0 rgba(0,0,0,0.3)',
        }}
      >
        {pressed ? 'مشترك ✓' : 'اشترك'}
      </div>
      {bell ? (
        <div style={{width: 150, height: 150, transform: `rotate(${bellRot}deg)`, transformOrigin: '50% 10%'}} dangerouslySetInnerHTML={{__html: bell}} />
      ) : null}
    </div>
  );
};

export const Short: React.FC<EpisodeProps> = ({episode}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const ep = episode as Episode;
  const scenes = useMemo(() => resolveScenes(ep), [ep]);
  const t = frame / fps;
  const si = sceneIndexAt(scenes, t);
  const scene = scenes[si];
  const prev = scenes[Math.max(0, si - 1)];

  // ----- character timeline -----
  const beats = useMemo(() => {
    const out: Beat[] = [];
    scenes.forEach((s) => {
      out.push({at: f(s.start, fps), expression: s.expression, pose: s.pose, antenna: s.antenna, look: s.look, hop: s.hop});
      (s.beats ?? []).forEach((b) => out.push({...b, at: f(wordTime(s, b.word), fps)}));
    });
    return out;
  }, [scenes, fps]);

  // ----- layout (spring between scenes) -----
  const lk = spring({frame: frame - f(scene.start, fps), fps, config: {damping: 15, stiffness: 120, mass: 0.8}});
  const A = LAYOUTS[prev.layout];
  const B = LAYOUTS[scene.layout];
  const L = si === 0 ? B : {
    cx: interpolate(lk, [0, 1], [A.cx, B.cx]),
    bottom: interpolate(lk, [0, 1], [A.bottom, B.bottom]),
    w: interpolate(lk, [0, 1], [A.w, B.w]),
    captionY: interpolate(lk, [0, 1], [A.captionY, B.captionY]),
  };
  const charH = L.w * CHAR_ASPECT;

  // ----- camera -----
  const sceneProg = interpolate(t, [scene.start, scene.end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const zoomPrev = prev.zoom ?? 1;
  const zoomCur = scene.zoom ?? 1;
  const zoom = (si === 0 ? zoomCur : interpolate(lk, [0, 1], [zoomPrev, zoomCur])) * (1 + 0.025 * sceneProg);

  // ----- background crossfade -----
  const themeMix = si > 0 && prev.theme !== scene.theme ? interpolate(frame - f(scene.start, fps), [0, 14], [0, 1], {extrapolateRight: 'clamp'}) : 1;

  // ----- props + big text for every scene (only visible ones render) -----
  const propEls: React.ReactNode[] = [];
  const sfx: {at: number; file: string; volume: number}[] = [];
  scenes.forEach((s, i) => {
    const exit = f(s.end, fps) - 3;
    const placed = placeProps(s.props ?? [], LAYOUTS[s.layout].zone, Boolean(s.bigText));
    placed.forEach((p, j) => {
      const appear = f(wordTime(s, p.word), fps) + (p.word === undefined ? j * 5 : 0) + 2;
      sfx.push({at: appear, file: 'sfx/pop.wav', volume: 0.35});
      propEls.push(
        <PropView key={`p${i}-${j}`} p={p as never} svg={ep.icons[p.icon] ?? ''} appear={appear} exit={exit} index={j} />,
      );
    });
    if (s.bigText) {
      const z = LAYOUTS[s.layout].zone;
      const appear = f(wordTime(s, s.bigTextWord), fps);
      const y = s.props?.length ? z.y0 + 95 : (z.y0 + z.y1) / 2;
      propEls.push(<BigText key={`b${i}`} text={s.bigText} x={(z.x0 + z.x1) / 2} y={y} appear={appear} exit={exit} />);
      sfx.push({at: appear, file: 'sfx/whoosh.wav', volume: 0.3});
    }
    if (s.hop) sfx.push({at: f(s.start, fps) + 4, file: 'sfx/boing.wav', volume: 0.25});
    if (s.antenna === 'idea' && scenes[i - 1]?.antenna !== 'idea') sfx.push({at: f(s.start, fps), file: 'sfx/ding.wav', volume: 0.4});
    (s.beats ?? []).forEach((b) => {
      if (b.antenna === 'idea') sfx.push({at: f(wordTime(s, b.word), fps), file: 'sfx/ding.wav', volume: 0.4});
      if (b.hop) sfx.push({at: f(wordTime(s, b.word), fps) + 4, file: 'sfx/boing.wav', volume: 0.25});
    });
    if (s.subscribe) sfx.push({at: f(s.start, fps) + 8 + PRESS_AT, file: 'sfx/click.wav', volume: 0.6});
  });

  const music = ep.music;
  const musicVol = (fr: number) =>
    (music?.volume ?? 0) *
    interpolate(fr, [0, 20, durationInFrames - 30, durationInFrames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '540px 1150px'}}>
        {themeMix < 1 ? <Background theme={prev.theme} seed={ep.id} /> : null}
        <AbsoluteFill style={{opacity: themeMix}}>
          <Background theme={scene.theme} seed={ep.id} />
        </AbsoluteFill>
        {propEls}
        <div
          style={{
            position: 'absolute',
            left: L.cx - L.w / 2,
            top: L.bottom - charH,
            width: L.w,
            height: charH,
          }}
        >
          <LeeshoActor beats={beats} envelope={ep.envelope} seed={ep.id} style={{width: '100%', height: '100%'}} />
        </div>
        {scene.subscribe ? <SubscribeButton appear={f(scene.start, fps) + 8} bell={ep.icons.bell} /> : null}
      </AbsoluteFill>

      <Captions words={scene.words} y={L.captionY} sceneEnd={scene.end} />

      <Sequence from={f(ep.voice.offset, fps)} layout="none">
        <Audio src={staticFile(ep.voice.file)} />
      </Sequence>
      {music ? <Audio src={staticFile(music.file)} loop volume={musicVol} /> : null}
      {sfx.map((s, i) => (
        <Sequence key={i} from={Math.max(0, s.at)} durationInFrames={Math.round(1.6 * fps)} layout="none">
          <Audio src={staticFile(s.file)} volume={s.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
