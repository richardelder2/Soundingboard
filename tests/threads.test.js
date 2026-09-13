import * as fs from 'fs';
import * as path from 'path';
import {
  parsePolarity,
  evaluateOrphanScenes,
  evaluateThreadDormancy,
  evaluatePolarityTurns,
  formatThreadAsciiLanes,
  runThreadDiagnostics
} from '../scripts/threads.js';

console.log('Testing Thread Diagnostics Suite (SB2-P2-05)...');

let passed = 0;
function assert(cond, msg) {
  if (cond) {
    console.log(`  ✔ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    process.exit(1);
  }
}

// -------------------------------------------------------------
// Unit Test 1: parsePolarity
// -------------------------------------------------------------
assert(parsePolarity('Discovery (+)') === 1, 'Parses (+) as +1');
assert(parsePolarity('Triumph (++)') === 1, 'Parses (++) as +1');
assert(parsePolarity('Danger (-)') === -1, 'Parses (-) as -1');
assert(parsePolarity('Catastrophe (--)') === -1, 'Parses (--) as -1');
assert(parsePolarity('Uncertainty (+/-)') === 0, 'Parses (+/-) as 0');
assert(parsePolarity('Hope') === 1, 'Parses positive keyword Hope as +1');
assert(parsePolarity('Despair') === -1, 'Parses negative keyword Despair as -1');
assert(parsePolarity(null) === null, 'Returns null for empty polarity');

// -------------------------------------------------------------
// Unit Test 2: evaluateOrphanScenes (Orphan Guard)
// -------------------------------------------------------------
const boundScenes = [
  { id: 'sc-0001', chapter: 'ch-01', path: 'p1', threads: ['th-01'], wordCount: 1000 },
  { id: 'sc-0002', chapter: 'ch-01', path: 'p2', threads: ['th-01', 'th-02'], wordCount: 1200 }
];
const orphanCheck1 = evaluateOrphanScenes(boundScenes);
assert(orphanCheck1.passed, 'Orphan guard passes when all scenes are bound to threads');
assert(orphanCheck1.orphans.length === 0, 'Zero orphans reported on bound scenes');

const scenesWithOrphan = [
  { id: 'sc-0001', chapter: 'ch-01', path: 'p1', threads: ['th-01'], wordCount: 1000 },
  { id: 'sc-0002', chapter: 'ch-01', path: 'p2', threads: [], wordCount: 800 },
  { id: 'sc-0003', chapter: 'ch-01', path: 'p3', threads: null, wordCount: 900 }
];
const orphanCheck2 = evaluateOrphanScenes(scenesWithOrphan);
assert(!orphanCheck2.passed, 'Orphan guard fails when scenes have empty or null threads');
assert(orphanCheck2.orphans.length === 2, `Identifies both orphan scenes (actual: ${orphanCheck2.orphans.length})`);
assert(orphanCheck2.orphans.some(o => o.id === 'sc-0002') && orphanCheck2.orphans.some(o => o.id === 'sc-0003'), 'Correctly identifies sc-0002 and sc-0003 as orphans');

// -------------------------------------------------------------
// Unit Test 3: evaluateThreadDormancy (Dormancy Sentry)
// -------------------------------------------------------------
const mockOrderedScenes = [
  { id: 'sc-0001', cumStart: 0, cumEnd: 1500, wordCount: 1500, threads: ['th-01', 'th-02'] },
  { id: 'sc-0002', cumStart: 1500, cumEnd: 4000, wordCount: 2500, threads: ['th-01'] },
  { id: 'sc-0003', cumStart: 4000, cumEnd: 7500, wordCount: 3500, threads: ['th-01'] },
  { id: 'sc-0004', cumStart: 7500, cumEnd: 10500, wordCount: 3000, threads: ['th-01'] },
  { id: 'sc-0005', cumStart: 10500, cumEnd: 12000, wordCount: 1500, threads: ['th-01', 'th-02'] }
];

// th-02 appears at sc-0001 (ends at 1500) and sc-0005 (starts at 10500)
// Gap = 10500 - 1500 = 9,000 words.
const th02 = { id: 'th-02', name: 'Romance Foil', status: 'open', dormancyThreshold: 5000 };
const dormancyResult = evaluateThreadDormancy(th02, mockOrderedScenes, 5000);
assert(dormancyResult.isDormant, 'Flags thread as dormant when word gap exceeds threshold (9000w > 5000w)');
assert(dormancyResult.maxDormancyGapWords === 9000, `Accurately computes word gap (expected 9000, actual: ${dormancyResult.maxDormancyGapWords})`);
assert(dormancyResult.worstGapRange.fromScene === 'sc-0001' && dormancyResult.worstGapRange.toScene === 'sc-0005', 'Identifies correct gap boundary scenes');

// th-01 appears in every scene -> max gap = 0
const th01 = { id: 'th-01', name: 'Main Spine', status: 'open', dormancyThreshold: 5000 };
const activeResult = evaluateThreadDormancy(th01, mockOrderedScenes, 5000);
assert(!activeResult.isDormant, 'Active spine thread with zero gap is not dormant');
assert(activeResult.maxDormancyGapWords === 0, 'Spine max gap is 0');

// -------------------------------------------------------------
// Unit Test 4: evaluatePolarityTurns (Polarity Turn Detection)
// -------------------------------------------------------------
// Dynamic thread with positive and negative turns
const dynamicScenes = [
  { id: 'sc-0001', threads: ['th-01'], value_in: 'Ignorance (-)', value_out: 'Discovery (+)' },
  { id: 'sc-0002', threads: ['th-01'], value_in: 'Hope (+)', value_out: 'Despair (-)' }
];
const dynTurn = evaluatePolarityTurns(th01, dynamicScenes);
assert(dynTurn.hasTurn, 'Identifies dynamic thread with both positive and negative turns');
assert(!dynTurn.isMonopolar, 'Dynamic thread is not monopolar');

// Flat monopolar thread with only positive turns
const flatScenes = [
  { id: 'sc-0001', threads: ['th-02'], value_in: 'Hope (+)', value_out: 'Joy (+)' },
  { id: 'sc-0002', threads: ['th-02'], value_in: 'Trust (+)', value_out: 'Love (+)' },
  { id: 'sc-0003', threads: ['th-02'], value_in: 'Peace (+)', value_out: 'Triumph (+)' }
];
const flatTurn = evaluatePolarityTurns(th02, flatScenes);
assert(!flatTurn.hasTurn, 'Flags monopolar thread as lacking polarity turn');
assert(flatTurn.isMonopolar, 'Accurately marks 3-scene flat positive thread as isMonopolar: true');

// -------------------------------------------------------------
// Unit Test 5: formatThreadAsciiLanes (ASCII Lane Visualizer)
// -------------------------------------------------------------
const asciiLanes = formatThreadAsciiLanes([th01, th02], mockOrderedScenes, 20);
assert(asciiLanes.includes('th-01'), 'ASCII chart includes th-01 lane');
assert(asciiLanes.includes('th-02'), 'ASCII chart includes th-02 lane');
assert(asciiLanes.includes('Legend:'), 'ASCII chart includes legend');
assert(asciiLanes.includes('*'), 'ASCII chart marks braid point where both threads appear');

// -------------------------------------------------------------
// Integration Test 6: runThreadDiagnostics on Mock Workspace
// -------------------------------------------------------------
const testDir = path.join(process.cwd(), 'tests', 'fixtures', 'p2_threads_test');
const manuscriptDir = path.join(testDir, 'manuscript');
const ch1Dir = path.join(manuscriptDir, 'ch-01');
const reportsDir = path.join(testDir, 'stages', '04_diagnostics_edits', 'output', 'reports');
const verdictsDir = path.join(testDir, 'stages', '04_diagnostics_edits', 'output', 'verdicts');

fs.mkdirSync(ch1Dir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
fs.mkdirSync(verdictsDir, { recursive: true });

// Create test threads tracker
const trackerDir = path.join(testDir, 'stages', '02_planning', 'output', 'trackers');
fs.mkdirSync(trackerDir, { recursive: true });
const trackerContent = `---
type: Narrative Threads Tracker
dormancy_threshold_words: 4000
threads:
  - id: th-01
    name: Main Spine
    spine: true
    status: open
  - id: th-02
    name: Subplot B
    spine: false
    status: open
---
`;
fs.writeFileSync(path.join(trackerDir, 'threads.md'), trackerContent, 'utf8');

// Create test scenes
const sc1 = `---
id: sc-0001
chapter: ch-01
threads: [th-01, th-02]
value_in: "Ignorance (-)"
value_out: "Discovery (+)"
status: drafted
---
Julian reached the library in haste. The cold wind blew through the archway.
`;
const sc2 = `---
id: sc-0002
chapter: ch-01
threads: [th-01]
value_in: "Hope (+)"
value_out: "Despair (-)"
status: drafted
---
The books were soaked in water. Nothing remained intact.
`;
fs.writeFileSync(path.join(ch1Dir, 'sc-0001.md'), sc1, 'utf8');
fs.writeFileSync(path.join(ch1Dir, 'sc-0002.md'), sc2, 'utf8');
fs.writeFileSync(path.join(ch1Dir, 'chapter.md'), `---\ntitle: Chapter One\nscenes: [sc-0001, sc-0002]\n---\n`, 'utf8');

const diagResult = runThreadDiagnostics({ rootDir: testDir });
assert(diagResult.passed, 'Diagnostics pass when all scenes are bound');
assert(diagResult.orphanGuard.passed, 'Orphan guard passed');
assert(diagResult.scenesCount === 2, 'Scanned 2 scenes');

const repPath = path.join(reportsDir, 'threads_diagnostic_report.md');
assert(fs.existsSync(repPath), 'Emits threads_diagnostic_report.md');
const repContent = fs.readFileSync(repPath, 'utf8');
assert(repContent.includes('Orphan Guard Verification'), 'Report includes Orphan Guard section');
assert(repContent.includes('Thread Telemetry & Polarity Progression'), 'Report includes Polarity Progression section');
assert(repContent.includes('Thread Lane Visualization'), 'Report includes ASCII visualization');

const verdPath = path.join(verdictsDir, 'threads.json');
assert(fs.existsSync(verdPath), 'Emits threads.json verdict');
const verdJson = JSON.parse(fs.readFileSync(verdPath, 'utf8'));
assert(verdJson.passed === true, 'Verdict artifact records passed');

// Test Orphan Failure behavior: add an orphan scene
const scOrphan = `---
id: sc-0003
chapter: ch-01
threads: []
status: drafted
---
An untethered scene drifting with no plot line.
`;
fs.writeFileSync(path.join(ch1Dir, 'sc-0003.md'), scOrphan, 'utf8');
fs.writeFileSync(path.join(ch1Dir, 'chapter.md'), `---\ntitle: Chapter One\nscenes: [sc-0001, sc-0002, sc-0003]\n---\n`, 'utf8');

const failDiagResult = runThreadDiagnostics({ rootDir: testDir });
assert(!failDiagResult.passed, 'Diagnostic reports failure when orphan scene is present');
assert(failDiagResult.orphanGuard.orphans.some(o => o.id === 'sc-0003'), 'Identifies sc-0003 as orphan');

// Cleanup
fs.rmSync(testDir, { recursive: true, force: true });

console.log(`\n✔ All ${passed} Thread Diagnostics Suite tests passed successfully!`);
