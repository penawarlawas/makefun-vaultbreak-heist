// Vaultbreak hand-in script for Node 22 (standard library only).
// The deliverable is the static game under game/: game/index.html plus its
// ES modules, drawn with canvas 2D and loaded without a build or any network.
// Running this script stages game/ and screenshots/ into MAKEFUN_OUTPUT_DIR
// (which stands in for /output outside the judge) and writes dossier.json,
// the summary produced by the bundled make.fun helper.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//   node serve.ts   # then open http://localhost:8080

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// game/ is mandatory; screenshots/ is optional but always present in the
// output tree so the dossier builder can find it.
function stage(name: string, required: boolean): void {
  const source = join(projectRoot, name);
  const target = join(outputDir, name);
  if (name === 'screenshots') mkdirSync(target, { recursive: true });
  if (required || existsSync(source)) cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
stage('game', true);
stage('screenshots', false);

// Judge limits from reference/gate.json. text_max_bytes is the only one that
// shapes dossier bytes; the rest reject an entry the scorer would reject.
const submissionLimits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, submissionLimits));
