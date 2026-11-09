import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Background} from '../components/Background';
import {Outlined} from '../components/Outlined';
import {LeeshoActor} from '../character/LeeshoActor';
import {FONT_DISPLAY, FONT_UI} from '../lib/fonts';

const ASPECT = 570 / 400;

// 800x800 profile picture (YouTube crops it to a circle).
export const ChannelAvatar: React.FC = () => {
  const h = 1060;
  const w = h / ASPECT;
  return (
    <AbsoluteFill>
      <Background theme="night" seed="avatar" density={8} />
      <div style={{position: 'absolute', width: w, height: h, left: (800 - w) / 2, top: -105}}>
        <LeeshoActor beats={[{at: 0, expression: 'happy', pose: 'idle'}]} seed="avatar" style={{width: '100%', height: '100%'}} />
      </div>
    </AbsoluteFill>
  );
};

// 2560x1440 banner. Everything important stays inside the 1546x423 safe area in the middle.
export const ChannelBanner: React.FC = () => {
  const h = 560;
  const w = h / ASPECT;
  return (
    <AbsoluteFill style={{direction: 'rtl'}}>
      <Background theme="night" seed="banner" density={30} />
      <div
        style={{
          position: 'absolute',
          left: 507,
          top: 508,
          width: 1546,
          height: 423,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: 40}}>
          <div style={{fontFamily: FONT_DISPLAY, fontSize: 210, lineHeight: 1}}>
            <Outlined color="#FFD23F" stroke="#2A1650" strokeWidth={26}>
              ليشو
            </Outlined>
          </div>
          <div style={{fontFamily: FONT_UI, fontWeight: 800, fontSize: 70, marginTop: 10}}>
            <Outlined color="#FFFFFF" stroke="#2A1650" strokeWidth={14}>
              كل يوم سؤال «ليش؟» وجوابه
            </Outlined>
          </div>
        </div>
        <div style={{width: w, height: h, marginLeft: 60, marginTop: 40}}>
          <LeeshoActor beats={[{at: 0, expression: 'excited', pose: 'wave', antenna: 'idea'}]} seed="banner" style={{width: '100%', height: '100%'}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
