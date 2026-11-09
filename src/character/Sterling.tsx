import React, {useId} from 'react';
import type {FaceParams, PoseParams, Vec} from './params';

// Sterling — the channel host. A friendly money & history nerd: round glasses, emerald vest,
// gold bow tie, rolled-up sleeves, and a gold coin he flips when he gets to the good part.
// Pure renderer: give it numbers, it draws one frame.

export const C = {
  skin: '#E8AE83',
  skinShade: '#C98A60',
  skinLight: '#F6C9A3',
  hair: '#3B2418',
  hairLight: '#5E3B27',
  outline: '#2B1A12',
  shirt: '#F7F4EE',
  shirtShade: '#DCD5C8',
  vest: '#1E8A5A',
  vestShade: '#156B44',
  vestLight: '#2BA36C',
  bowtie: '#F2B233',
  bowtieShade: '#C98D17',
  pants: '#2B3A5C',
  pantsShade: '#1F2A44',
  shoes: '#4A2C1A',
  iris: '#6B4423',
  pupil: '#1A120D',
  mouth: '#6B1E2A',
  tongue: '#E8707F',
  cheek: '#E9827A',
  coin: '#F6C445',
  coinShade: '#D08F12',
};

export interface SterlingRenderProps {
  face: FaceParams;
  pose: PoseParams;
  t: number; // seconds (cyclic motion)
  talk: number; // 0..1 voice loudness
  blink: number; // 0..1
  look: Vec; // -1..1 (also turns the head a little)
  jump: number; // px
  squash: number;
  lean: number; // deg
  headTilt: number; // deg
  coin: number; // -1 = no coin, 0..1 = flip progress
  style?: React.CSSProperties;
}

const L1 = 98;
const L2 = 92;
const SH_L: Vec = {x: 124, y: 336};
const SH_R: Vec = {x: 276, y: 336};
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const solveArm = (s: Vec, target: Vec, side: -1 | 1) => {
  const dx = target.x - s.x;
  const dy = target.y - s.y;
  const phi = Math.atan2(dy, dx);
  const d = clamp(Math.hypot(dx, dy), 20, L1 + L2 - 0.5);
  const hand = {x: s.x + Math.cos(phi) * d, y: s.y + Math.sin(phi) * d};
  const a = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const c1 = {x: s.x + L1 * Math.cos(phi + a), y: s.y + L1 * Math.sin(phi + a)};
  const c2 = {x: s.x + L1 * Math.cos(phi - a), y: s.y + L1 * Math.sin(phi - a)};
  // human elbows hang down: prefer the low elbow, then the outward one
  const score = (p: Vec) => 0.5 * (p.x - 200) * side + p.y;
  const elbow = score(c1) >= score(c2) ? c1 : c2;
  return {elbow, hand};
};

const Arm: React.FC<{s: Vec; target: Vec; side: -1 | 1}> = ({s, target, side}) => {
  const {elbow: e, hand: h} = solveArm(s, target, side);
  const ux = (e.x - s.x) / L1;
  const uy = (e.y - s.y) / L1;
  const cuffA = {x: e.x - ux * 16, y: e.y - uy * 16};
  const cuffB = {x: e.x + ux * 4, y: e.y + uy * 4};
  const fx = (h.x - e.x) / L2;
  const fy = (h.y - e.y) / L2;
  // thumb sits on the inner side of the hand
  const px = -fy * -side;
  const py = fx * -side;
  const sleeve = `M ${s.x} ${s.y} L ${e.x} ${e.y}`;
  const fore = `M ${e.x} ${e.y} L ${h.x} ${h.y}`;
  const cuff = `M ${cuffA.x} ${cuffA.y} L ${cuffB.x} ${cuffB.y}`;
  const thumb = {x: h.x + px * 15 - fx * 2, y: h.y + py * 15 - fy * 2};
  const thumbRot = (Math.atan2(fy, fx) * 180) / Math.PI;
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={sleeve} stroke={C.outline} strokeWidth={44} />
      <path d={fore} stroke={C.outline} strokeWidth={34} />
      <path d={cuff} stroke={C.outline} strokeWidth={50} />
      <path d={fore} stroke={C.skin} strokeWidth={24} />
      <path d={sleeve} stroke={C.shirt} strokeWidth={34} />
      <path d={cuff} stroke={C.shirt} strokeWidth={40} />
      <path d={cuff} stroke={C.shirtShade} strokeWidth={6} opacity={0.8} />
      <ellipse cx={thumb.x} cy={thumb.y} rx={8} ry={12} transform={`rotate(${thumbRot} ${thumb.x} ${thumb.y})`} fill={C.skin} stroke={C.outline} strokeWidth={5} />
      <circle cx={h.x} cy={h.y} r={20} fill={C.skin} stroke={C.outline} strokeWidth={5.5} />
      <circle cx={h.x - 6} cy={h.y - 7} r={5} fill="#fff" opacity={0.25} />
    </g>
  );
};

const Eye: React.FC<{id: string; cx: number; cy: number; face: FaceParams; blink: number; look: Vec; happy: number}> = ({
  id,
  cx,
  cy,
  face,
  blink,
  look,
  happy,
}) => {
  const rx = 21;
  const ry = 24 * clamp(face.eyeOpen, 1, 1.2);
  const lidBase = clamp(1 - face.eyeOpen, 0, 0.9);
  const cover = 1 - (1 - lidBase) * (1 - clamp(blink, 0, 1));
  const top = cy - ry - 2;
  const edgeY = top + cover * (2 * ry + 4);
  const ir = 12.5 * face.pupil;
  const px = cx + look.x * 7;
  const py = cy + look.y * 7 + 1;
  const clipId = `seye-${id}`;
  return (
    <g>
      <g opacity={1 - happy}>
        <clipPath id={clipId}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" />
        <g clipPath={`url(#${clipId})`}>
          <circle cx={px} cy={py} r={ir} fill={C.iris} />
          <circle cx={px} cy={py} r={ir * 0.5} fill={C.pupil} />
          <circle cx={px - 4.5} cy={py - 5} r={4} fill="#fff" />
          <circle cx={px + 4} cy={py + 4} r={1.8} fill="#fff" />
          {cover > 0.01 ? (
            <>
              <path
                d={`M ${cx - rx - 4} ${top - 4} L ${cx + rx + 4} ${top - 4} L ${cx + rx + 4} ${edgeY} Q ${cx} ${edgeY + 6} ${cx - rx - 4} ${edgeY} Z`}
                fill={C.skin}
              />
              <path d={`M ${cx - rx - 4} ${edgeY} Q ${cx} ${edgeY + 6} ${cx + rx + 4} ${edgeY}`} stroke={C.outline} strokeWidth={4} fill="none" />
            </>
          ) : null}
        </g>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={C.outline} strokeWidth={4} />
        {/* lash line */}
        <path
          d={`M ${cx - rx - 2} ${cy - 2} Q ${cx - rx + 2} ${top + 1} ${cx} ${top} Q ${cx + rx - 2} ${top + 1} ${cx + rx + 3} ${cy - 5}`}
          stroke={C.outline}
          strokeWidth={5.5}
          fill="none"
          strokeLinecap="round"
          opacity={cover > 0.9 ? 0 : 1}
        />
      </g>
      {happy > 0.01 ? (
        <path
          d={`M ${cx - 18} ${cy + 6} Q ${cx} ${cy - 16} ${cx + 18} ${cy + 6}`}
          stroke={C.outline}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
          opacity={happy}
        />
      ) : null}
    </g>
  );
};

const Mouth: React.FC<{id: string; face: FaceParams; talk: number; cx: number}> = ({id, face, talk, cx}) => {
  const my = 252;
  const open = clamp(face.mouthOpen + talk * 0.9, 0, 1);
  const c = face.mouthCurve;
  const round = clamp(face.mouthRound + talk * 0.2, 0, 1);
  const hw = (face.mouthWidth * 0.36) * (1 - 0.3 * round * open) * (1 - 0.08 * talk);
  const cornerY = my - c * 6;
  const topCtrl = my + c * 14 * (1 - open) + c * 5 * open - round * 18 * open;
  const botCtrl = my + c * 14 + open * 50;
  const d = `M ${cx - hw} ${cornerY} Q ${cx} ${topCtrl} ${cx + hw} ${cornerY} Q ${cx} ${botCtrl} ${cx - hw} ${cornerY} Z`;
  const depth = (botCtrl - topCtrl) / 2;
  if (open < 0.03) {
    return (
      <path
        d={`M ${cx - hw} ${cornerY} Q ${cx} ${my + c * 14} ${cx + hw} ${cornerY}`}
        stroke={C.outline}
        strokeWidth={5.5}
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  const clipId = `smouth-${id}`;
  const topMid = (cornerY + topCtrl) / 2;
  return (
    <g>
      <clipPath id={clipId}>
        <path d={d} />
      </clipPath>
      <path d={d} fill={C.mouth} />
      <g clipPath={`url(#${clipId})`}>
        <ellipse cx={cx} cy={topMid + depth * 1.2} rx={hw * 0.62} ry={Math.max(3, depth * 0.55)} fill={C.tongue} />
        <path d={`M ${cx - hw} ${cornerY} Q ${cx} ${topCtrl} ${cx + hw} ${cornerY}`} stroke="#fff" strokeWidth={depth > 7 ? 11 : 0} fill="none" />
      </g>
      <path d={d} fill="none" stroke={C.outline} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};

const Coin: React.FC<{x: number; y: number; spin: number; r?: number}> = ({x, y, spin, r = 24}) => {
  const sx = Math.max(0.08, Math.abs(Math.cos(spin)));
  const face = Math.cos(spin) >= 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} 1)`}>
      <circle r={r} fill={face ? C.coin : C.coinShade} stroke={C.outline} strokeWidth={5 / sx > 12 ? 12 : 5} />
      <circle r={r * 0.68} fill="none" stroke={C.coinShade} strokeWidth={3.5} />
      {face ? (
        <text y={r * 0.36} textAnchor="middle" fontSize={r * 1.05} fontWeight={900} fill={C.coinShade} fontFamily="Arial, sans-serif">
          $
        </text>
      ) : null}
    </g>
  );
};

export const Sterling: React.FC<SterlingRenderProps> = (p) => {
  const {face, pose, t, talk, blink, look, jump, squash, lean, headTilt, coin, style} = p;
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const wave = (amp: number, phase: number) => ({
    x: Math.sin(t * Math.PI * 2 * 1.9 + phase) * 20 * amp,
    y: Math.cos(t * Math.PI * 2 * 1.9 + phase) * 6 * amp,
  });
  const lw = wave(pose.lWave, Math.PI);
  const rw = wave(pose.rWave, 0);
  const lT = {x: pose.l.x + lw.x, y: pose.l.y + lw.y};
  const rT = {x: pose.r.x + rw.x, y: pose.r.y + rw.y};

  const turn = clamp(look.x, -1, 1) * 0.6;
  const breathe = Math.sin(t * Math.PI * 2 * 0.3) * 0.008;
  const browScale = 0.55;
  const ry = 24 * clamp(face.eyeOpen, 1, 1.2);
  const browY = 184 - ry - 20 - face.browLift * browScale - talk * 2.5;
  const rightHappy = Math.max(face.happyEyes, face.wink);
  const coinOn = coin >= 0;
  const rHand = solveArm(SH_R, rT, 1).hand;
  const coinY = rHand.y - 30 - Math.sin(clamp(coin, 0, 1) * Math.PI) * 190;
  const coinX = rHand.x - 4;

  return (
    <svg viewBox="0 0 400 800" style={{overflow: 'visible', ...style}}>
      <defs>
        <linearGradient id={`vest-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor={C.vestLight} />
          <stop offset="0.55" stopColor={C.vest} />
          <stop offset="1" stopColor={C.vestShade} />
        </linearGradient>
        <radialGradient id={`face-${id}`} cx="0.42" cy="0.38" r="0.75">
          <stop offset="0" stopColor={C.skinLight} />
          <stop offset="0.6" stopColor={C.skin} />
          <stop offset="1" stopColor={C.skinShade} />
        </radialGradient>
      </defs>

      <ellipse cx={200} cy={772} rx={120 * clamp(1 - jump / 400, 0.5, 1)} ry={13} fill="#000" opacity={0.22 * clamp(1 - jump / 400, 0.5, 1)} />

      <g transform={`translate(0 ${-jump}) translate(200 772) rotate(${lean}) scale(${1 + squash} ${1 - squash}) translate(-200 -772)`}>
        {/* legs + shoes */}
        <g stroke={C.outline} strokeWidth={6} strokeLinejoin="round">
          <ellipse cx={162} cy={758} rx={40} ry={15} fill={C.shoes} />
          <ellipse cx={238} cy={758} rx={40} ry={15} fill={C.shoes} />
          <path d="M 120 500 L 200 500 L 197 750 L 142 750 Z" fill={C.pants} />
          <path d="M 200 500 L 280 500 L 258 750 L 203 750 Z" fill={C.pantsShade} />
        </g>

        {/* torso */}
        <g transform={`translate(200 512) scale(1 ${1 + breathe}) translate(-200 -512)`}>
          <path
            d="M 182 266 L 182 318 Q 200 328 218 318 L 218 266 Z"
            fill={C.skinShade}
            stroke={C.outline}
            strokeWidth={6}
          />
          <path
            d="M 112 334 C 112 316 130 307 150 304 L 250 304 C 270 307 288 316 288 334 L 283 512 L 117 512 Z"
            fill={C.shirt}
            stroke={C.outline}
            strokeWidth={6}
            strokeLinejoin="round"
          />
          <path
            d="M 112 338 C 112 320 128 311 146 308 L 175 304 L 200 406 L 225 304 L 254 308 C 272 311 288 320 288 338 L 285 506 L 238 530 L 200 514 L 162 530 L 115 506 Z"
            fill={`url(#vest-${id})`}
            stroke={C.outline}
            strokeWidth={6}
            strokeLinejoin="round"
          />
          {[432, 460, 488].map((y) => (
            <circle key={y} cx={200} cy={y} r={5} fill={C.bowtie} stroke={C.outline} strokeWidth={2.5} />
          ))}
          {/* collar */}
          <path d="M 176 300 L 200 322 L 184 340 L 166 314 Z" fill={C.shirt} stroke={C.outline} strokeWidth={5} strokeLinejoin="round" />
          <path d="M 224 300 L 200 322 L 216 340 L 234 314 Z" fill={C.shirt} stroke={C.outline} strokeWidth={5} strokeLinejoin="round" />
          {/* bow tie */}
          <g stroke={C.outline} strokeWidth={5} strokeLinejoin="round">
            <path d="M 200 320 L 170 304 L 172 338 Z" fill={C.bowtie} />
            <path d="M 200 320 L 230 304 L 228 338 Z" fill={C.bowtie} />
            <rect x={190} y={310} width={20} height={20} rx={6} fill={C.bowtieShade} />
          </g>
        </g>

        {/* head */}
        <g transform={`rotate(${headTilt} 200 300) translate(${turn * 4} ${talk * 1.5})`}>
          {/* back hair */}
          <path
            d="M 94 186 C 80 104 126 42 202 38 C 282 34 326 98 308 186 C 302 152 296 132 286 118 C 264 96 234 88 200 88 C 164 88 132 96 112 118 C 102 134 96 154 94 186 Z"
            fill={C.hair}
            stroke={C.outline}
            strokeWidth={6}
          />
          {/* ears */}
          <g transform={`translate(${-turn * 3} 0)`}>
            <ellipse cx={98} cy={192} rx={15} ry={23} fill={C.skin} stroke={C.outline} strokeWidth={5.5} />
            <ellipse cx={302} cy={192} rx={15} ry={23} fill={C.skin} stroke={C.outline} strokeWidth={5.5} />
            <path d="M 98 180 Q 92 192 100 204" stroke={C.skinShade} strokeWidth={4} fill="none" strokeLinecap="round" />
            <path d="M 302 180 Q 308 192 300 204" stroke={C.skinShade} strokeWidth={4} fill="none" strokeLinecap="round" />
          </g>
          {/* face */}
          <path
            d="M 200 64 C 263 64 304 104 304 170 C 304 228 282 268 244 284 C 226 292 174 292 156 284 C 118 268 96 228 96 170 C 96 104 137 64 200 64 Z"
            fill={`url(#face-${id})`}
            stroke={C.outline}
            strokeWidth={6}
          />
          <g transform={`translate(${turn * 9} 0)`}>
            <ellipse cx={130} cy={234} rx={17} ry={9} fill={C.cheek} opacity={face.cheek * 0.75} />
            <ellipse cx={270} cy={234} rx={17} ry={9} fill={C.cheek} opacity={face.cheek * 0.75} />
            <Eye id={`${id}l`} cx={160} cy={184} face={face} blink={blink} look={look} happy={face.happyEyes} />
            <Eye id={`${id}r`} cx={240} cy={184} face={face} blink={blink} look={look} happy={rightHappy} />
            {/* glasses */}
            <g stroke={C.outline} strokeWidth={6} fill="#fff" fillOpacity={0.08}>
              <circle cx={160} cy={184} r={35} />
              <circle cx={240} cy={184} r={35} />
              <path d="M 195 182 Q 200 175 205 182" fill="none" />
              <path d="M 125 178 L 100 172" fill="none" strokeLinecap="round" />
              <path d="M 275 178 L 300 172" fill="none" strokeLinecap="round" />
            </g>
            <path d="M 136 168 Q 150 158 164 162" stroke="#fff" strokeWidth={4} opacity={0.5} fill="none" strokeLinecap="round" />
            {/* brows */}
            <line
              x1={138}
              y1={browY - face.browAsym * browScale}
              x2={182}
              y2={browY - face.browAsym * browScale}
              stroke={C.hair}
              strokeWidth={10}
              strokeLinecap="round"
              transform={`rotate(${-face.browTilt * 0.8} 160 ${browY - face.browAsym * browScale})`}
            />
            <line
              x1={218}
              y1={browY}
              x2={262}
              y2={browY}
              stroke={C.hair}
              strokeWidth={10}
              strokeLinecap="round"
              transform={`rotate(${face.browTilt * 0.8} 240 ${browY})`}
            />
            {/* nose */}
            <path d="M 203 200 C 197 216 193 226 201 230 C 207 232 213 229 215 223" stroke={C.skinShade} strokeWidth={5} fill="none" strokeLinecap="round" />
            <Mouth id={id} face={face} talk={talk} cx={200} />
          </g>
          {/* front hair with a signature swoop + curl */}
          <g transform={`translate(${turn * 4} 0)`}>
            <path
              d="M 98 156 C 94 92 140 56 198 54 C 256 52 304 86 308 144 C 294 124 276 112 254 108 C 262 120 263 132 256 142 C 238 120 208 110 178 113 C 146 116 118 132 98 156 Z"
              fill={C.hair}
              stroke={C.outline}
              strokeWidth={6}
              strokeLinejoin="round"
            />
            <path d="M 132 96 C 160 76 200 72 232 80" stroke={C.hairLight} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.9} />
            <path
              d="M 186 58 C 186 26 226 18 240 40 C 246 52 238 62 228 60 C 234 48 224 38 212 44 C 202 50 200 58 200 62 Z"
              fill={C.hair}
              stroke={C.outline}
              strokeWidth={5.5}
              strokeLinejoin="round"
            />
          </g>
        </g>

        <Arm s={SH_L} target={lT} side={-1} />
        <Arm s={SH_R} target={rT} side={1} />
        {coinOn ? <Coin x={coinX} y={coinY} spin={coin * Math.PI * 6} /> : null}
      </g>
    </svg>
  );
};
