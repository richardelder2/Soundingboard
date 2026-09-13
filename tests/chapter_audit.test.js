import * as fs from 'fs';
import * as path from 'path';
import { runChapterAudit, evaluateChapterCadence, evaluateBreakEfficacy } from '../scripts/chapter_audit.js';

console.log('Testing Chapter-Scoped Audits (SB2-P2-02)...');

const testDir = path.join(process.cwd(), 'tests', 'fixtures', 'p2_chapter_audit');
const manuscriptDir = path.join(testDir, 'manuscript');
const ch1Dir = path.join(manuscriptDir, 'ch-01');
const ch2Dir = path.join(manuscriptDir, 'ch-02');

fs.mkdirSync(ch1Dir, { recursive: true });
fs.mkdirSync(ch2Dir, { recursive: true });

// Chapter 1: Healthy rhythm variance, valid cliffhanger break rationale
const sc1Prose = `The rain beat against the arched glass roof of the library. Outside, the bell tower chimed four times, heavy and resonant. Julian stood before the bronze chest with the brass key trembling between his fingers. He knew what opening it meant. He knew the risk. Yet curiosity pulled him forward, steady and undeniable.`;
const sc2Prose = `He turned the key. A loud click snapped through the room. Suddenly, the heavy iron door behind him swung open, revealing the shadow of an armed constable holding a cocked lantern!`;

fs.writeFileSync(path.join(ch1Dir, 'sc-0001.md'), `---
id: sc-0001
chapter: ch-01
pov: Julian
status: drafted
schema: 2.0
---
${sc1Prose}
`, 'utf8');

fs.writeFileSync(path.join(ch1Dir, 'sc-0002.md'), `---
id: sc-0002
chapter: ch-01
pov: Julian
status: drafted
schema: 2.0
---
${sc2Prose}
`, 'utf8');

fs.writeFileSync(path.join(ch1Dir, 'chapter.md'), `---
id: ch-01
number: 1
title: "The Archivist's Key"
scenes: [sc-0001, sc-0002]
break_rationale: >
  Ends on high suspense cliffhanger when the constable catches Julian red-handed.
status: drafted
schema: 2.0
---
`, 'utf8');

// Chapter 2: Monotonous rhythm (uniform short sentences), missing break rationale
const sc3Prose = `Julian ran fast. The man came near. The dog barked loud. Julian leapt low.`;
const sc4Prose = `The street was dark. The fog was thick. The cart was old. Julian kept still.`;

fs.writeFileSync(path.join(ch2Dir, 'sc-0003.md'), `---
id: sc-0003
chapter: ch-02
pov: Julian
status: drafted
schema: 2.0
---
${sc3Prose}
`, 'utf8');

fs.writeFileSync(path.join(ch2Dir, 'sc-0004.md'), `---
id: sc-0004
chapter: ch-02
pov: Julian
status: drafted
schema: 2.0
---
${sc4Prose}
`, 'utf8');

fs.writeFileSync(path.join(ch2Dir, 'chapter.md'), `---
id: ch-02
number: 2
title: "The Escape"
scenes: [sc-0003, sc-0004]
break_rationale: ""
status: drafted
schema: 2.0
---
`, 'utf8');

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

// 1. Cadence calculation unit test
const cadenceResult1 = evaluateChapterCadence([
  { id: 'sc-0001', words: 50, body: sc1Prose },
  { id: 'sc-0002', words: 40, body: sc2Prose }
]);
assert(cadenceResult1.totalWords > 0, 'Computes total words across chapter scenes');
assert(cadenceResult1.perSceneStats.length === 2, 'Computes per-scene cadence stats for all scenes');
assert(typeof cadenceResult1.interSceneVariance === 'number', 'Calculates inter-scene variance (SD)');
assert(!cadenceResult1.isMonotonous, 'Healthy chapter does not trigger monotony warning');

// 2. Monotony cadence detection
const cadenceResult2 = evaluateChapterCadence([
  { id: 'sc-0003', words: 16, body: sc3Prose },
  { id: 'sc-0004', words: 16, body: sc4Prose }
]);
assert(cadenceResult2.isMonotonous, 'Detects rhythm monotony across identical pacing scenes');
assert(cadenceResult2.flags.length > 0, 'Emits descriptive rhythm warning flag');

// 3. Break efficacy unit tests
const breakGood = evaluateBreakEfficacy(sc2Prose, 'Ends on a sudden cliffhanger as constable bursts in.');
assert(breakGood.verdict === 'PASS', 'Delivers PASS for matched cliffhanger rationale');

const breakMissing = evaluateBreakEfficacy(sc4Prose, '');
assert(breakMissing.verdict === 'FAIL', 'Flags FAIL for empty break_rationale');

const breakTerse = evaluateBreakEfficacy(sc4Prose, 'Ends here.');
assert(breakTerse.verdict === 'FAIL', 'Flags FAIL for overly terse break_rationale (< 4 words)');

// 4. End-to-end chapter audit run
const reports = runChapterAudit('ch-01', testDir);
assert(Array.isArray(reports) && reports.length === 1, 'Runs chapter audit for ch-01');
const ch1Report = reports[0];
assert(ch1Report.chapter === 'ch-01', 'Audited correct chapter ch-01');
assert(ch1Report.breakResult.verdict === 'PASS', 'ch-01 break efficacy passes');
assert(fs.existsSync(ch1Report.reportPath), 'Generates chapter audit markdown report');

const reportText = fs.readFileSync(ch1Report.reportPath, 'utf8');
assert(reportText.includes('Chapter Audit — CH-01'), 'Markdown report contains header');
assert(reportText.includes('Cadence & Rhythm Variance'), 'Markdown report contains cadence section');
assert(reportText.includes('Chapter Break Efficacy'), 'Markdown report contains break efficacy section');
assert(reportText.includes('Honest Coverage Report'), 'Markdown report contains coverage section');

// 5. Gate verdict artifact check
const verdictFile = path.join(testDir, 'stages', '04_diagnostics_edits', 'output', 'verdicts', 'ch01', 'break_efficacy.json');
assert(fs.existsSync(verdictFile), 'Generates machine-checkable break_efficacy.json verdict');
const vData = JSON.parse(fs.readFileSync(verdictFile, 'utf8'));
assert(vData.check === 'break_efficacy', 'Verdict artifact has check: break_efficacy');
assert(vData.verdict === 'PASS', 'Verdict artifact records PASS');

// Cleanup
fs.rmSync(testDir, { recursive: true, force: true });

console.log(`\n✔ All ${passed} chapter-scoped audit tests passed!`);
