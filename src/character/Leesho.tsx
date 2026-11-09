import React, {useId} from 'react';
import type {FaceParams, PoseParams, Vec} from './params';

// ليشو (Leesho) — a small curious creature whose antenna is a question mark "؟".
// When he finds the answer the antenna straightens into "!" and lights up.
// This component is a pure renderer: give it numbers, it draws one frame.

export const COLORS = {
  body: '#FF8A3D',
  bodyLight: '#FFBE7D',
  bodyDark: '#E8641F',
  belly: '#FFE6C4',
  outline: '#3B2416',
  feet: '#E9672A',
  cheek: '#FF5C7A',
  pupil: '#2A2140',
  mouth: '#6E1D2B',
  tongue: '#FF7B8C',
  tip: '#FFD23F',
};

export interface LeeshoRenderProps {
  face: FaceParams;
  pose: PoseParams;
  t: number; // seconds (drives cyclic motions such as waving)
  talk: number; // 0..1 loudness of the voice at this frame
  blink: number; // 0..1
  look: Vec; // pupils direction, -1..1
  antenna: number; // 0 = "؟" , 1 = "!"
  glow: number; // 0..1 light on the antenna tip
  jump: number; // px off the ground
  squash: number; // + squash (wide) / - stretch (tall)
  lean: number; // deg
  antennaSwing: number; // deg
  style?: React.CSSProperties;
}

const L1 = 58;
const L2 = 60;
const SHOULDER_L: Vec = {x: 94, y: 330};
const SHOULDER_R: Vec = {x: 306, y: 330};
const BODY_PATH =
  'M 200 160 C 292 160 336 240 336 330 C 336 414 292 447 200 447 C 108 447 64 414 64 330 C 64 240 108 160 200 160 Z';
const ANTENNA_BASE: Vec = {x: 200, y: 168};

// Arabic question mark "؟" (mirror of the Latin one) and a straight "!" share the
// same 3-segment bezier structure so they can be morphed point by point.
const Q_PTS = [0, -14, 0, -28, 0, -42, 0, -60, -40, -68, -40, -102, -40, -156, 40, -156, 40, -102];
const I_PTS = [0, -14, 0, -28, 0, -42, 0, -60, 0, -78, 0, -96, 0, -116, 0, -134, 0, -150];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const solveArm = (s: Vec, target: Vec, side: -1 | 1) => {
  const dx = target.x - s.x;
  const dy = target.y - s.y;
  const phi = Math.atan2(dy, dx);
  const d = clamp(Math.hypot(dx, dy), 14, L1 + L2 - 0.5);
  const hand = {x: s.x + Math.cos(phi) * d, y: s.y + Math.sin(phi) * d};
  const a = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const c1 = {x: s.x + L1 * Math.cos(phi + a), y: s.y + L1 * Math.sin(phi + a)};
  const c2 = {x: s.x + L1 * Math.cos(phi - a), y: s.y + L1 * Math.sin(phi - a)};
  // Prefer the elbow that sits outward and low — looks natural for every pose.
  const score = (p: Vec) => (p.x - 200) * side + 0.5 * p.y;
  const elbow = score(c1) >= score(c2) ? c1 : c2;
  return {elbow, hand};
};

const Arm: React.FC<{s: Vec; target: Vec; side: -1 | 1}> = ({s, target, side}) => {
  const {elbow, hand} = solveArm(s, target, side);
  // The elbow is used as a quadratic control point -> soft "rubber-hose" arm.
  const d = `M ${s.x} ${s.y} Q ${elbow.x} ${elbow.y} ${hand.x} ${hand.y}`;
  return (
    <g>
      <path d={d} stroke={COLORS.outline} strokeWidth={31} fill="none" strokeLinecap="round" />
      <path d={d} stroke={COLORS.body} strokeWidth={19} fill="none" strokeLinecap="round" />
      <circle cx={hand.x} cy={hand.y} r={19} fill={COLORS.body} stroke={COLORS.outline} strokeWidth={6} />
      <circle cx={hand.x - 5} cy={hand.y - 6} r={5} fill="#fff" opacity={0.35} />
    </g>
  );
};

const Eye: React.FC<{
  id: string;
  cx: number;
  cy: number;
  face: FaceParams;
  blink: number;
  look: Vec;
  happy: number;
}> = ({id, cx, cy, face, blink, look, happy}) => {
  const rx = 33;
  const ry = 39 * clamp(face.eyeOpen, 1, 1.25);
  const lidBase = clamp(1 - face.eyeOpen, 0, 0.92);
  const cover = 1 - (1 - lidBase) * (1 - clamp(blink, 0, 1));
  const top = cy - ry - 3;
  const edgeY = top + cover * (2 * ry + 6);
  const pr = 16 * face.pupil;
  const px = cx + look.x * 11;
  const py = cy + look.y * 10 + 2;
  const clipId = `eye-${id}`;
  return (
    <g>
      <g opacity={1 - happy}>
        <clipPath id={clipId}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" />
        <g clipPath={`url(#${clipId})`}>
          <circle cx={px} cy={py} r={pr} fill={COLORS.pupil} />
          <circle cx={px - 5.5} cy={py - 6} r={5.5} fill="#fff" />
          <circle cx={px + 5} cy={py + 5} r={2.4} fill="#fff" />
          {cover > 0.01 ? (
            <>
              <path
                d={`M ${cx - rx - 4} ${top - 4} L ${cx + rx + 4} ${top - 4} L ${cx + rx + 4} ${edgeY} Q ${cx} ${edgeY + 7} ${cx - rx - 4} ${edgeY} Z`}
                fill={COLORS.bodyLight}
              />
              <path
                d={`M ${cx - rx - 4} ${edgeY} Q ${cx} ${edgeY + 7} ${cx + rx + 4} ${edgeY}`}
                stroke={COLORS.outline}
                strokeWidth={4.5}
                fill="none"
              />
            </>
          ) : null}
        </g>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={COLORS.outline} strokeWidth={5.5} />
      </g>
      {happy > 0.01 ? (
        <path
          d={`M ${cx - 25} ${cy + 9} Q ${cx} ${cy - 24} ${cx + 25} ${cy + 9}`}
          stroke={COLORS.outline}
          strokeWidth={8}
          strokeLinecap="round"
          fill="none"
          opacity={happy}
        />
      ) : null}
    </g>
  );
};

const Mouth: React.FC<{id: string; face: FaceParams; talk: number}> = ({id, face, talk}) => {
  const cx = 200;
  const my = 342;
  const open = clamp(face.mouthOpen + talk * 0.95, 0, 1);
  const c = face.mouthCurve;
  const round = clamp(face.mouthRound + talk * 0.25, 0, 1);
  const hw = (face.mouthWidth / 2) * (1 - 0.3 * round * open) * (1 - 0.1 * talk);
  const cornerY = my - c * 9;
  const topCtrl = my + c * 20 * (1 - open) + c * 8 * open - round * 30 * open;
  const botCtrl = my + c * 20 + open * 74;
  const d = `M ${cx - hw} ${cornerY} Q ${cx} ${topCtrl} ${cx + hw} ${cornerY} Q ${cx} ${botCtrl} ${cx - hw} ${cornerY} Z`;
  const depth = (botCtrl - topCtrl) / 2;
  const clipId = `mouth-${id}`;
  if (open < 0.025) {
    return (
      <path
        d={`M ${cx - hw} ${cornerY} Q ${cx} ${my + c * 20} ${cx + hw} ${cornerY}`}
        stroke={COLORS.outline}
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  const topMid = (cornerY + topCtrl) / 2;
  return (
    <g>
      <clipPath id={clipId}>
        <path d={d} />
      </clipPath>
      <path d={d} fill={COLORS.mouth} />
      <g clipPath={`url(#${clipId})`}>
        <ellipse cx={cx} cy={topMid + depth * 1.15} rx={hw * 0.62} ry={Math.max(4, depth * 0.55)} fill={COLORS.tongue} />
        <path
          d={`M ${cx - hw} ${cornerY} Q ${cx} ${topCtrl} ${cx + hw} ${cornerY}`}
          stroke="#fff"
          strokeWidth={depth > 10 ? 15 : 0}
          fill="none"
        />
      </g>
      <path d={d} fill="none" stroke={COLORS.outline} strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
};

const Antenna: React.FC<{morph: number; glow: number; swing: number; t: number}> = ({morph, glow, swing, t}) => {
  const p = Q_PTS.map((q, i) => q + (I_PTS[i] - q) * morph);
  const d = `M 0 0 C ${p[0]} ${p[1]} ${p[2]} ${p[3]} ${p[4]} ${p[5]} C ${p[6]} ${p[7]} ${p[8]} ${p[9]} ${p[10]} ${p[11]} C ${p[12]} ${p[13]} ${p[14]} ${p[15]} ${p[16]} ${p[17]}`;
  const tip = {x: p[16], y: p[17]};
  const tipR = 9 + 5 * morph;
  const pulse = 1 + Math.sin(t * Math.PI * 4) * 0.08;
  return (
    <g transform={`translate(${ANTENNA_BASE.x} ${ANTENNA_BASE.y}) rotate(${swing})`}>
      <path d={d} stroke={COLORS.outline} strokeWidth={13} fill="none" strokeLinecap="round" />
      <path d={d} stroke={COLORS.bodyDark} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.9} />
      {glow > 0.01 ? (
        <g opacity={glow}>
          <circle cx={tip.x} cy={tip.y} r={40 * pulse} fill="url(#leesho-glow)" />
          {Array.from({length: 8}).map((_, i) => {
            const a = (i / 8) * Math.PI * 2 + t * 0.8;
            const r1 = 24 * pulse;
            const r2 = 38 * pulse;
            return (
              <line
                key={i}
                x1={tip.x + Math.cos(a) * r1}
                y1={tip.y + Math.sin(a) * r1}
                x2={tip.x + Math.cos(a) * r2}
                y2={tip.y + Math.sin(a) * r2}
                stroke={COLORS.tip}
                strokeWidth={6}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      ) : null}
      <circle cx={tip.x} cy={tip.y} r={tipR} fill={COLORS.tip} stroke={COLORS.outline} strokeWidth={5} />
      <circle cx={tip.x - tipR * 0.3} cy={tip.y - tipR * 0.35} r={tipR * 0.3} fill="#fff" opacity={0.8} />
    </g>
  );
};

export const Leesho: React.FC<LeeshoRenderProps> = (props) => {
  const {face, pose, t, talk, blink, look, antenna, glow, jump, squash, lean, antennaSwing, style} = props;
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '');

  const wave = (amp: number, phase: number) => ({
    x: Math.sin(t * Math.PI * 2 * 2.1 + phase) * 22 * amp,
    y: Math.cos(t * Math.PI * 2 * 2.1 + phase) * 7 * amp,
  });
  const lw = wave(pose.lWave, Math.PI);
  const rw = wave(pose.rWave, 0);
  const lTarget = {x: pose.l.x + lw.x, y: pose.l.y + lw.y};
  const rTarget = {x: pose.r.x + rw.x, y: pose.r.y + rw.y};
  const leftArm = <Arm s={SHOULDER_L} target={lTarget} side={-1} />;
  const rightArm = <Arm s={SHOULDER_R} target={rTarget} side={1} />;

  const sx = 1 + squash;
  const sy = 1 - squash;
  const shadowScale = clamp(1 - jump / 420, 0.45, 1);
  const faceBob = talk * 3;
  const rightHappy = Math.max(face.happyEyes, face.wink);

  return (
    <svg viewBox="0 -80 400 570" style={{overflow: 'visible', ...style}}>
      <defs>
        <radialGradient id={`body-${id}`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor={COLORS.bodyLight} />
          <stop offset="0.55" stopColor={COLORS.body} />
          <stop offset="1" stopColor={COLORS.bodyDark} />
        </radialGradient>
        <radialGradient id="leesho-glow">
          <stop offset="0" stopColor="#FFF6B0" stopOpacity="1" />
          <stop offset="0.45" stopColor={COLORS.tip} stopOpacity="0.55" />
          <stop offset="1" stopColor={COLORS.tip} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`bodyclip-${id}`}>
          <path d={BODY_PATH} />
        </clipPath>
      </defs>

      {/* ground shadow */}
      <ellipse cx={200} cy={470} rx={112 * shadowScale} ry={13 * shadowScale} fill="#000" opacity={0.2 * shadowScale} />

      <g transform={`translate(0 ${-jump}) translate(200 468) rotate(${lean}) scale(${sx} ${sy}) translate(-200 -468)`}>
        <Antenna morph={antenna} glow={glow} swing={antennaSwing} t={t} />

        {/* feet */}
        <ellipse cx={158} cy={453} rx={31} ry={16} fill={COLORS.feet} stroke={COLORS.outline} strokeWidth={6} />
        <ellipse cx={242} cy={453} rx={31} ry={16} fill={COLORS.feet} stroke={COLORS.outline} strokeWidth={6} />

        {pose.lFront < 0.5 ? leftArm : null}
        {pose.rFront < 0.5 ? rightArm : null}

        {/* body */}
        <path d={BODY_PATH} fill={`url(#body-${id})`} />
        <g clipPath={`url(#bodyclip-${id})`}>
          <ellipse cx={200} cy={402} rx={88} ry={46} fill={COLORS.belly} opacity={0.92} />
          <ellipse cx={138} cy={212} rx={32} ry={15} fill="#fff" opacity={0.32} transform="rotate(-32 138 212)" />
        </g>
        <path d={BODY_PATH} fill="none" stroke={COLORS.outline} strokeWidth={7} />

        {/* face */}
        <g transform={`translate(0 ${faceBob})`}>
          <ellipse cx={114} cy={322} rx={21} ry={12} fill={COLORS.cheek} opacity={face.cheek} />
          <ellipse cx={286} cy={322} rx={21} ry={12} fill={COLORS.cheek} opacity={face.cheek} />
          <Eye id={`${id}l`} cx={158} cy={272} face={face} blink={blink} look={look} happy={face.happyEyes} />
          <Eye id={`${id}r`} cx={242} cy={272} face={face} blink={blink} look={look} happy={rightHappy} />
          {(() => {
            const ry = 39 * clamp(face.eyeOpen, 1, 1.25);
            const by = 272 - ry - 17 - face.browLift;
            return (
              <>
                <line
                  x1={137}
                  y1={by - face.browAsym}
                  x2={179}
                  y2={by - face.browAsym}
                  stroke={COLORS.outline}
                  strokeWidth={9}
                  strokeLinecap="round"
                  transform={`rotate(${-face.browTilt} 158 ${by - face.browAsym})`}
                />
                <line
                  x1={221}
                  y1={by}
                  x2={263}
                  y2={by}
                  stroke={COLORS.outline}
                  strokeWidth={9}
                  strokeLinecap="round"
                  transform={`rotate(${face.browTilt} 242 ${by})`}
                />
              </>
            );
          })()}
          <Mouth id={id} face={face} talk={talk} />
        </g>

        {pose.lFront >= 0.5 ? leftArm : null}
        {pose.rFront >= 0.5 ? rightArm : null}
      </g>
    </svg>
  );
};
