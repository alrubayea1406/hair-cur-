import React from 'react';
import {spring} from 'remotion';
import type {Word} from '../lib/episode';
import {FONT_UI} from '../lib/fonts';
import {Outlined} from './Outlined';

// Group words into short chunks, breaking after punctuation.
export const chunkWords = (words: Word[], maxWords: number, maxChars: number): Word[][] => {
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  let len = 0;
  words.forEach((w) => {
    if (cur.length && (cur.length >= maxWords || len + w.text.length > maxChars)) {
      chunks.push(cur);
      cur = [];
      len = 0;
    }
    cur.push(w);
    len += w.text.length + 1;
    if (/[?!.,:;]$/.test(w.text)) {
      chunks.push(cur);
      cur = [];
      len = 0;
    }
  });
  if (cur.length) chunks.push(cur);
  return chunks;
};

export const Captions: React.FC<{
  words: Word[];
  frame: number;
  fps: number;
  y: number;
  left: number;
  right: number;
  sceneEnd: number;
  fontSize?: number;
  maxWords?: number;
  maxChars?: number;
  uppercase?: boolean;
}> = ({words, frame, fps, y, left, right, sceneEnd, fontSize = 84, maxWords = 4, maxChars = 22, uppercase = true}) => {
  const t = frame / fps;
  const chunks = chunkWords(words, maxWords, maxChars);
  let ci = -1;
  chunks.forEach((c, i) => {
    if (c[0].start - 0.05 <= t) ci = i;
  });
  if (ci < 0) return null;
  const chunk = chunks[ci];
  const last = chunk[chunk.length - 1];
  if (t > Math.min(sceneEnd, last.end + 0.8)) return null;
  const appear = spring({frame: frame - Math.round((chunk[0].start - 0.05) * fps), fps, config: {damping: 13, stiffness: 220, mass: 0.6}});
  return (
    <div
      style={{
        position: 'absolute',
        left,
        width: right - left,
        top: y,
        transform: `translateY(-50%) scale(${0.85 + 0.15 * appear})`,
        opacity: Math.min(1, 0.45 + appear),
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: fontSize * 0.28,
        fontFamily: FONT_UI,
        fontWeight: 900,
        fontSize,
        lineHeight: 1.18,
        textTransform: uppercase ? 'uppercase' : 'none',
      }}
    >
      {chunk.map((w, i) => {
        const active = t >= w.start - 0.03 && (t < w.end + 0.08 || i === chunk.length - 1);
        const spoken = t >= w.start - 0.03;
        return (
          <Outlined
            key={i}
            color={active ? '#F6C445' : '#FFFFFF'}
            stroke="#0B1530"
            strokeWidth={fontSize * 0.17}
            style={{transform: `scale(${active ? 1.07 : 1})`, opacity: spoken ? 1 : 0.6}}
          >
            {w.text}
          </Outlined>
        );
      })}
    </div>
  );
};
