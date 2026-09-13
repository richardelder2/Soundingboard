#!/usr/bin/env node

/**
 * Soundingboard 2.0 - Chapter Break Rationale Enforcement Test
 * Acceptance test for SB2-P1-02:
 * Verifies that reindex flags any chapter missing break_rationale as incomplete (Stage 02 completeness failure).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { reindex, validateBreakRationales } from '../scripts/reindex.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing Chapter Assembly & Break Rationale Enforcement (SB2-P1-02)...');

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

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb2-break-test-'));

try {
  // Create manuscript/ with ch-01 (complete) and ch-02 (missing break_rationale)
  const msDir = path.join(tempDir, 'manuscript');
  const ch01Dir = path.join(msDir, 'ch-01');
  const ch02Dir = path.join(msDir, 'ch-02');
  fs.mkdirSync(ch01Dir, { recursive: true });
  fs.mkdirSync(ch02Dir, { recursive: true });

  // ch-01: valid scene and valid chapter with break_rationale
  fs.writeFileSync(path.join(ch01Dir, 'sc-0001.md'), `---
id: sc-0001
chapter: ch-01
pov: Elena
status: drafted
schema: 2.0
---

Scene 1 prose.
`);

  fs.writeFileSync(path.join(ch01Dir, 'chapter.md'), `---
id: ch-01
number: 1
title: Chapter One
scenes: [sc-0001]
break_rationale: >
  Ends on Elena finding the forged cipher to create high chapter-end forward pull.
status: drafted
schema: 2.0
---
`);

  // ch-02: valid scene, but chapter.md has NO break_rationale
  fs.writeFileSync(path.join(ch02Dir, 'sc-0002.md'), `---
id: sc-0002
chapter: ch-02
pov: Elena
status: drafted
schema: 2.0
---

Scene 2 prose.
`);

  fs.writeFileSync(path.join(ch02Dir, 'chapter.md'), `---
id: ch-02
number: 2
title: Chapter Two
scenes: [sc-0002]
status: drafted
schema: 2.0
---
`);

  // 1. Run reindex
  const manifest = reindex(tempDir);
  assert(manifest.chapters.length === 2, 'Reindexed both chapters');

  const ch1 = manifest.chapters.find(c => c.id === 'ch-01');
  const ch2 = manifest.chapters.find(c => c.id === 'ch-02');

  assert(ch1 && !ch1.break_rationale_missing, 'Chapter 1 has break_rationale and is not missing');
  assert(ch1 && ch1.status === 'drafted', 'Chapter 1 status is preserved as drafted');

  assert(ch2 && ch2.break_rationale_missing === true, 'Chapter 2 is flagged with break_rationale_missing: true');
  assert(ch2 && ch2.status === 'incomplete', 'Chapter 2 status is flagged as incomplete');

  // 2. Run validateBreakRationales
  const validation = validateBreakRationales(tempDir);
  assert(validation.valid === false, 'Validation reports failure for missing break_rationale');
  assert(validation.incompleteChapters.includes('ch-02'), 'Incomplete chapters list includes ch-02');
  assert(!validation.incompleteChapters.includes('ch-01'), 'Incomplete chapters list does NOT include ch-01');

  // 3. Fix Chapter 2 by adding break_rationale
  fs.writeFileSync(path.join(ch02Dir, 'chapter.md'), `---
id: ch-02
number: 2
title: Chapter Two
scenes: [sc-0002]
break_rationale: >
  Withholds the confrontation until chapter 3 to maintain atmospheric dread.
status: drafted
schema: 2.0
---
`);

  const manifestFixed = reindex(tempDir);
  const ch2Fixed = manifestFixed.chapters.find(c => c.id === 'ch-02');
  assert(ch2Fixed && !ch2Fixed.break_rationale_missing, 'Fixed Chapter 2 no longer flags break_rationale_missing');
  assert(ch2Fixed && ch2Fixed.status === 'drafted', 'Fixed Chapter 2 status restored to drafted');

  const validationFixed = validateBreakRationales(tempDir);
  assert(validationFixed.valid === true, 'Validation passes cleanly when all chapters have break_rationale');

} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

if (failed > 0) {
  console.error(`\n\x1b[31mFailed: ${failed} tests failed!\x1b[0m`);
  process.exit(1);
} else {
  console.log(`\n\x1b[32m✔ All ${passed} break_rationale enforcement tests passed successfully!\x1b[0m\n`);
}
