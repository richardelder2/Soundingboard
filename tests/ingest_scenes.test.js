#!/usr/bin/env node

/**
 * Soundingboard 2.0 - Ingest Scene Decomposition Test
 * Acceptance test for SB2-P1-06:
 * Verifies that ingesting a multi-scene file creates clean sc-NNNN.md scene files
 * and chapter.md with byte-level text preservation.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { importManuscript } from '../scripts/importer.js';
import { strip } from '../scripts/frontmatter.js';

console.log('Testing Ingest Scene Decomposition (SB2-P1-06)...');

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✗ FAIL:\x1b[0m ${message}`);
    if (details) console.error(`    \x1b[90m${details}\x1b[0m`);
    failed++;
  }
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb2-ingest-scene-test-'));
const origCwd = process.cwd();

try {
  process.chdir(tempDir);

  // Initialize 2.0 manuscript.json
  const manifest = {
    schema_version: '2.0.0',
    unit_type: 'scene',
    title: 'Decomposition Test Novel',
    chapters: [],
    scenes: []
  };
  fs.writeFileSync(path.join(tempDir, 'manuscript.json'), JSON.stringify(manifest, null, 2));

  // Multi-scene draft file
  const scene1Prose = 'Julian stood in the cold churchyard, watching the snow drift over the mossy headstones.\nThe raven on the spire watched him in turn.';
  const scene2Prose = 'Julian pushed open the heavy oak door of the rector\'s study.\nFather Thomas looked up from his yellowed parchment, visibly startled.';

  const draftContent = `# Chapter 1: The Gathering

${scene1Prose}

***

${scene2Prose}
`;

  const draftFile = path.join(tempDir, 'raw_ch1.md');
  fs.writeFileSync(draftFile, draftContent, 'utf8');

  // Ingest manuscript
  const result = importManuscript(draftFile);
  assert(result.success === true, 'Ingest executes successfully');

  // Verify manuscript/ch-01 exists
  const ch01Dir = path.join(tempDir, 'manuscript', 'ch-01');
  assert(fs.existsSync(ch01Dir), 'Created manuscript/ch-01 directory');

  // Verify chapter.md
  const chMdPath = path.join(ch01Dir, 'chapter.md');
  assert(fs.existsSync(chMdPath), 'Created manuscript/ch-01/chapter.md');
  const chMd = fs.readFileSync(chMdPath, 'utf8');
  assert(chMd.includes('scenes: [sc-0001, sc-0002]'), 'chapter.md lists both decomposed scenes');
  assert(chMd.includes('break_rationale:'), 'chapter.md includes break_rationale');

  // Verify sc-0001.md and sc-0002.md
  const sc1Path = path.join(ch01Dir, 'sc-0001.md');
  const sc2Path = path.join(ch01Dir, 'sc-0002.md');
  assert(fs.existsSync(sc1Path) && fs.existsSync(sc2Path), 'Both sc-0001.md and sc-0002.md created');

  // Byte-level prose fidelity check
  const sc1Body = strip(fs.readFileSync(sc1Path, 'utf8')).trim();
  const sc2Body = strip(fs.readFileSync(sc2Path, 'utf8')).trim();

  assert(sc1Body === scene1Prose.trim(), 'Scene 1 prose matches original segment exactly');
  assert(sc2Body === scene2Prose.trim(), 'Scene 2 prose matches original segment exactly');

  // Verify threads.md has spine
  const threadsPath = path.join(tempDir, 'stages', '02_planning', 'output', 'threads.md');
  assert(fs.existsSync(threadsPath), 'Spine thread created at stages/02_planning/output/threads.md');

  // Verify manuscript.json updated
  const updatedManifest = JSON.parse(fs.readFileSync(path.join(tempDir, 'manuscript.json'), 'utf8'));
  assert(updatedManifest.scenes && updatedManifest.scenes.length === 2, 'manuscript.json indexed both scenes');
  assert(updatedManifest.chapters && updatedManifest.chapters.length === 1, 'manuscript.json indexed chapter');

} finally {
  process.chdir(origCwd);
  fs.rmSync(tempDir, { recursive: true, force: true });
}

if (failed > 0) {
  console.error(`\n\x1b[31mFailed: ${failed} tests failed!\x1b[0m`);
  process.exit(1);
} else {
  console.log(`\n\x1b[32m✔ All ${passed} ingest scene decomposition tests passed successfully!\x1b[0m\n`);
}
