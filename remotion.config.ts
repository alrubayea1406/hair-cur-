import {Config} from '@remotion/cli/config';
import {existsSync} from 'node:fs';

// Use the Chromium that is already installed on this machine (no download needed).
const HEADLESS_SHELL =
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
if (existsSync(HEADLESS_SHELL)) {
  Config.setBrowserExecutable(HEADLESS_SHELL);
}

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
