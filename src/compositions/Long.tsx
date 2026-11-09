import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Stage, buildSfx} from '../components/Stage';
import type {Episode, EpisodeProps} from '../lib/episode';

// The main horizontal YouTube video (1920x1080).
export const Long: React.FC<EpisodeProps> = ({episode}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const ep = episode as Episode;
  const fps = ep.fps;
  const sfx = useMemo(() => buildSfx(ep), [ep]);
  const music = ep.music;
  const musicVol = (f: number) =>
    (music?.volume ?? 0) * interpolate(f, [0, 30, durationInFrames - 45, durationInFrames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Stage ep={ep} frame={frame} orientation="landscape" captions={ep.captions?.landscape ?? false} />
      <Sequence from={Math.round(ep.voice.offset * fps)} layout="none">
        <Audio src={staticFile(ep.voice.file)} />
      </Sequence>
      {music ? <Audio src={staticFile(music.file)} loop volume={musicVol} /> : null}
      {sfx.map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.t * fps))} durationInFrames={Math.round(1.6 * fps)} layout="none">
          <Audio src={staticFile(s.file)} volume={s.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
