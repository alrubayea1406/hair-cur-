import {staticFile, type CalculateMetadataFunction} from 'remotion';
import type {Expression, Pose, Vec} from '../character/params';
import type {ThemeName} from '../components/Background';

export type Layout = 'left' | 'right' | 'center' | 'closeup' | 'full' | 'small';
export type Orientation = 'landscape' | 'vertical';

export interface PropSpec {
  type?: 'icon' | 'stat' | 'year' | 'chart';
  icon?: string; // Fluent Emoji Flat name (type icon)
  value?: string; // stat / year text
  label?: string;
  points?: number[]; // chart values (drawn left -> right)
  color?: string;
  x?: number; // px center, landscape canvas (1920x1080); auto-placed if missing
  y?: number;
  size?: number;
  word?: number; // appear when this word of the scene is spoken
  anim?: 'pop' | 'drop' | 'slide' | 'spin' | 'grow';
  loop?: 'float' | 'pulse' | 'shake' | 'spin' | 'none';
  rotate?: number;
}

export interface SceneBeat {
  word: number;
  expression?: Expression;
  pose?: Pose;
  look?: Vec;
  tilt?: number;
  hop?: boolean;
  coin?: boolean;
}

export interface Word {
  text: string;
  start: number;
  end: number;
}

export interface Scene {
  say: string;
  chapter?: string; // starts a YouTube chapter
  expression?: Expression;
  pose?: Pose;
  look?: Vec;
  tilt?: number;
  hop?: boolean;
  coin?: boolean;
  layout?: Layout;
  theme?: ThemeName;
  props?: PropSpec[];
  bigText?: string;
  bigTextWord?: number;
  beats?: SceneBeat[];
  zoom?: number;
  subscribe?: boolean;
  // filled in by scripts/voice.mjs
  start: number;
  end: number;
  words: Word[];
}

export interface ShortSpec {
  id: string;
  hook: string; // big text over the first seconds
  scenes: number[]; // scene indices (in order) to cut together
  youtube?: {title: string; description: string; tags?: string[]};
}

export interface Episode {
  id: string;
  fps: number;
  theme: ThemeName;
  title?: string;
  durationInFrames: number;
  captions?: {landscape?: boolean; vertical?: boolean};
  voice: {file: string; offset: number; duration: number};
  music: {file: string; volume: number} | null;
  envelope: number[];
  scenes: Scene[];
  shorts?: ShortSpec[];
  icons: Record<string, string>;
  thumbnail?: {text?: string; expression?: Expression; pose?: Pose; icons?: string[]; theme?: ThemeName};
}

export interface EpisodeProps extends Record<string, unknown> {
  episodeId: string;
  episode?: Episode;
  short?: number; // index into episode.shorts (ShortClip only)
}

export const loadEpisode = async (props: EpisodeProps): Promise<Episode> =>
  props.episode ?? (await fetch(staticFile(`episodes/${props.episodeId}/episode.json`)).then((r) => r.json()));

export const calculateLongMetadata: CalculateMetadataFunction<EpisodeProps> = async ({props}) => {
  const episode = await loadEpisode(props);
  return {durationInFrames: episode.durationInFrames, fps: episode.fps, props: {...props, episode}};
};

export const HOOK_FRAMES = 0; // hook text overlays the first scene (no extra time)
export const OUTRO_FRAMES = 60; // "full story on the channel" card at the end of a Short

export interface Segment {
  scene: number;
  from: number; // frame in the clip
  dur: number; // frames
  t0: number; // episode seconds at segment start
}

export const shortSegments = (ep: Episode, shortIndex: number): Segment[] => {
  const spec = ep.shorts?.[shortIndex];
  if (!spec) return [];
  let from = HOOK_FRAMES;
  return spec.scenes.map((si) => {
    const s = ep.scenes[si];
    const end = si === ep.scenes.length - 1 ? s.end : Math.min(s.end, (s.words.at(-1)?.end ?? s.end) + 0.45);
    const dur = Math.max(1, Math.round((end - s.start) * ep.fps));
    const seg = {scene: si, from, dur, t0: s.start};
    from += dur;
    return seg;
  });
};

export const calculateShortMetadata: CalculateMetadataFunction<EpisodeProps> = async ({props}) => {
  const episode = await loadEpisode(props);
  const segs = shortSegments(episode, props.short ?? 0);
  const last = segs.at(-1);
  const durationInFrames = (last ? last.from + last.dur : 30) + OUTRO_FRAMES;
  return {durationInFrames, fps: episode.fps, props: {...props, episode}};
};

export const sceneIndexAt = (scenes: Scene[], t: number) => {
  let idx = 0;
  for (let i = 0; i < scenes.length; i++) if (scenes[i].start <= t) idx = i;
  return idx;
};

export const wordTime = (s: Scene, word: number | undefined) =>
  word === undefined ? s.start : s.words[Math.min(word, s.words.length - 1)]?.start ?? s.start;
