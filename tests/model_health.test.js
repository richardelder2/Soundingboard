/**
 * Soundingboard 2.0 - Model Health Console Test Suite (SB2-P3-04)
 */

import { strict as assert } from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { assessModelHealth, formatModelHealthTerminal, formatModelHealthMarkdown } from '../scripts/model_health.js';
import { hashContent } from '../scripts/hash_staleness.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testTmpDir = path.join(__dirname, 'fixtures', 'tmp_model_health_test');

function cleanup() {
  if (fs.existsSync(testTmpDir)) {
    fs.rmSync(testTmpDir, { recursive: true, force: true });
  }
}

export function runModelHealthTests() {
  console.log('\n--- Running Model Health Console Test Suite (SB2-P3-04) ---');
  cleanup();
  fs.mkdirSync(testTmpDir, { recursive: true });

  try {
    // Test 1: Uninitialized workspace
    const emptyHealth = assessModelHealth(testTmpDir);
    assert.equal(emptyHealth.schema, 'uninitialized', 'Empty directory returns uninitialized schema');
    assert.equal(emptyHealth.manuscriptPresent, false, 'Reports manuscriptPresent as false');
    assert.equal(emptyHealth.summary.status, 'HEALTHY', 'Empty workspace reports HEALTHY');

    // Test 2: Build a full 2.0 workspace with intentional health conditions
    // ch-01: complete with authored break rationale
    // ch-02: missing break rationale
    // sc-0001: drafted, complete value shifts, stable voice anchor, bound to th-01
    // sc-0002: drafted, null value shifts (missing value_in), bound to th-01
    // sc-0003: undrafted (0 words), complete value shifts, provisional voice anchor, ORPHAN (no threads)
    const msDir = path.join(testTmpDir, 'manuscript');
    const ch1Dir = path.join(msDir, 'ch-01');
    const ch2Dir = path.join(msDir, 'ch-02');
    fs.mkdirSync(ch1Dir, { recursive: true });
    fs.mkdirSync(ch2Dir, { recursive: true });

    // ch-01 chapter.md
    fs.writeFileSync(path.join(ch1Dir, 'chapter.md'), `---
id: ch-01
number: 1
title: The Cold Open
scenes: [sc-0001, sc-0002]
break_rationale: "Ends on cliffhanger before the vault door opens."
status: drafted
schema: 2.0
---
`);

    // ch-02 chapter.md (missing break rationale)
    fs.writeFileSync(path.join(ch2Dir, 'chapter.md'), `---
id: ch-02
number: 2
title: Inside the Vault
scenes: [sc-0003]
break_rationale: ""
status: planned
schema: 2.0
---
`);

    // sc-0001
    fs.writeFileSync(path.join(ch1Dir, 'sc-0001.md'), `---
id: sc-0001
chapter: ch-01
pov: Elena
value_in: Trust (+)
value_out: Betrayal (--)
voice_anchor: sc-0000
anchor_provisional: false
threads: [th-01]
schema: 2.0
---

Elena pushed open the brass gates with cautious hands. The corridor was silent.
`);

    // sc-0002 (null value shift: missing value_in)
    fs.writeFileSync(path.join(ch1Dir, 'sc-0002.md'), `---
id: sc-0002
chapter: ch-01
pov: Elena
value_out: Betrayal (--)
voice_anchor: sc-0001
anchor_provisional: false
threads: [th-01]
schema: 2.0
---

The locks clicked one by one, echoing in the cold dark.
`);

    // sc-0003 (undrafted, provisional anchor, orphaned - no threads)
    fs.writeFileSync(path.join(ch2Dir, 'sc-0003.md'), `---
id: sc-0003
chapter: ch-02
pov: Marcus
value_in: Hope (+)
value_out: Despair (--)
voice_anchor: sc-0001
anchor_provisional: true
schema: 2.0
---
`);

    // Add thread tracker
    const trackersDir = path.join(testTmpDir, 'stages', '02_planning', 'output', 'trackers');
    fs.mkdirSync(trackersDir, { recursive: true });
    fs.writeFileSync(path.join(trackersDir, 'threads.md'), `---
dormancy_threshold_words: 5000
---

| Thread ID | Spine | Name | Status |
|---|---|---|---|
| th-01 | Yes | Main Spine | open |
`);

    // Add canon with 1 unverified fact
    const canonDir = path.join(testTmpDir, 'stages', '02_planning', 'output');
    fs.writeFileSync(path.join(canonDir, 'canon.md'), `# Project Canon
- Elena: Former operative [unverified ch01]
- The Archive: Subterranean vault
`);

    // Add a verdict file with stale finding
    const verdictsDir = path.join(testTmpDir, 'stages', '04_diagnostics_edits', 'output', 'verdicts');
    fs.mkdirSync(verdictsDir, { recursive: true });
    fs.writeFileSync(path.join(verdictsDir, 'scan_sc-0001.json'), JSON.stringify({
      scene_id: 'sc-0001',
      computed_against: {
        'sc-0001': 'outdated_hash_1234567890abcdef'
      }
    }));

    // Assess the model health
    const health = assessModelHealth(testTmpDir);

    // Assertions
    assert.equal(health.schema, '2.0', 'Correctly detects schema 2.0');
    assert.equal(health.is20, true, 'is20 flag is true');
    assert.equal(health.manuscriptPresent, true, 'manuscriptPresent is true');

    // Chapters
    assert.equal(health.chapters.total, 2, 'Detects 2 chapters');
    assert.deepEqual(health.chapters.missingRationale, ['ch-02'], 'Detects ch-02 missing break rationale');

    // Scenes
    assert.equal(health.scenes.total, 3, 'Detects 3 scenes total');
    assert.equal(health.scenes.drafted, 2, 'Detects 2 drafted scenes (sc-0001, sc-0002)');
    assert.equal(health.scenes.undrafted, 1, 'Detects 1 undrafted scene (sc-0003)');

    // Value Shifts
    assert.deepEqual(health.scenes.nullValueShifts, ['sc-0002'], 'Detects sc-0002 has null value shift');

    // Provisional Voice Anchors
    assert.deepEqual(health.scenes.provisionalAnchors, ['sc-0003'], 'Detects sc-0003 has provisional voice anchor');

    // Staleness
    assert.equal(health.findings.totalEvaluated, 1, 'Evaluated 1 finding');
    assert.equal(health.findings.stale.length, 1, 'Detects 1 stale finding');

    // Thread Diagnostics & Orphan Guard
    assert.equal(health.threads.tracked, 1, 'Tracks 1 thread');
    assert.deepEqual(health.threads.orphanedScenes, ['sc-0003'], 'Orphan Guard catches sc-0003 with 0 threads');

    // Canon Integrity
    assert.equal(health.canon.unverifiedCount, 1, 'Detects 1 unverified canon fact');

    // Overall Health Status
    assert.equal(health.summary.status, 'DEGRADED', 'Orphan Guard violation degrades health status');

    // Test Terminal Formatter
    const terminalOut = formatModelHealthTerminal(health);
    assert(terminalOut.includes('Soundingboard 2.0 Model Health Console'), 'Terminal output includes header');
    assert(terminalOut.includes('DEGRADED'), 'Terminal output includes status');
    assert(terminalOut.includes('sc-0002'), 'Terminal output flags null shift in sc-0002');
    assert(terminalOut.includes('ch-02'), 'Terminal output flags missing rationale in ch-02');
    assert(terminalOut.includes('sc-0003'), 'Terminal output flags orphan in sc-0003');

    // Test Markdown Formatter
    const mdOut = formatModelHealthMarkdown(health);
    assert(mdOut.includes('## Soundingboard 2.0 Model Health Summary'), 'Markdown output includes header');
    assert(mdOut.includes('DEGRADED'), 'Markdown output includes status');
    assert(mdOut.includes('Value Shifts'), 'Markdown output includes table rows');

    console.log('  ✔ Empty and uninitialized workspaces report cleanly.');
    console.log('  ✔ Accurately inventories chapters and scenes.');
    console.log('  ✔ Detects missing authored chapter break rationales.');
    console.log('  ✔ Detects null and missing value shifts in scene cards.');
    console.log('  ✔ Detects provisional voice anchors requiring re-reading.');
    console.log('  ✔ Verifies diagnostic staleness against SHA-256 prose hashes.');
    console.log('  ✔ Enforces Orphan Guard on unbound scenes.');
    console.log('  ✔ Formats terminal and markdown dashboards with rich telemetry.');

    console.log('\n✔ All Model Health Console tests passed (8/8)!\n');
    return true;
  } finally {
    cleanup();
  }
}

if (process.argv[1] && process.argv[1].includes('model_health.test.js')) {
  runModelHealthTests();
}
