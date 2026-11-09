import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Background} from '../components/Background';
import {LeeshoActor, type Beat} from '../character/LeeshoActor';
import type {Expression, Pose, Antenna} from '../character/params';
import {FONT_DISPLAY, FONT_UI} from '../lib/fonts';

const SHOWCASE: Beat[] = [
  {at: 0, expression: 'happy', pose: 'idle', antenna: 'question'},
  {at: 18, expression: 'excited', pose: 'wave', hop: true},
  {at: 80, expression: 'thinking', pose: 'think', look: {x: -0.7, y: -0.8}},
  {at: 145, expression: 'surprised', pose: 'idle', look: {x: 0, y: 0}},
  {at: 160, antenna: 'idea', expression: 'excited', pose: 'cheer', hop: true},
  {at: 215, expression: 'laugh', pose: 'shrug'},
  {at: 245, expression: 'wink', pose: 'point'},
];

// Fake speech loudness so the mouth can be previewed without audio.
const fakeTalk = (f: number) => {
  const inSpeech = (f > 24 && f < 74) || (f > 172 && f < 212) || (f > 250 && f < 290);
  if (!inSpeech) return 0;
  const v = Math.abs(Math.sin(f * 0.9) * 0.6 + Math.sin(f * 0.37 + 1) * 0.4 + Math.sin(f * 1.7) * 0.2);
  return Math.min(1, v * 0.9);
};
const ENVELOPE = Array.from({length: 400}, (_, i) => fakeTalk(i));

const GRID: {label: string; expression: Expression; pose: Pose; antenna?: Antenna}[] = [
  {label: 'سعيد', expression: 'happy', pose: 'wave'},
  {label: 'متحمّس', expression: 'excited', pose: 'cheer', antenna: 'idea'},
  {label: 'مندهش', expression: 'surprised', pose: 'shrug'},
  {label: 'يفكّر', expression: 'thinking', pose: 'think'},
  {label: 'حزين', expression: 'sad', pose: 'idle'},
  {label: 'يغمز', expression: 'wink', pose: 'point'},
  {label: 'واثق', expression: 'determined', pose: 'hips'},
  {label: 'يضحك', expression: 'laugh', pose: 'present', antenna: 'idea'},
];

export const CharacterSheet: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{direction: 'rtl'}}>
      <Background theme="night" seed="sheet" density={18} />
      <div
        style={{
          position: 'absolute',
          top: 34,
          right: 90,
          fontFamily: FONT_DISPLAY,
          fontSize: 150,
          color: '#FFD23F',
          lineHeight: 1,
          textShadow: '0 8px 0 rgba(0,0,0,0.25)',
        }}
      >
        ليشو
      </div>
      <div
        style={{
          position: 'absolute',
          top: 70,
          right: 420,
          fontFamily: FONT_UI,
          fontWeight: 700,
          fontSize: 44,
          color: '#fff',
          lineHeight: 1.25,
          maxWidth: 900,
        }}
      >
        مخلوق فضولي، هوائيّه علامة استفهام ؟
        <br />
        <span style={{color: '#FFD23F'}}>ولمّا يلگى الجواب تصير !</span>
      </div>

      {/* big animated Leesho */}
      <div style={{position: 'absolute', right: 70, top: 250, width: 560, height: 784}}>
        <LeeshoActor beats={SHOWCASE} envelope={ENVELOPE} seed="hero" style={{width: '100%', height: '100%'}} />
      </div>

      {/* expression grid */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 270,
          width: 1180,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          rowGap: 24,
          columnGap: 16,
        }}
      >
        {GRID.map((g, i) => (
          <div
            key={g.label}
            style={{
              background: 'rgba(255,255,255,0.10)',
              border: '3px solid rgba(255,255,255,0.18)',
              borderRadius: 36,
              height: 370,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingBottom: 14,
            }}
          >
            <div style={{width: 210, height: 294}}>
              <LeeshoActor
                beats={[{at: 0, expression: g.expression, pose: g.pose, antenna: g.antenna ?? 'question'}]}
                seed={`grid-${i}-${Math.floor(frame / 1000)}`}
                style={{width: '100%', height: '100%'}}
              />
            </div>
            <div style={{fontFamily: FONT_UI, fontWeight: 800, fontSize: 40, color: '#fff', marginTop: 6}}>{g.label}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
