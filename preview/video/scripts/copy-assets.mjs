// Copies what the film shows and plays from the game into public/, so nothing
// is committed twice: the screenshots, the app icon and the soundtrack.
//
//   node scripts/copy-assets.mjs

import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const VIDEO = join(dirname(fileURLToPath(import.meta.url)), "..");
const GAME = join(VIDEO, "..", "..");
const PUBLIC = join(VIDEO, "public");

const files = {
  "audio/music.mp3": "public/music/brotheration_records-upbeat-dub-reggae-instrumental-mars-walkin-brotheration-reggae-162354.mp3",
  "logo.svg": "public/favicon.svg",
};
for (const shot of ["game", "managers", "cattery", "boutique", "victory"]) {
  files[`screenshots/${shot}.png`] = `preview/screenshots/${shot}.png`;
}

for (const [to, from] of Object.entries(files)) {
  mkdirSync(dirname(join(PUBLIC, to)), { recursive: true });
  cpSync(join(GAME, from), join(PUBLIC, to));
}
