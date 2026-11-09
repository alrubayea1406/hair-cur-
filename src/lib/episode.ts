import {staticFile, type CalculateMetadataFunction} from 'remotion';
import type {Antenna, Expression, Pose, Vec} from '../character/params';
import type {ThemeName} from '../components/Background';

export type Layout = 'center' | 'left' | 'right' | 'closeup' | 'small';

export interface PropSpec {
  icon: string; // Fluent Emoji Flat name, e.g. "octopus"
  x?: number; // px center (1080 wide canvas); auto-placed if missing
  y?: number;
  size?: number;
  word?: number; // appear when this word (index in the scene) is spoken
  anim?: 'pop' | 'drop' | 'slide' | 'spin' | 'grow';
  loop?: 'float' | 'pulse' | 'shake' | 'spin' | 'none';
  label?: string;
  rotate?: number;
}

export interface SceneBeat {
  word: number;
  expression?: Expression;
  pose?: Pose;
  antenna?: Antenna;
  look?: Vec;
  hop?: boolean;
}

export interface Word {
  text: string;
  start: number;
  end: number;
}

export interface Scene {
  say: string;
  expression?: Expression;
  pose?: Pose;
  antenna?: Antenna;
  look?: Vec;
  hop?: boolean;
  layout?: Layout;
  props?: PropSpec[];
  bigText?: string;
  bigTextWord?: number;
  theme?: ThemeName;
  beats?: SceneBeat[];
  zoom?: number;
  subscribe?: boolean; // show the subscribe button during this scene
  // filled in by scripts/voice.mjs
  start: number;
  end: number;
  words: Word[];
}

export interface Episode {
  id: string;
  fps: number;
  format: 'short' | 'long';
  theme: ThemeName;
  title?: string;
  durationInFrames: number;
  voice: {file: string; offset: number; duration: number};
  music: {file: string; volume: number} | null;
  envelope: number[];
  scenes: Scene[];
  icons: Record<string, string>;
}

export interface EpisodeProps extends Record<string, unknown> {
  episodeId: string;
  episode?: Episode;
}

export const calculateEpisodeMetadata: CalculateMetadataFunction<EpisodeProps> = async ({props}) => {
  const episode: Episode =
    props.episode ?? (await fetch(staticFile(`episodes/${props.episodeId}/episode.json`)).then((r) => r.json()));
  return {
    durationInFrames: episode.durationInFrames,
    fps: episode.fps,
    props: {...props, episode},
  };
};

export const sceneIndexAt = (scenes: Scene[], t: number) => {
  let idx = 0;
  for (let i = 0; i < scenes.length; i++) if (scenes[i].start <= t) idx = i;
  return idx;
};
