// Numeric rig parameters for the host. Every expression / pose is a set of numbers,
// so the animation controller can blend smoothly between any two of them.

export type Expression =
  | 'neutral'
  | 'happy'
  | 'excited'
  | 'surprised'
  | 'thinking'
  | 'sad'
  | 'wink'
  | 'determined'
  | 'laugh'
  | 'smug'
  | 'worried';

export type Pose =
  | 'idle'
  | 'explain'
  | 'explainBoth'
  | 'point'
  | 'pointLeft'
  | 'pointUp'
  | 'present'
  | 'presentLeft'
  | 'think'
  | 'shrug'
  | 'wave'
  | 'cheer'
  | 'facepalm'
  | 'hips'
  | 'coin';

export interface FaceParams {
  browLift: number; // px up
  browTilt: number; // deg, + = inner ends up (worried), - = inner ends down (angry)
  browAsym: number; // px extra lift on the viewer-left brow
  eyeOpen: number; // 1 = normal, <1 = lids lower, >1 = wide eyes
  pupil: number; // iris size multiplier
  mouthCurve: number; // -1 frown .. 1 smile
  mouthWidth: number; // px (scaled by the renderer)
  mouthOpen: number; // 0..1 base openness (speech adds on top)
  mouthRound: number; // 0..1 "O" shape
  cheek: number; // blush opacity
  happyEyes: number; // 0..1 crossfade to ^ ^ eyes
  wink: number; // 0..1 closes the viewer-right eye
}

export interface Vec {
  x: number;
  y: number;
}

export interface PoseParams {
  l: Vec; // viewer-left hand target
  r: Vec; // viewer-right hand target
  lWave: number;
  rWave: number;
}

export const FACES: Record<Expression, FaceParams> = {
  neutral: {browLift: 0, browTilt: 0, browAsym: 0, eyeOpen: 1, pupil: 1, mouthCurve: 0.3, mouthWidth: 54, mouthOpen: 0, mouthRound: 0, cheek: 0.25, happyEyes: 0, wink: 0},
  happy: {browLift: 5, browTilt: 2, browAsym: 0, eyeOpen: 1, pupil: 1, mouthCurve: 0.9, mouthWidth: 70, mouthOpen: 0.08, mouthRound: 0, cheek: 0.45, happyEyes: 0, wink: 0},
  excited: {browLift: 12, browTilt: 4, browAsym: 0, eyeOpen: 1.12, pupil: 1.05, mouthCurve: 1, mouthWidth: 82, mouthOpen: 0.45, mouthRound: 0, cheek: 0.6, happyEyes: 0, wink: 0},
  surprised: {browLift: 20, browTilt: 6, browAsym: 0, eyeOpen: 1.2, pupil: 0.8, mouthCurve: 0, mouthWidth: 40, mouthOpen: 0.65, mouthRound: 1, cheek: 0.3, happyEyes: 0, wink: 0},
  thinking: {browLift: 4, browTilt: -4, browAsym: 12, eyeOpen: 0.85, pupil: 1, mouthCurve: -0.1, mouthWidth: 40, mouthOpen: 0, mouthRound: 0.3, cheek: 0.2, happyEyes: 0, wink: 0},
  sad: {browLift: 4, browTilt: 16, browAsym: 0, eyeOpen: 0.88, pupil: 1.05, mouthCurve: -0.8, mouthWidth: 50, mouthOpen: 0, mouthRound: 0, cheek: 0.2, happyEyes: 0, wink: 0},
  worried: {browLift: 10, browTilt: 14, browAsym: 0, eyeOpen: 1.05, pupil: 0.9, mouthCurve: -0.5, mouthWidth: 48, mouthOpen: 0.15, mouthRound: 0.2, cheek: 0.2, happyEyes: 0, wink: 0},
  wink: {browLift: 6, browTilt: 2, browAsym: -4, eyeOpen: 1, pupil: 1, mouthCurve: 0.95, mouthWidth: 66, mouthOpen: 0.1, mouthRound: 0, cheek: 0.5, happyEyes: 0, wink: 1},
  determined: {browLift: -4, browTilt: -14, browAsym: 0, eyeOpen: 0.92, pupil: 1, mouthCurve: 0.4, mouthWidth: 60, mouthOpen: 0, mouthRound: 0, cheek: 0.3, happyEyes: 0, wink: 0},
  laugh: {browLift: 10, browTilt: 5, browAsym: 0, eyeOpen: 1, pupil: 1, mouthCurve: 1, mouthWidth: 86, mouthOpen: 0.65, mouthRound: 0, cheek: 0.7, happyEyes: 1, wink: 0},
  smug: {browLift: 3, browTilt: -6, browAsym: 10, eyeOpen: 0.75, pupil: 1, mouthCurve: 0.7, mouthWidth: 56, mouthOpen: 0, mouthRound: 0, cheek: 0.35, happyEyes: 0, wink: 0},
};

// Hand targets in the character's 400x800 viewBox. Shoulders are at (124,336) and (276,336).
export const POSES: Record<Pose, PoseParams> = {
  idle: {l: {x: 104, y: 522}, r: {x: 296, y: 522}, lWave: 0, rWave: 0},
  explain: {l: {x: 104, y: 522}, r: {x: 322, y: 414}, lWave: 0, rWave: 0.12},
  explainBoth: {l: {x: 80, y: 410}, r: {x: 320, y: 410}, lWave: 0.1, rWave: 0.1},
  point: {l: {x: 104, y: 522}, r: {x: 446, y: 326}, lWave: 0, rWave: 0},
  pointLeft: {l: {x: -46, y: 326}, r: {x: 296, y: 522}, lWave: 0, rWave: 0},
  pointUp: {l: {x: 104, y: 522}, r: {x: 318, y: 150}, lWave: 0, rWave: 0},
  present: {l: {x: 104, y: 522}, r: {x: 398, y: 300}, lWave: 0, rWave: 0},
  presentLeft: {l: {x: 2, y: 300}, r: {x: 296, y: 522}, lWave: 0, rWave: 0},
  think: {l: {x: 184, y: 296}, r: {x: 296, y: 522}, lWave: 0, rWave: 0},
  shrug: {l: {x: 46, y: 316}, r: {x: 354, y: 316}, lWave: 0, rWave: 0},
  wave: {l: {x: 104, y: 522}, r: {x: 340, y: 168}, lWave: 0, rWave: 1},
  cheer: {l: {x: 62, y: 166}, r: {x: 338, y: 166}, lWave: 0.3, rWave: 0.3},
  facepalm: {l: {x: 104, y: 522}, r: {x: 226, y: 196}, lWave: 0, rWave: 0},
  hips: {l: {x: 118, y: 468}, r: {x: 282, y: 468}, lWave: 0, rWave: 0},
  coin: {l: {x: 104, y: 522}, r: {x: 304, y: 396}, lWave: 0, rWave: 0},
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const blendFace = (a: FaceParams, b: FaceParams, t: number): FaceParams => {
  const out = {} as FaceParams;
  (Object.keys(a) as (keyof FaceParams)[]).forEach((k) => {
    out[k] = lerp(a[k], b[k], t);
  });
  return out;
};

export const blendPose = (a: PoseParams, b: PoseParams, t: number): PoseParams => ({
  l: {x: lerp(a.l.x, b.l.x, t), y: lerp(a.l.y, b.l.y, t)},
  r: {x: lerp(a.r.x, b.r.x, t), y: lerp(a.r.y, b.r.y, t)},
  lWave: lerp(a.lWave, b.lWave, t),
  rWave: lerp(a.rWave, b.rWave, t),
});
