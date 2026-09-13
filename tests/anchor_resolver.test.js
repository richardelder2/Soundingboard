#!/usr/bin/env node

/**
 * Soundingboard 2.0 - Same-POV Anchor Resolution Engine Regression Test
 * Acceptance test for SB2-P1-04:
 * Verifies that a scene opening in POV B after a scene closing in POV A anchors to
 * an earlier POV B scene, NOT the trailing words of the preceding POV A scene.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { resolveVoiceAnchor } from '../scripts/anchor_resolver.js';

console.log('Testing Same-POV Anchor Resolution Engine (SB2-P1-04)...');

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

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb2-anchor-test-'));

try {
  const msDir = path.join(tempDir, 'manuscript');
  const ch01Dir = path.join(msDir, 'ch-01');
  const ch02Dir = path.join(msDir, 'ch-02');
  fs.mkdirSync(ch01Dir, { recursive: true });
  fs.mkdirSync(ch02Dir, { recursive: true });

  // Scene 1: POV Julian (Ch 1)
  fs.writeFileSync(path.join(ch01Dir, 'sc-0001.md'), `---
id: sc-0001
chapter: ch-01
pov: Julian
status: drafted
schema: 2.0
---

Julian adjusted his spectacles and peered into the darkness of the London vaults.
The bronze key felt heavy in his wool coat pocket. Julian knew the clock was ticking.
`);

  // Scene 2: POV Evelyn (Ch 1)
  fs.writeFileSync(path.join(ch01Dir, 'sc-0002.md'), `---
id: sc-0002
chapter: ch-01
pov: Evelyn
status: drafted
schema: 2.0
---

Evelyn gripped the hilt of her rapier as the carriage jolted over cobblestones.
Her pulse raced with the fury of a betrayed duchess. Evelyn swore vengeance.
`);

  // Scene 3: POV Julian (Ch 2) - closes Chapter 1 / precedes Chapter 2
  fs.writeFileSync(path.join(ch01Dir, 'sc-0003.md'), `---
id: sc-0003
chapter: ch-01
pov: Julian
status: drafted
schema: 2.0
---

Julian struck a sulfur match against the granite wall.
The sulfur smell filled Julian's lungs as the flame guttered in the subterranean draft.
`);

  // Scene 4: POV Evelyn (Ch 2 opening) - Target scene to be drafted!
  fs.writeFileSync(path.join(ch02Dir, 'sc-0004.md'), `---
id: sc-0004
chapter: ch-02
pov: Evelyn
status: planned
schema: 2.0
---
`);

  // Scene 5: POV Marcus (Ch 2) - Brand new character, no prior scene in Marcus POV!
  fs.writeFileSync(path.join(ch02Dir, 'sc-0005.md'), `---
id: sc-0005
chapter: ch-02
pov: Marcus
status: planned
schema: 2.0
---
`);

  // Setup Stage 01 voice sample
  const s01Dir = path.join(tempDir, 'stages', '01_onboarding', 'output');
  fs.mkdirSync(s01Dir, { recursive: true });
  fs.writeFileSync(path.join(s01Dir, 'voice_sample.md'), `---
type: VoiceSample
---

The baseline narrative voice was crisp, dry, and laden with atmospheric irony.
`);

  // Write manuscript.json
  const manifest = {
    schema_version: '2.0.0',
    unit_type: 'scene',
    chapters: [
      { id: 'ch-01', number: 1, title: 'Vaults', scenes: ['sc-0001', 'sc-0002', 'sc-0003'], break_rationale: 'Break after match strike', status: 'drafted', schema: '2.0' },
      { id: 'ch-02', number: 2, title: 'Infiltration', scenes: ['sc-0004', 'sc-0005'], break_rationale: 'Break at sunrise', status: 'planned', schema: '2.0' }
    ],
    scenes: [
      { id: 'sc-0001', chapter: 'ch-01', file: 'manuscript/ch-01/sc-0001.md', pov: 'Julian', word_count: 30, status: 'drafted' },
      { id: 'sc-0002', chapter: 'ch-01', file: 'manuscript/ch-01/sc-0002.md', pov: 'Evelyn', word_count: 28, status: 'drafted' },
      { id: 'sc-0003', chapter: 'ch-01', file: 'manuscript/ch-01/sc-0003.md', pov: 'Julian', word_count: 27, status: 'drafted' },
      { id: 'sc-0004', chapter: 'ch-02', file: 'manuscript/ch-02/sc-0004.md', pov: 'Evelyn', word_count: 0, status: 'planned' },
      { id: 'sc-0005', chapter: 'ch-02', file: 'manuscript/ch-02/sc-0005.md', pov: 'Marcus', word_count: 0, status: 'planned' }
    ]
  };
  fs.writeFileSync(path.join(tempDir, 'manuscript.json'), JSON.stringify(manifest, null, 2));

  // 1. Core Regression: Scene 4 is Evelyn. Immediately preceding scene is Scene 3 (Julian).
  // Same-POV anchor resolution must walk back to Scene 2 (Evelyn), NOT Scene 3 (Julian)!
  const resEvelyn = resolveVoiceAnchor('sc-0004', tempDir);
  assert(resEvelyn.anchorSceneId === 'sc-0002', 'Evelyn scene sc-0004 anchors to earlier Evelyn scene sc-0002');
  assert(resEvelyn.anchorProvisional === false, 'Same-POV anchor is not provisional');
  assert(resEvelyn.source === 'same_pov_scene', 'Source is same_pov_scene');
  assert(resEvelyn.prose.includes('rapier') && resEvelyn.prose.includes('Evelyn swore vengeance'), 'Prose is from Evelyn scene');
  assert(!resEvelyn.prose.includes('sulfur match'), 'Prose does NOT contain Julian trailing words');

  // 2. First-time POV fallback: Scene 5 is Marcus (no prior Marcus scene).
  // Must fall back to Stage 01 voice sample with anchorProvisional: true
  const resMarcus = resolveVoiceAnchor('sc-0005', tempDir);
  assert(resMarcus.anchorSceneId === null, 'First scene in Marcus POV has null anchorSceneId');
  assert(resMarcus.anchorProvisional === true, 'First scene in Marcus POV has anchorProvisional: true');
  assert(resMarcus.source === 'stage01_sample', 'Source is stage01_sample');
  assert(resMarcus.prose.includes('crisp, dry, and laden with atmospheric irony'), 'Prose is Stage 01 voice sample');

  // 3. Shifting / Disabled POV anchoring: forceSequential option
  // Should anchor to immediately preceding drafted scene (Scene 3 - Julian), regardless of POV
  const resSequential = resolveVoiceAnchor('sc-0004', tempDir, { forceSequential: true });
  assert(resSequential.anchorSceneId === 'sc-0003', 'Sequential override anchors to immediately preceding scene sc-0003');
  assert(resSequential.source === 'preceding_scene', 'Source is preceding_scene');
  assert(resSequential.prose.includes('sulfur match'), 'Prose contains preceding scene trailing words');

} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

if (failed > 0) {
  console.error(`\n\x1b[31mFailed: ${failed} tests failed!\x1b[0m`);
  process.exit(1);
} else {
  console.log(`\n\x1b[32m✔ All ${passed} anchor resolution regression tests passed successfully!\x1b[0m\n`);
}
