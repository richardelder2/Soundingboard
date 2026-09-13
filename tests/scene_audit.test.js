import * as fs from 'fs';
import * as path from 'path';
import { runAudit } from '../scripts/narrative_audit.js';
import { runContinuityScan } from '../scripts/continuity_scan.js';
import { calculateCoverage, formatCoverageMarkdown } from '../scripts/coverage_reporter.js';

console.log('Testing Scene-Scoped Audits (SB2-P2-01) & Coverage Reporting (SB2-P2-04)...');

const testDir = path.join(process.cwd(), 'tests', 'fixtures', 'p2_scene_audit');
const manuscriptDir = path.join(testDir, 'manuscript');
const ch1Dir = path.join(manuscriptDir, 'ch-01');
const reportsDir = path.join(testDir, 'stages', '04_diagnostics_edits', 'output', 'reports');
const verdictsDir = path.join(testDir, 'stages', '04_diagnostics_edits', 'output', 'verdicts');

fs.mkdirSync(ch1Dir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
fs.mkdirSync(verdictsDir, { recursive: true });

// Create test canon
const canonDir = path.join(testDir, 'stages', '02_planning', 'output');
fs.mkdirSync(canonDir, { recursive: true });
const testCanon = `# Story Canon
## Characters & Cast
| Entity | Attribute / Fact | Value | Established | Status |
|---|---|---|---|---|
| [Julian] | Role | Disgraced Archivist | sc-0001 | established |
| [Kathryn] | Status | Lead Cryptanalyst | sc-0001 | established |
`;
fs.writeFileSync(path.join(canonDir, 'canon.md'), testCanon, 'utf8');

// Create test scene 1 (Drafted, clean, with proper nouns)
const sc1Content = `---
id: sc-0001
chapter: ch-01
pov: Julian
location: Archives
threads: [th-01]
value_in: "Ignorance (+)"
value_out: "Discovery (++)"
commandments:
  inciting_incident: "Finds the bronze ledger"
  progressive_complication: "Pages are stuck"
  crisis: "Force open or preserve"
  climax: "Cuts the spine thread"
  resolution: "The seal reveals a royal insignia"
status: drafted
schema: 2.0
---

Julian adjusted his spectacles and approached the heavy oak desk. The cold light filtered through high arched windows, casting elongated shadows across the damp flagstones.

"Kathryn," he whispered, gesturing toward the bronze ledger resting upon the lectern. "Have you inspected the cipher on the front clasp?"

Kathryn stepped into the circle of lantern glow, her fingers trailing over the aged leather binding. "I examined the brass gears an hour ago. The tumblers will not budge without the master key."

He nodded slowly. Every movement carried the deliberate weight of three decades spent among crumbling parchment. The dust rose in thin spirals as they lifted the folio together.
`;
const sc1Path = path.join(ch1Dir, 'sc-0001.md');
fs.writeFileSync(sc1Path, sc1Content, 'utf8');

// Create test scene 2 (Drafted, with near-duplicate typo against canon: Cathryn instead of Kathryn, plus AI tell)
const sc2Content = `---
id: sc-0002
chapter: ch-01
pov: Julian
location: Crypt
threads: [th-01]
value_in: "Discovery (+)"
value_out: "Danger (-)"
commandments:
  inciting_incident: "Door shuts"
  progressive_complication: "Trap triggers"
  crisis: "Flee or hide"
  climax: "Slams lock"
  resolution: "Locked in crypt"
status: drafted
schema: 2.0
---

The heavy iron door swung shut with a reverberating clang that echoed down the vaulted corridor.

Julian began to run toward the entrance, his heart hammering against his ribs as cold sweat broke across his forehead. He managed to grab the handle, but something shifted in the mechanism.

"Cathryn!" he cried out in the darkness. "The latch has frozen from the outside!"

A myriad of shadows danced across the ancient limestone walls, a testament to the inescapable gloom of the undercroft.
`;
const sc2Path = path.join(ch1Dir, 'sc-0002.md');
fs.writeFileSync(sc2Path, sc2Content, 'utf8');

// Create test scene 3 (Undrafted scene, status: planned, null value shifts)
const sc3Content = `---
id: sc-0003
chapter: ch-01
pov: Julian
location: Secret Passage
threads: [th-01]
value_in: null
value_out: null
commandments: null
status: planned
schema: 2.0
---
`;
const sc3Path = path.join(ch1Dir, 'sc-0003.md');
fs.writeFileSync(sc3Path, sc3Content, 'utf8');

// Create chapter.md
const chMdContent = `---
id: ch-01
number: 1
title: "The Archives Below"
scenes: [sc-0001, sc-0002, sc-0003]
break_rationale: >
  Ends on a sudden iron door lock and trapped cliffhanger with cryogenic stakes.
status: drafted
schema: 2.0
---
`;
fs.writeFileSync(path.join(ch1Dir, 'chapter.md'), chMdContent, 'utf8');

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

// Test 1: Performance (< 500ms) and scene-scoped narrative audit
const startT = Date.now();
runAudit([sc1Path]);
const elapsed = Date.now() - startT;
assert(elapsed < 500, `Single scene narrative audit completes in < 500ms (actual: ${elapsed}ms)`);

const report1Path = path.join(process.cwd(), 'stages', '04_diagnostics_edits', 'output', 'reports', 'audit_sc-0001.md');
assert(fs.existsSync(report1Path), 'Generates scene-scoped audit report audit_sc-0001.md');
const report1 = fs.readFileSync(report1Path, 'utf8');
assert(report1.includes('Value Shift') && report1.includes('Ignorance') && report1.includes('Discovery'), 'Report includes Scene Card value shift intent');

// Test 2: AI-tell detection on scene 2 with scene_id tagging
runAudit([sc2Path]);
const report2Path = path.join(process.cwd(), 'stages', '04_diagnostics_edits', 'output', 'reports', 'audit_sc-0002.md');
assert(fs.existsSync(report2Path), 'Generates audit_sc-0002.md');
const report2 = fs.readFileSync(report2Path, 'utf8');
assert(report2.includes('[sc-0002]'), 'Flags carry scene_id tagging');

// Test 3: Scene-Scoped Continuity Scan against canon
runContinuityScan([sc2Path]);
const contReportPath = path.join(process.cwd(), 'stages', '04_diagnostics_edits', 'output', 'reports', 'continuity_sc-0002.md');
assert(fs.existsSync(contReportPath), 'Generates continuity_sc-0002.md');
const contReport = fs.readFileSync(contReportPath, 'utf8');
assert(contReport.includes('Cathryn') && contReport.includes('Kathryn'), 'Catches near-duplicate typo "Cathryn" against canon entity "Kathryn"');

// Test 4: Honest Coverage Reporting
const coverage = calculateCoverage(['sc-0001', 'sc-0002'], { rootDir: testDir });
assert(coverage.scenesExamined === 2, `Accurately reports 2 scenes examined (actual: ${coverage.scenesExamined})`);
assert(coverage.undraftedScenes === 1, `Accurately reports 1 undrafted scene sc-0003 (actual: ${coverage.undraftedScenes})`);
assert(coverage.nullValueShifts === 1, `Accurately reports 1 null value shift on sc-0003 (actual: ${coverage.nullValueShifts})`);
assert(coverage.scenesSkipped >= 1, `Accurately reports skipped scene count (actual: ${coverage.scenesSkipped})`);

const coverageMd = formatCoverageMarkdown(coverage);
assert(coverageMd.includes('Honest Coverage Report'), 'Markdown coverage section includes header');
assert(coverageMd.includes('Undrafted Scenes'), 'Markdown coverage section lists undrafted scenes');
assert(coverageMd.includes('Null Value Shifts'), 'Markdown coverage section lists null value shifts');

// Cleanup
fs.rmSync(testDir, { recursive: true, force: true });
if (fs.existsSync(report1Path)) fs.unlinkSync(report1Path);
if (fs.existsSync(report2Path)) fs.unlinkSync(report2Path);
if (fs.existsSync(contReportPath)) fs.unlinkSync(contReportPath);

console.log(`\n✔ All ${passed} scene-scoped audit and coverage reporting tests passed!`);
