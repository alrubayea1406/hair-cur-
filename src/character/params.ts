// Numeric "rig" parameters for Leesho. Every expression / pose is just a set of
// numbers, so the animation controller can blend smoothly between any two.

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
  | 'smug';

export type Pose =
  | 'idle'
  | 'wave'
  | 'point'
  | 'pointLeft'
  | 'think'
  | 'cheer'
  | 'shrug'
  | 'present'
  | 'hips'
  | 'facepalm';

export type Antenna = 'question' | 'idea';

export interface FaceParams {
  browLift: number; // px up
  browTilt: number; // deg, + = inner ends up (worried), - = inner ends down (angry)
  browAsym: number; // px extra lift on the viewer-left brow
  eyeOpen: number; // 1 = normal, <1 = lids lower, >1 = wide eyes
  pupil: number; // pupil size multiplier
  mouthCurve: number; // -1 frown .. 1 smile
  mouthWidth: number; // px
  mouthOpen: number; // 0..1 base openness (talking adds on top)
  mouthRound: number; // 0..1 "O" shape
  cheek: number; // blush opacity
  happyEyes: number; // 0..1 crossfade to ^ ^ eyes
  wink: number; // 0..1 closes the viewer-right eye as ^
}

export interface Vec {
  x: number;
  y: number;
}

export interface PoseParams {
  l: Vec; // viewer-left hand target
  r: Vec; // viewer-right hand target
  lFront: number; // 0 = arm behind body, 1 = in front
  rFront: number;
  lWave: number; // waving amplitude for that hand
  rWave: number;
}

export const FACES: Record<Expression, FaceParams> = {
  neutral: {browLift: 0, browTilt: 0, browAsym: 0, eyeOpen: 1, pupil: 1, mouthCurve: 0.25, mouthWidth: 52, mouthOpen: 0, mouthRound: 0, cheek: 0.35, happyEyes: 0, wink: 0},
  happy: {browLift: 5, browTilt: 2, browAsym: 0, eyeOpen: 1, pupil: 1, mouthCurve: 0.9, mouthWidth: 70, mouthOpen: 0.06, mouthRound: 0, cheek: 0.55, happyEyes: 0, wink: 0},
  excited: {browLift: 13, browTilt: 5, browAsym: 0, eyeOpen: 1.12, pupil: 1.1, mouthCurve: 1, mouthWidth: 84, mouthOpen: 0.45, mouthRound: 0, cheek: 0.75, happyEyes: 0, wink: 0},
  surprised: {browLift: 22, browTilt: 6, browAsym: 0, eyeOpen: 1.2, pupil: 0.7, mouthCurve: 0, mouthWidth: 40, mouthOpen: 0.7, mouthRound: 1, cheek: 0.35, happyEyes: 0, wink: 0},
  thinking: {browLift: 4, browTilt: -4, browAsym: 12, eyeOpen: 0.82, pupil: 1, mouthCurve: -0.15, mouthWidth: 36, mouthOpen: 0, mouthRound: 0.3, cheek: 0.3, happyEyes: 0, wink: 0},
  sad: {browLift: 4, browTilt: 18, browAsym: 0, eyeOpen: 0.88, pupil: 1.08, mouthCurve: -0.85, mouthWidth: 50, mouthOpen: 0, mouthRound: 0, cheek: 0.25, happyEyes: 0, wink: 0},
  wink: {browLift: 6, browTilt: 2, browAsym: -4, eyeOpen: 1, pupil: 1, mouthCurve: 0.95, mouthWidth: 70, mouthOpen: 0.12, mouthRound: 0, cheek: 0.6, happyEyes: 0, wink: 1},
  determined: {browLift: -5, browTilt: -15, browAsym: 0, eyeOpen: 0.9, pupil: 1, mouthCurve: 0.45, mouthWidth: 62, mouthOpen: 0, mouthRound: 0, cheek: 0.4, happyEyes: 0, wink: 0},
  laugh: {browLift: 10, browTilt: 5, browAsym: 0, eyeOpen: 1, pupil: 1, mouthCurve: 1, mouthWidth: 88, mouthOpen: 0.7, mouthRound: 0, cheek: 0.85, happyEyes: 1, wink: 0},
  smug: {browLift: 2, browTilt: -6, browAsym: 10, eyeOpen: 0.72, pupil: 1, mouthCurve: 0.7, mouthWidth: 58, mouthOpen: 0, mouthRound: 0, cheek: 0.5, happyEyes: 0, wink: 0},
};

// Hand targets are in the character's 400x500 viewBox.
export const POSES: Record<Pose, PoseParams> = {
  idle: {l: {x: 50, y: 428}, r: {x: 350, y: 428}, lFront: 0, rFront: 0, lWave: 0, rWave: 0},
  wave: {l: {x: 50, y: 428}, r: {x: 372, y: 205}, lFront: 0, rFront: 0, lWave: 0, rWave: 1},
  point: {l: {x: 50, y: 428}, r: {x: 398, y: 245}, lFront: 0, rFront: 0, lWave: 0, rWave: 0},
  pointLeft: {l: {x: 2, y: 245}, r: {x: 350, y: 428}, lFront: 0, rFront: 0, lWave: 0, rWave: 0},
  think: {l: {x: 168, y: 378}, r: {x: 352, y: 430}, lFront: 1, rFront: 0, lWave: 0, rWave: 0},
  cheer: {l: {x: 38, y: 190}, r: {x: 362, y: 190}, lFront: 0, rFront: 0, lWave: 0.35, rWave: 0.35},
  shrug: {l: {x: 22, y: 292}, r: {x: 378, y: 292}, lFront: 0, rFront: 0, lWave: 0, rWave: 0},
  present: {l: {x: 50, y: 428}, r: {x: 395, y: 322}, lFront: 0, rFront: 0, lWave: 0, rWave: 0},
  hips: {l: {x: 74, y: 398}, r: {x: 326, y: 398}, lFront: 0, rFront: 0, lWave: 0, rWave: 0},
  facepalm: {l: {x: 160, y: 262}, r: {x: 352, y: 430}, lFront: 1, rFront: 0, lWave: 0, rWave: 0},
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
  lFront: lerp(a.lFront, b.lFront, t),
  rFront: lerp(a.rFront, b.rFront, t),
  lWave: lerp(a.lWave, b.lWave, t),
  rWave: lerp(a.rWave, b.rWave, t),
});
