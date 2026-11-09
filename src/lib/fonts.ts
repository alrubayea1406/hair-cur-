import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const FONT_UI = 'Baloo Bhaijaan 2';
export const FONT_DISPLAY = 'Lalezar';

const ARABIC =
  'U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC';
const LATIN =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

let started = false;

export const ensureFonts = () => {
  if (started) return;
  started = true;
  const faces: [string, string, string, string][] = [
    [FONT_UI, 'baloo-bhaijaan-2-arabic-500-normal.woff2', '500', ARABIC],
    [FONT_UI, 'baloo-bhaijaan-2-arabic-700-normal.woff2', '700', ARABIC],
    [FONT_UI, 'baloo-bhaijaan-2-arabic-800-normal.woff2', '800', ARABIC],
    [FONT_UI, 'baloo-bhaijaan-2-latin-700-normal.woff2', '700', LATIN],
    [FONT_UI, 'baloo-bhaijaan-2-latin-800-normal.woff2', '800', LATIN],
    [FONT_DISPLAY, 'lalezar-arabic-400-normal.woff2', '400', ARABIC],
    [FONT_DISPLAY, 'lalezar-latin-400-normal.woff2', '400', LATIN],
  ];
  faces.forEach(([family, file, weight, unicodeRange]) => {
    loadFont({family, url: staticFile(`fonts/${file}`), weight, unicodeRange, format: 'woff2'}).catch((err) => {
      console.error('Font failed to load', file, err);
    });
  });
};
