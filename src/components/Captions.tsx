import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Word} from '../lib/episode';
import {FONT_UI} from '../lib/fonts';
import {Outlined} from './Outlined';

const MAX_WORDS = 4;
const MAX_CHARS = 22;

// Group words into short chunks (Shorts style), breaking after punctuation.
export const chunkWords = (words: Word[]): Word[][] => {
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  let len = 0;
  words.forEach((w) => {
    if (cur.length && (cur.length >= MAX_WORDS || len + w.text.length > MAX_CHARS)) {
      chunks.push(cur);
      cur = [];
      len = 0;
    }
    cur.push(w);
    len += w.text.length + 1;
    if (/[؟?!.،,:؛]$/.test(w.text)) {
      chunks.push(cur);
      cur = [];
      len = 0;
    }
  });
  if (cur.length) chunks.push(cur);
  return chunks;
};

export const Captions: React.FC<{words: Word[]; y: number; sceneEnd: number}> = ({words, y, sceneEnd}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const chunks = chunkWords(words);
  let ci = -1;
  chunks.forEach((c, i) => {
    if (c[0].start - 0.05 <= t) ci = i;
  });
  if (ci < 0) return null;
  const chunk = chunks[ci];
  const last = chunk[chunk.length - 1];
  // hide the last chunk of a scene a moment after it is spoken
  if (t > Math.min(sceneEnd, last.end + 0.8)) return null;
  const appear = spring({frame: frame - Math.round((chunk[0].start - 0.05) * fps), fps, config: {damping: 13, stiffness: 220, mass: 0.6}});
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top: y,
        transform: `translateY(-50%) scale(${0.82 + 0.18 * appear})`,
        opacity: Math.min(1, 0.45 + appear),
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        direction: 'rtl',
        columnGap: 22,
        rowGap: 0,
        fontFamily: FONT_UI,
        fontWeight: 800,
        fontSize: 92,
        lineHeight: 1.3,
      }}
    >
      {chunk.map((w, i) => {
        const active = t >= w.start - 0.03 && (t < w.end + 0.08 || i === chunk.length - 1);
        const spoken = t >= w.start - 0.03;
        return (
          <Outlined
            key={i}
            color={active ? '#FFD23F' : '#FFFFFF'}
            strokeWidth={16}
            style={{transform: `scale(${active ? 1.08 : 1})`, opacity: spoken ? 1 : 0.55}}
          >
            {w.text}
          </Outlined>
        );
      })}
    </div>
  );
};
