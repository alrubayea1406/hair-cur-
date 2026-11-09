import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Actor} from '../character/Actor';
import {Background} from '../components/Background';
import {Outlined} from '../components/Outlined';
import {Stage, buildSfx, resolveScenes} from '../components/Stage';
import {shortSegments, type Episode, type EpisodeProps} from '../lib/episode';
import {FONT_DISPLAY, FONT_UI} from '../lib/fonts';

const HOOK_SECONDS = 2.4;

// A vertical Short / Reel (1080x1920) cut from scenes of the long episode.
export const ShortClip: React.FC<EpisodeProps> = ({episode, short = 0}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const ep = episode as Episode;
  const fps = ep.fps;
  const spec = ep.shorts?.[short];
  const segs = useMemo(() => shortSegments(ep, short), [ep, short]);
  const sfx = useMemo(() => buildSfx(ep), [ep]);
  const scenes = useMemo(() => resolveScenes(ep), [ep]);
  const last = segs[segs.length - 1];
  const clipEnd = last.from + last.dur;
  const inOutro = frame >= clipEnd;
  const seg = segs.find((s) => frame >= s.from && frame < s.from + s.dur) ?? last;
  const epFrame = Math.round(seg.t0 * fps) + (frame - seg.from);
  const hookEnd = Math.round(HOOK_SECONDS * fps);

  const music = ep.music;
  const musicVol = (f: number) =>
    (music?.volume ?? 0) * 1.15 * interpolate(f, [0, 10, durationInFrames - 20, durationInFrames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const hookK = spring({frame, fps, config: {damping: 10, stiffness: 160, mass: 0.7}});
  const hookOut = interpolate(frame, [hookEnd - 8, hookEnd], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const outroF = frame - clipEnd;
  const outroK = spring({frame: outroF, fps, config: {damping: 11, stiffness: 140, mass: 0.7}});

  return (
    <AbsoluteFill style={{background: '#000'}}>
      {!inOutro ? (
        <Stage ep={ep} frame={epFrame} orientation="vertical" captions={ep.captions?.vertical ?? true} hideBigTextUntil={Math.round(segs[0].t0 * fps) + hookEnd} />
      ) : (
        <AbsoluteFill>
          <Background theme={scenes[last.scene].theme} seed={`${ep.id}-outro`} t={frame / fps} />
          <div style={{position: 'absolute', left: 190, top: 820, width: 700, height: 1400}}>
            <Actor beats={[{at: clipEnd - 1, expression: 'happy', pose: 'pointUp', look: {x: 0, y: -0.6}}]} frame={frame} fps={fps} seed={`${ep.id}-o`} style={{width: '100%', height: '100%'}} />
          </div>
          <div style={{position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center', transform: `scale(${outroK})`, fontFamily: FONT_DISPLAY, fontSize: 120, lineHeight: 1.05}}>
            <Outlined color="#F6C445" stroke="#0B1530" strokeWidth={16}>
              FULL STORY
            </Outlined>
            <div style={{fontFamily: FONT_UI, fontWeight: 900, fontSize: 64, marginTop: 20, textTransform: 'uppercase'}}>
              <Outlined color="#fff" stroke="#0B1530" strokeWidth={11}>
                on the channel ▲
              </Outlined>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {spec && frame < hookEnd ? (
        <div
          style={{
            position: 'absolute',
            left: 50,
            right: 50,
            top: 130,
            textAlign: 'center',
            transform: `translateY(-50%) scale(${hookK * hookOut}) rotate(-2deg)`,
            fontFamily: FONT_DISPLAY,
            fontSize: spec.hook.length > 22 ? 92 : 112,
            lineHeight: 1.05,
            textTransform: 'uppercase',
          }}
        >
          <Outlined color="#F6C445" stroke="#0B1530" strokeWidth={18}>
            {spec.hook}
          </Outlined>
        </div>
      ) : null}

      {segs.map((s, i) => {
        const delay = Math.max(0, Math.round((ep.voice.offset - s.t0) * fps));
        const trim = Math.max(0, Math.round((s.t0 - ep.voice.offset) * fps));
        const events = sfx.filter((e) => e.t >= s.t0 && e.t < s.t0 + s.dur / fps);
        const cut = i > 0 && segs[i - 1].scene !== s.scene - 1;
        return (
          <React.Fragment key={i}>
            <Sequence from={s.from + delay} durationInFrames={Math.max(1, s.dur - delay)} layout="none">
              <Audio src={staticFile(ep.voice.file)} trimBefore={trim} />
            </Sequence>
            {cut ? (
              <Sequence from={s.from} durationInFrames={Math.round(0.8 * fps)} layout="none">
                <Audio src={staticFile('sfx/whoosh.wav')} volume={0.25} />
              </Sequence>
            ) : null}
            {events.map((e, j) => (
              <Sequence key={j} from={s.from + Math.round((e.t - s.t0) * fps)} durationInFrames={Math.round(1.6 * fps)} layout="none">
                <Audio src={staticFile(e.file)} volume={e.volume} />
              </Sequence>
            ))}
          </React.Fragment>
        );
      })}
      <Sequence from={clipEnd} layout="none">
        <Audio src={staticFile('sfx/whoosh.wav')} volume={0.3} />
      </Sequence>
      {music ? <Audio src={staticFile(music.file)} loop volume={musicVol} /> : null}
    </AbsoluteFill>
  );
};
