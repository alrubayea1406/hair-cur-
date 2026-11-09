import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {Background} from '../components/Background';
import {Outlined} from '../components/Outlined';
import {LeeshoActor} from '../character/LeeshoActor';
import type {Expression, Pose} from '../character/params';
import type {Episode, EpisodeProps} from '../lib/episode';
import {FONT_DISPLAY} from '../lib/fonts';

export interface ThumbSpec {
  text?: string;
  expression?: Expression;
  pose?: Pose;
  icons?: string[];
}

// Cover image for the video (render a still at frame 45 so springs have settled).
export const Thumbnail: React.FC<EpisodeProps> = ({episode}) => {
  const ep = episode as Episode & {thumbnail?: ThumbSpec};
  const {width, height} = useVideoConfig();
  const spec = ep.thumbnail ?? {};
  const vertical = height > width;
  const text = spec.text ?? ep.title ?? '';
  const icons = (spec.icons ?? []).map((n) => ep.icons[n]).filter(Boolean);
  const charW = vertical ? 900 : 560;
  return (
    <AbsoluteFill style={{direction: 'rtl'}}>
      <Background theme={ep.theme} seed={`${ep.id}-thumb`} density={16} />
      <div
        style={{
          position: 'absolute',
          top: vertical ? 150 : 60,
          left: vertical ? 50 : 40,
          right: vertical ? 50 : width * 0.42,
          textAlign: 'center',
          fontFamily: FONT_DISPLAY,
          fontSize: vertical ? 168 : 120,
          lineHeight: 1.2,
          whiteSpace: 'pre-line',
          transform: 'rotate(-3deg)',
        }}
      >
        <Outlined color="#FFD23F" stroke="#2A1650" strokeWidth={vertical ? 26 : 20}>
          {text}
        </Outlined>
      </div>
      {icons.map((svg, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: vertical ? 380 : 260,
            height: vertical ? 380 : 260,
            left: vertical ? (i === 0 ? 40 : 660) : 80 + i * 280,
            top: vertical ? 760 : 400,
            transform: `rotate(${i === 0 ? -12 : 10}deg)`,
            filter: 'drop-shadow(0 18px 0 rgba(0,0,0,0.25))',
          }}
          dangerouslySetInnerHTML={{__html: svg}}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          width: charW,
          height: charW * (570 / 400),
          left: vertical ? (width - charW) / 2 : width - charW - 30,
          top: vertical ? height - charW * (570 / 400) + 260 : 40,
        }}
      >
        <LeeshoActor
          beats={[{at: 0, expression: spec.expression ?? 'surprised', pose: spec.pose ?? 'shrug', antenna: 'question', look: {x: 0, y: -0.3}}]}
          seed={`${ep.id}-thumb`}
          style={{width: '100%', height: '100%'}}
        />
      </div>
    </AbsoluteFill>
  );
};
