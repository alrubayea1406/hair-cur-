import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Actor} from '../character/Actor';
import {Background} from '../components/Background';
import {Outlined} from '../components/Outlined';
import {FONT_DISPLAY, FONT_UI} from '../lib/fonts';

export const CHANNEL_NAME = 'Sterling Explains';
export const CHANNEL_TAGLINE = 'Money, banks & history — explained.';

// 800x800 profile picture (YouTube crops it to a circle).
export const ChannelAvatar: React.FC = () => (
  <AbsoluteFill>
    <Background theme="studio" seed="avatar" density={8} />
    <div style={{position: 'absolute', width: 900, height: 1800, left: -50, top: -20}}>
      <Actor beats={[{at: 0, expression: 'happy', pose: 'idle'}]} frame={40} fps={30} seed="avatar" style={{width: '100%', height: '100%'}} />
    </div>
  </AbsoluteFill>
);

// 2560x1440 banner. Everything important stays inside the 1546x423 safe area in the middle.
export const ChannelBanner: React.FC = () => (
  <AbsoluteFill>
    <Background theme="studio" seed="banner" density={34} />
    <div style={{position: 'absolute', left: 507, top: 508, width: 1546, height: 423, display: 'flex', alignItems: 'center', gap: 40}}>
      <div style={{width: 420, height: 423, overflow: 'hidden', position: 'relative', flexShrink: 0}}>
        <div style={{position: 'absolute', left: 20, top: 8, width: 380, height: 760}}>
          <Actor beats={[{at: 0, expression: 'excited', pose: 'wave'}]} frame={40} fps={30} seed="banner" style={{width: '100%', height: '100%'}} />
        </div>
      </div>
      <div>
        <div style={{fontFamily: FONT_DISPLAY, fontSize: 150, lineHeight: 0.98, textTransform: 'uppercase'}}>
          <Outlined color="#F6C445" stroke="#0B1530" strokeWidth={22}>
            Sterling
          </Outlined>
          <br />
          <Outlined color="#F6C445" stroke="#0B1530" strokeWidth={22}>
            Explains
          </Outlined>
        </div>
        <div style={{fontFamily: FONT_UI, fontWeight: 900, fontSize: 52, marginTop: 10, whiteSpace: 'nowrap'}}>
          <Outlined color="#fff" stroke="#0B1530" strokeWidth={11}>
            {CHANNEL_TAGLINE}
          </Outlined>
        </div>
      </div>
    </div>
  </AbsoluteFill>
);
