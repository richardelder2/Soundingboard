#!/usr/bin/env node

/**
 * Soundingboard 2.0 - Obligatory Scene Ledger Mapping Test
 * Acceptance test for SB2-P1-05:
 * Verifies that Stage 02 validation requires obligatory trope scenes in structure_plan.md
 * to be mapped to atomic scene IDs (sc-NNNN) rather than chapter numbers.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { validateObligatoryScenes } from '../scripts/structure_validator.js';

console.log('Testing Obligatory Scene Ledger Mapping to Scene IDs (SB2-P1-05)...');

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

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb2-structure-test-'));

try {
  const planDir = path.join(tempDir, 'stages', '02_planning', 'output');
  fs.mkdirSync(planDir, { recursive: true });
  const planFile = path.join(planDir, 'structure_plan.md');

  // 1. Invalid structure plan: uses legacy chapter numbers or empty assignments
  fs.writeFileSync(planFile, `# Structure Plan

## 1. Obligatory-scene ledger (reader contract — beats here are untouchable)
| # | Promised beat (from genre bible / trope stack) | Bible position | Scheduled scene ID | Delivered |
|---|---|---|---|---|
| 1 | Discovery of the Body | ~5% | sc-0002 | ☐ |
| 2 | Lovers' First Meeting | ~20% | ch. 4 | ☐ |
| 3 | The Darkest Secret Exposed | ~75% | | ☐ |

## 2. Subplot map
`);

  const resInvalid = validateObligatoryScenes(tempDir);
  assert(resInvalid.valid === false, 'Validation fails when obligatory beats lack sc-NNNN IDs');
  assert(resInvalid.totalBeats === 3, 'Accurately detected 3 obligatory beats');
  assert(resInvalid.mappedCount === 1, 'Only 1 beat mapped cleanly to sc-0002');
  assert(resInvalid.unmappedBeats.length === 2, 'Flags exactly 2 unmapped beats');
  assert(resInvalid.errors.some(e => e.includes('Lovers\' First Meeting')), 'Error names Lovers\' First Meeting due to chapter number');
  assert(resInvalid.errors.some(e => e.includes('The Darkest Secret Exposed')), 'Error names The Darkest Secret Exposed due to empty cell');

  // 2. Fix structure plan with explicit sc-NNNN assignments
  fs.writeFileSync(planFile, `# Structure Plan

## 1. Obligatory-scene ledger (reader contract — beats here are untouchable)
| # | Promised beat (from genre bible / trope stack) | Bible position | Scheduled scene ID | Delivered |
|---|---|---|---|---|
| 1 | Discovery of the Body | ~5% | sc-0002 | ☐ |
| 2 | Lovers' First Meeting | ~20% | sc-0008 | ☐ |
| 3 | The Darkest Secret Exposed | ~75% | sc-0034 | ☐ |

## 2. Subplot map
`);

  const resValid = validateObligatoryScenes(tempDir);
  assert(resValid.valid === true, 'Validation passes cleanly when all obligatory beats have sc-NNNN IDs');
  assert(resValid.mappedCount === 3, 'All 3 beats mapped successfully');
  assert(resValid.unmappedBeats.length === 0, 'Zero unmapped beats remaining');

} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

if (failed > 0) {
  console.error(`\n\x1b[31mFailed: ${failed} tests failed!\x1b[0m`);
  process.exit(1);
} else {
  console.log(`\n\x1b[32m✔ All ${passed} structure validator tests passed successfully!\x1b[0m\n`);
}
