#!/usr/bin/env node

/**
 * Soundingboard 2.0 - Scene-Scoped Drafting Packet Test
 * Acceptance test for SB2-P1-03:
 * Verifies that pack-scene assembles a trimmed drafting kit (<= 6,000 tokens)
 * with target scene card, same-POV voice anchor, spoiler-guarded canon, and targeted craft cards.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

console.log('Testing Scene-Scoped Drafting Packet (SB2-P1-03)...');

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

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb2-pack-scene-test-'));

try {
  const msDir = path.join(tempDir, 'manuscript');
  const ch01Dir = path.join(msDir, 'ch-01');
  const ch02Dir = path.join(msDir, 'ch-02');
  fs.mkdirSync(ch01Dir, { recursive: true });
  fs.mkdirSync(ch02Dir, { recursive: true });

  // Scene 1: POV Julian, drafted
  fs.writeFileSync(path.join(ch01Dir, 'sc-0001.md'), `---
id: sc-0001
chapter: ch-01
pov: Julian
status: drafted
schema: 2.0
---

Julian examined the ancient Bronze Key on the stone table.
`);

  // Scene 2: POV Evelyn, drafted
  fs.writeFileSync(path.join(ch01Dir, 'sc-0002.md'), `---
id: sc-0002
chapter: ch-01
pov: Evelyn
status: drafted
schema: 2.0
---

Evelyn watched the mist gather above the rooftops of Whitechapel.
`);

  // Scene 3: Target scene in POV Julian, planned
  fs.writeFileSync(path.join(ch02Dir, 'sc-0003.md'), `---
id: sc-0003
chapter: ch-02
pov: Julian
location: The Catacombs, Midnight
value_in: Trust (+)
value_out: Suspicion (-)
commandments:
  inciting_incident: The crypt door groans open
  progressive_complication: The lock has been picked from the inside
  crisis: Confront the shadow or retreat to the gate
  climax: Julian steps through the iron archway
  resolution: The lantern flame dies
voice_anchor: sc-0001
anchor_provisional: false
craft_modules: [scene_level_five_commandments_coyne]
threads: [th-01]
status: planned
schema: 2.0
---

# Scene sc-0003 — The Vault Opening

## Scene Engine (Coyne 5 Commandments)
- **Inciting incident:** The crypt door groans open
- **Turning point:** The lock has been picked from the inside
- **Crisis:** Confront the shadow or retreat to the gate
- **Climax:** Julian steps through the iron archway
- **Resolution:** The lantern flame dies

## Content
- **Goal / Conflict / Disaster:** Unlock the inner sanctuary using the [Bronze Key](item).
- **Characters on stage:** [Julian](character), [The Shadow](suspect).
`);

  // Setup Canon with active entity and future mystery spoiler
  const canonDir = path.join(tempDir, 'stages', '02_planning', 'output');
  fs.mkdirSync(canonDir, { recursive: true });
  fs.writeFileSync(path.join(canonDir, 'canon.md'), `---
type: Canon
book: "The Silent Vault"
schema: 2.0
---

# Canon — established facts ledger

## World Rules & Mechanics
| Entity | Constraint / Cost | Mechanic Description | Established In | Reader Known As Of | Epistemic Status | Status |
|---|---|---|---|---|---|---|
| Magic Crypt Wards | Silver blood required | Cannot be opened by daylight | sc-0001 | sc-0001 | established | verified |

## Entity Ledger
| Entity | Attribute | Value | Established In | Reader Known As Of | Epistemic Status | Status |
|---|---|---|---|---|---|---|
| Bronze Key | Material | Cast from meteoric iron | sc-0001 | sc-0001 | established | verified |
| Julian | Status | Disgraced scholar of Oxford | sc-0001 | sc-0001 | established | verified |
| The Shadow | True Identity | The Bishop of Southwark | sc-0001 | sc-0010 | believed | verified |
`);

  // Write manuscript.json
  const manifest = {
    schema_version: '2.0.0',
    unit_type: 'scene',
    chapters: [
      { id: 'ch-01', number: 1, title: 'Vaults', scenes: ['sc-0001', 'sc-0002'], break_rationale: 'Cliffhanger at carriage', status: 'drafted', schema: '2.0' },
      { id: 'ch-02', number: 2, title: 'Infiltration', scenes: ['sc-0003'], break_rationale: 'Darkness in crypt', status: 'planned', schema: '2.0' }
    ],
    scenes: [
      { id: 'sc-0001', chapter: 'ch-01', file: 'manuscript/ch-01/sc-0001.md', pov: 'Julian', word_count: 50, status: 'drafted' },
      { id: 'sc-0002', chapter: 'ch-01', file: 'manuscript/ch-01/sc-0002.md', pov: 'Evelyn', word_count: 45, status: 'drafted' },
      { id: 'sc-0003', chapter: 'ch-02', file: 'manuscript/ch-02/sc-0003.md', pov: 'Julian', word_count: 0, status: 'planned' }
    ]
  };
  fs.writeFileSync(path.join(tempDir, 'manuscript.json'), JSON.stringify(manifest, null, 2));

  // Copy scripts and _config for testing
  const packScript = path.join(rootDir, 'scripts', 'pack-scene.js');
  const out = execSync(`node "${packScript}" sc-0003`, { cwd: tempDir, encoding: 'utf8' });

  // 1. Verify packet structure
  assert(out.includes('SCENE CARD (SC-0003)'), 'Packet contains Scene Card section');
  assert(out.includes('The crypt door groans open'), 'Packet includes 5 commandments intent');

  // 2. Verify Same-POV Voice Anchor (anchors to sc-0001 Julian, NOT sc-0002 Evelyn)
  assert(out.includes('sc-0001'), 'Voice anchor resolved to same-POV Julian scene sc-0001');
  assert(out.includes('Julian examined the ancient Bronze Key'), 'Voice anchor contains Julian prose');
  assert(!out.includes('Evelyn watched the mist gather'), 'Voice anchor does NOT contain Evelyn prose');

  // 3. Verify Matched Canon Facts
  assert(out.includes('Bronze Key'), 'Matched canon includes Bronze Key');
  assert(out.includes('Magic Crypt Wards'), 'Matched canon includes World Rule');

  // 4. Verify Spoiler Guard: The Shadow identity is known as of sc-0010 (> sc-0003) -> must be withheld!
  assert(!out.includes('The Bishop of Southwark'), 'Spoiler guard successfully suppressed future fact (The Bishop of Southwark)');
  assert(out.includes('withheld by Spoiler Guard'), 'Packet explicitly notes withheld facts count');

  // 5. Verify Token discipline
  const estMatch = out.match(/~(\d+) tokens/);
  const tokenEst = estMatch ? parseInt(estMatch[1], 10) : Math.ceil(out.length / 4);
  assert(tokenEst <= 6000, `Packet stays strictly within token budget (actual: ~${tokenEst} tokens <= 6,000)`);

} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

if (failed > 0) {
  console.error(`\n\x1b[31mFailed: ${failed} tests failed!\x1b[0m`);
  process.exit(1);
} else {
  console.log(`\n\x1b[32m✔ All ${passed} pack-scene tests passed successfully!\x1b[0m\n`);
}
