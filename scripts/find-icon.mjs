// Search the Fluent Emoji Flat icon names (MIT licensed) by keyword:  node scripts/find-icon.mjs onion knife eye
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const set = require('@iconify-json/fluent-emoji-flat/icons.json');
const names = [...Object.keys(set.icons), ...Object.keys(set.aliases || {})];
for (const q of process.argv.slice(2)) {
  const hits = names.filter((n) => n.includes(q.toLowerCase()) && !/-(light|medium|dark|medium-light|medium-dark)$/.test(n));
  console.log(`${q}: ${hits.slice(0, 25).join('  ') || '(none)'}`);
}
