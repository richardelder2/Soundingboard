/**
 * Test Suite for Canon 2.0 & Decision Queues (SB2-P2-06)
 * Zero external dependencies; built-in Node only.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {
  isFactKnownToReader,
  parseSceneNumber,
  loadCanonEntries,
  validateCanonProvenance,
  detectUnboundEntities,
  buildDecisionQueues,
  runCanonCheck,
  queryCanon
} from '../scripts/canon.js';
import { loadCanonEntities } from '../scripts/continuity_scan.js';

const rootDir = process.cwd();
const testTmpDir = path.join(rootDir, 'tests', 'fixtures', 'tmp_canon_test');

console.log('\n--- Running Canon 2.0 & Decision Queues Test Suite (SB2-P2-06) ---');

function setupTestEnv() {
  fs.mkdirSync(testTmpDir, { recursive: true });
  const planningDir = path.join(testTmpDir, 'stages', '02_planning', 'output');
  fs.mkdirSync(planningDir, { recursive: true });
  const manuscriptCh1 = path.join(testTmpDir, 'manuscript', 'ch-01');
  fs.mkdirSync(manuscriptCh1, { recursive: true });

  // 1. Write mock canon.md with 2.0 schema (7 columns)
  const canonContent = [
    '# Canon Ledger',
    '| Entity | Attribute | Value | Established In | Reader Known As Of | Epistemic Status | Status |',
    '|---|---|---|---|---|---|---|',
    '| Marcus Vance | Identity | Secret agent for the guild | sc-0010 | sc-0030 | established | verified |',
    '| Silver Needle | Weapon | Carries poisoned tip | sc-0010 | sc-0010 | established | verified |',
    '| Elena Rostova | Betrayal | Stole the cipher crystal | sc-0099 | sc-0010 | established | unverified |',
    '| Sunken Citadel | Location | Flooded during first cataclysm | sc-0010 | sc-0010 | established | verified |'
  ].join('\n');
  fs.writeFileSync(path.join(planningDir, 'canon.md'), canonContent, 'utf8');

  // 2. Write manuscript scene sc-0010 (sc-0099 is intentionally missing to test orphaned queue)
  const sc10Content = [
    '---',
    'id: sc-0010',
    'type: scene',
    'chapter: 1',
    'title: The Harbor Meeting',
    'threads:',
    '  - guild_espionage',
    '---',
    '',
    'Marcus Vance adjusted the Silver Needle beneath his coat.',
    'Commander Sterling watched from the shadows. Sterling had never trusted anyone.',
    'Later that night, Sterling arrived at the tavern with a grim smile.',
    'Commander Sterling ordered another ale.'
  ].join('\n');
  fs.writeFileSync(path.join(manuscriptCh1, 'sc-0010.md'), sc10Content, 'utf8');
}

function teardownTestEnv() {
  if (fs.existsSync(testTmpDir)) {
    fs.rmSync(testTmpDir, { recursive: true, force: true });
  }
}

try {
  setupTestEnv();

  // Test 1: parseSceneNumber helper
  assert.strictEqual(parseSceneNumber('sc-0010'), 10, 'parseSceneNumber parses sc-0010 to 10');
  assert.strictEqual(parseSceneNumber('sc-0030'), 30, 'parseSceneNumber parses sc-0030 to 30');
  assert.strictEqual(parseSceneNumber(null), 0, 'parseSceneNumber returns 0 for null');
  console.log('  ✔ parseSceneNumber correctly parses numerical scene IDs.');

  // Test 2: isFactKnownToReader logic (PRD §15.4)
  assert.strictEqual(isFactKnownToReader('sc-0030', 'sc-0010'), false, 'Fact revealed at sc-0030 is unknown at sc-0010');
  assert.strictEqual(isFactKnownToReader('sc-0010', 'sc-0030'), true, 'Fact revealed at sc-0010 is known at sc-0030');
  assert.strictEqual(isFactKnownToReader('sc-0010', 'sc-0010'), true, 'Fact revealed at sc-0010 is known at sc-0010');
  assert.strictEqual(isFactKnownToReader(null, 'sc-0010'), true, 'Fact with no spoiler anchor is always known');
  console.log('  ✔ isFactKnownToReader correctly enforces chronological spoiler threshold.');

  // Test 3: loadCanonEntries with reader spoiler guard
  const allEntries = loadCanonEntries(testTmpDir);
  assert.strictEqual(allEntries.length, 4, 'Loads all 4 canon entries when no scene specified');

  const sc10Entries = loadCanonEntries(testTmpDir, { forSceneId: 'sc-0010' });
  // Marcus Vance fact has readerKnownAsOf: sc-0030 -> must be suppressed at sc-0010
  assert.strictEqual(sc10Entries.length, 3, 'Suppresses 1 spoiler fact at sc-0010');
  const marcusEntry = sc10Entries.find(e => e.entity === 'Marcus Vance');
  assert.strictEqual(marcusEntry, undefined, 'Marcus Vance guild secret is hidden from reader at sc-0010');
  console.log('  ✔ loadCanonEntries suppresses spoiler facts where reader_known_as_of > current_scene.');

  // Test 4: loadCanonEntities in continuity_scan.js with spoiler guard
  const { canonEntities: fullEntities } = loadCanonEntities(testTmpDir);
  assert.strictEqual(fullEntities.has('marcus vance'), true, 'Marcus Vance present in unfiltered continuity entities');

  const { canonEntities: sc10Continuity } = loadCanonEntities(testTmpDir, { forSceneId: 'sc-0010' });
  assert.strictEqual(sc10Continuity.has('marcus vance'), false, 'Marcus Vance hidden from continuity scan at sc-0010');
  assert.strictEqual(sc10Continuity.has('silver needle'), true, 'Silver Needle visible in continuity scan at sc-0010');
  console.log('  ✔ continuity_scan.loadCanonEntities honors spoiler guard options.');

  // Test 5: validateCanonProvenance catches orphaned facts (PRD §15.2, §15.5)
  // Elena Rostova is established_in sc-0099, which does not exist in test manuscript
  const orphaned = validateCanonProvenance(allEntries, testTmpDir);
  assert.strictEqual(orphaned.length, 1, 'Catches 1 orphaned fact');
  assert.strictEqual(orphaned[0].entry.entity, 'Elena Rostova', 'Orphaned fact is Elena Rostova');
  assert.strictEqual(orphaned[0].missingSceneId, 'sc-0099', 'Identifies missing scene sc-0099');
  console.log('  ✔ validateCanonProvenance flags orphaned facts when establishing scene is cut.');

  // Test 6: detectUnboundEntities identifies recurring prose entities not in canon (PRD §15.5)
  // "Commander Sterling" / "Sterling" appears 3 times in sc-0010 prose, not in canon
  const unbound = detectUnboundEntities(testTmpDir, allEntries);
  assert.strictEqual(unbound.length >= 1, true, 'Detects unbound entity from draft prose');
  const sterling = unbound.find(u => u.entity.toLowerCase().includes('sterling'));
  assert.ok(sterling, 'Identifies Sterling as unbound recurring entity');
  assert.strictEqual(sterling.occurrences >= 3, true, 'Counts recurring occurrences');
  console.log('  ✔ detectUnboundEntities detects recurring unrecorded proper nouns in draft prose.');

  // Test 7: buildDecisionQueues compiles Orphaned, Unbound, and Absent queues (PRD §15.5, §15.6)
  const queues = buildDecisionQueues(testTmpDir);
  assert.strictEqual(queues.orphanedQueue.length, 1, 'Orphaned queue has 1 item');
  assert.strictEqual(queues.orphanedQueue[0].options.length, 4, 'Orphaned queue provides 4 HITL resolution options');
  assert.strictEqual(queues.unboundQueue.length >= 1, true, 'Unbound queue has Sterling');
  assert.strictEqual(queues.unboundQueue[0].options.length, 4, 'Unbound queue provides 4 HITL resolution options');
  assert.strictEqual(queues.absentQueue.length, 1, 'Absent queue contains Elena Rostova (unverified)');
  assert.strictEqual(queues.absentQueue[0].options.length, 3, 'Absent queue provides 3 HITL resolution options');
  console.log('  ✔ buildDecisionQueues constructs all 3 epistemic gap queues with HITL options.');

  // Test 8: runCanonCheck produces report and JSON verdict
  const checkResult = runCanonCheck({ rootDir: testTmpDir });
  assert.strictEqual(checkResult.orphanedFactsCount, 1, 'Check reports 1 orphaned fact');
  assert.strictEqual(checkResult.absentFactsCount, 1, 'Check reports 1 absent/unverified fact');
  const reportPath = path.join(testTmpDir, 'stages', '04_diagnostics_edits', 'output', 'reports', 'canon_decision_queues_report.md');
  assert.strictEqual(fs.existsSync(reportPath), true, 'Writes markdown decision queues report');
  const verdictPath = path.join(testTmpDir, 'stages', '04_diagnostics_edits', 'output', 'verdicts', 'canon.json');
  assert.strictEqual(fs.existsSync(verdictPath), true, 'Writes canon.json verdict');
  console.log('  ✔ runCanonCheck saves reports and structured verdict JSON.');

  console.log('\n\x1b[32m✔ All Canon 2.0 & Decision Queues checks passed (8/8)!\x1b[0m\n');
} finally {
  teardownTestEnv();
}
