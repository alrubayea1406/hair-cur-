import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {Actor} from '../character/Actor';
import {Background} from '../components/Background';
import {Outlined} from '../components/Outlined';
import type {Episode, EpisodeProps} from '../lib/episode';
import {FONT_DISPLAY} from '../lib/fonts';

// Thumbnail: render a still at frame 45 so springs have settled.
export const Thumbnail: React.FC<EpisodeProps> = ({episode}) => {
  const ep = episode as Episode;
  const {width, height} = useVideoConfig();
  const vertical = height > width;
  const spec = ep.thumbnail ?? {};
  const icons = (spec.icons ?? []).map((n) => ep.icons[n]).filter(Boolean);
  const beats = [{at: 0, expression: spec.expression ?? 'surprised', pose: spec.pose ?? 'shrug', look: {x: vertical ? 0 : -0.5, y: -0.2}}];
  if (vertical) {
    return (
      <AbsoluteFill>
        <Background theme={spec.theme ?? ep.theme} seed={`${ep.id}-thumb`} density={14} />
        <div style={{position: 'absolute', top: 140, left: 50, right: 50, textAlign: 'center', fontFamily: FONT_DISPLAY, fontSize: 150, lineHeight: 1.02, whiteSpace: 'pre-line', transform: 'rotate(-3deg)', textTransform: 'uppercase'}}>
          <Outlined color="#F6C445" stroke="#0B1530" strokeWidth={22}>
            {spec.text ?? ep.title}
          </Outlined>
        </div>
        {icons.map((svg, i) => (
          <div
            key={i}
            style={{position: 'absolute', width: 330, height: 330, left: i === 0 ? 50 : 700, top: 760, transform: `rotate(${i === 0 ? -12 : 10}deg)`, filter: 'drop-shadow(0 16px 0 rgba(0,0,0,0.25))'}}
            dangerouslySetInnerHTML={{__html: svg}}
          />
        ))}
        <div style={{position: 'absolute', left: 140, top: 900, width: 800, height: 1600}}>
          <Actor beats={beats} frame={45} fps={30} seed={`${ep.id}-thumb`} style={{width: '100%', height: '100%'}} />
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <Background theme={spec.theme ?? ep.theme} seed={`${ep.id}-thumb`} density={12} />
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 40,
          width: 800,
          fontFamily: FONT_DISPLAY,
          fontSize: 118,
          lineHeight: 1.0,
          whiteSpace: 'pre-line',
          transform: 'rotate(-2deg)',
          textTransform: 'uppercase',
        }}
      >
        <Outlined color="#F6C445" stroke="#0B1530" strokeWidth={18}>
          {spec.text ?? ep.title}
        </Outlined>
      </div>
      {icons.map((svg, i) => (
        <div
          key={i}
          style={{position: 'absolute', width: 230, height: 230, left: 60 + i * 250, top: 450, transform: `rotate(${i % 2 ? 10 : -10}deg)`, filter: 'drop-shadow(0 12px 0 rgba(0,0,0,0.25))'}}
          dangerouslySetInnerHTML={{__html: svg}}
        />
      ))}
      <div style={{position: 'absolute', left: 820, top: 40, width: 420, height: 840}}>
        <Actor beats={beats} frame={45} fps={30} seed={`${ep.id}-thumb`} style={{width: '100%', height: '100%'}} />
      </div>
    </AbsoluteFill>
  );
};
