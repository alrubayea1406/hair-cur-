import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const FONT_UI = 'Montserrat';
export const FONT_DISPLAY = 'Lalezar';

let started = false;

export const ensureFonts = () => {
  if (started) return;
  started = true;
  const faces: [string, string, string][] = [
    [FONT_UI, 'montserrat-latin-700-normal.woff2', '700'],
    [FONT_UI, 'montserrat-latin-800-normal.woff2', '800'],
    [FONT_UI, 'montserrat-latin-900-normal.woff2', '900'],
    [FONT_DISPLAY, 'lalezar-latin-400-normal.woff2', '400'],
  ];
  faces.forEach(([family, file, weight]) => {
    loadFont({family, url: staticFile(`fonts/${file}`), weight, format: 'woff2'}).catch((err) => {
      console.error('Font failed to load', file, err);
    });
  });
};
