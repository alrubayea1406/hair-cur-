import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background} from '../components/Background';
import {Outlined} from '../components/Outlined';
import {Actor, type Beat} from '../character/Actor';
import type {Expression, Pose} from '../character/params';
import {FONT_DISPLAY, FONT_UI} from '../lib/fonts';

const SHOWCASE: Beat[] = [
  {at: 0, expression: 'happy', pose: 'idle'},
  {at: 15, expression: 'excited', pose: 'wave', hop: true},
  {at: 75, expression: 'neutral', pose: 'explain', look: {x: 0.6, y: 0}},
  {at: 120, expression: 'thinking', pose: 'think', look: {x: -0.4, y: -0.7}, tilt: -5},
  {at: 175, expression: 'surprised', pose: 'coin', look: {x: 0.3, y: -0.6}, tilt: 0, coin: true},
  {at: 215, expression: 'laugh', pose: 'cheer', look: {x: 0, y: 0}, hop: true},
  {at: 255, expression: 'wink', pose: 'point'},
];

const fakeTalk = (f: number) => {
  const on = (f > 20 && f < 70) || (f > 78 && f < 118) || (f > 222 && f < 252) || (f > 258 && f < 295);
  if (!on) return 0;
  return Math.min(1, Math.abs(Math.sin(f * 0.9) * 0.6 + Math.sin(f * 0.37 + 1) * 0.4 + Math.sin(f * 1.7) * 0.2) * 0.9);
};
const ENVELOPE = Array.from({length: 400}, (_, i) => fakeTalk(i));

const GRID: {label: string; expression: Expression; pose: Pose}[] = [
  {label: 'Explaining', expression: 'happy', pose: 'explain'},
  {label: 'Excited', expression: 'excited', pose: 'cheer'},
  {label: 'Surprised', expression: 'surprised', pose: 'shrug'},
  {label: 'Thinking', expression: 'thinking', pose: 'think'},
  {label: 'Worried', expression: 'worried', pose: 'facepalm'},
  {label: 'Pointing', expression: 'wink', pose: 'point'},
  {label: 'Confident', expression: 'smug', pose: 'hips'},
  {label: 'Coin flip', expression: 'laugh', pose: 'coin'},
];

export const CharacterSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill>
      <Background theme="studio" seed="sheet" t={frame / fps} />
      <div style={{position: 'absolute', top: 36, left: 70, fontFamily: FONT_DISPLAY, fontSize: 130, lineHeight: 1}}>
        <Outlined color="#F6C445" stroke="#10213F" strokeWidth={20}>
          Sterling
        </Outlined>
      </div>
      <div style={{position: 'absolute', top: 70, left: 560, fontFamily: FONT_UI, fontWeight: 800, fontSize: 40, color: '#fff', lineHeight: 1.25}}>
        Your guide to money, banks &amp; history.
        <br />
        <span style={{color: '#F6C445'}}>Flips a gold coin when the story gets good.</span>
      </div>
      <div style={{position: 'absolute', right: 60, top: 190, width: 470, height: 940}}>
        <Actor beats={SHOWCASE} frame={frame} fps={fps} envelope={ENVELOPE} seed="hero" style={{width: '100%', height: '100%'}} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 210,
          width: 1290,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          rowGap: 22,
          columnGap: 18,
        }}
      >
        {GRID.map((g, i) => (
          <div
            key={g.label}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '3px solid rgba(255,255,255,0.15)',
              borderRadius: 32,
              height: 400,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingBottom: 12,
              overflow: 'hidden',
            }}
          >
            <div style={{width: 170, height: 340}}>
              <Actor beats={[{at: -100, expression: g.expression, pose: g.pose}]} frame={frame + 200} fps={fps} seed={`grid-${i}`} style={{width: '100%', height: '100%'}} />
            </div>
            <div style={{fontFamily: FONT_UI, fontWeight: 800, fontSize: 36, color: '#fff', marginTop: 4}}>{g.label}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
