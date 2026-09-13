import * as fs from 'fs';
import * as path from 'path';
import { evaluateSceneCommandments, runCommandmentAudit, splitSentences } from '../scripts/commandment_audit.js';
import { evaluateGate } from '../scripts/gate.js';

console.log('Testing Commandment Advisory Audit (SB2-P2-03)...');

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
// Unit Test 1: Sentence splitting & cue detection
// -------------------------------------------------------------
const sampleProse = `Julian stepped into the dark vault and frozen silence met him.
The bronze tumblers will not budge without the master key.
He faced a choice: either break the lock and trigger the alarm, or walk away and forfeit the truth.
With trembling hands, he plunged the dagger between the plates.
The latch shattered, and the seal revealed the royal crest.`;

const sents = splitSentences(sampleProse);
assert(sents.length === 5, `Correctly splits 5 sentences (actual: ${sents.length})`);

// -------------------------------------------------------------
// Unit Test 2: Aligned commandments evaluation
// -------------------------------------------------------------
const plannedAligned = {
  inciting_incident: 'Julian enters the dark vault',
  progressive_complication: 'Tumblers will not budge without master key',
  crisis: 'Either break the lock or forfeit the truth',
  climax: 'Plunges dagger to force latch',
  resolution: 'Seal reveals the royal crest'
};

const evalAligned = evaluateSceneCommandments(sampleProse, plannedAligned);
assert(evalAligned.overallStatus === 'ALIGNED', `Overall status is ALIGNED when prose matches intent (actual: ${evalAligned.overallStatus})`);
assert(evalAligned.summary.aligned >= 4, `At least 4 commandments aligned (actual: ${evalAligned.summary.aligned})`);
assert(evalAligned.commandments.crisis.status === 'ALIGNED', 'Crisis commandment correctly identified as ALIGNED');

// -------------------------------------------------------------
// Unit Test 3: Divergence detection & Revision Playbook options
// -------------------------------------------------------------
const plannedDiverged = {
  inciting_incident: 'A messenger brings a poisoned letter to court',
  progressive_complication: 'The guards refuse to let Julian leave the city gate',
  crisis: 'Bribe the captain or fight through the barricade',
  climax: 'Fires his pistol at the gate lantern',
  resolution: 'Escapes into the stormy woods'
};

const evalDiverged = evaluateSceneCommandments(sampleProse, plannedDiverged);
assert(evalDiverged.overallStatus === 'ADVISORY_REVIEW', 'Overall status is ADVISORY_REVIEW on divergence');
assert(evalDiverged.summary.diverged >= 3, `Accurately flags diverged beats (actual: ${evalDiverged.summary.diverged})`);

const crisisEntry = evalDiverged.commandments.crisis;
assert(crisisEntry.status === 'DIVERGED', 'Flags crisis as DIVERGED when draft diverges from planned letter/bribe plot');
assert(crisisEntry.playbookOptions.length >= 3, 'Provides at least 3 Revision Playbook options (Embrace Discovery, Align to Plan, Synthesize)');
assert(crisisEntry.playbookOptions.some(o => o.label.includes('Embrace Discovery')), 'Includes Option A (Embrace Discovery)');
assert(crisisEntry.playbookOptions.some(o => o.label.includes('Align to Plan')), 'Includes Option B (Align to Plan)');

// -------------------------------------------------------------
// Unit Test 4: Discovery beats & Null frontmatter handling
// -------------------------------------------------------------
const plannedNull = {
  inciting_incident: null,
  progressive_complication: null,
  crisis: null,
  climax: null,
  resolution: null
};

const evalNull = evaluateSceneCommandments(sampleProse, plannedNull);
assert(evalNull.summary.discovery >= 3, `Identifies discovery beats when plan is null (actual: ${evalNull.summary.discovery})`);
assert(evalNull.commandments.climax.status === 'DISCOVERY_BEAT', 'Identifies climax as DISCOVERY_BEAT');
assert(evalNull.commandments.climax.playbookOptions.some(o => o.label.includes('Lock In Discovery')), 'Offers option to backfill Stage 02 card');

// -------------------------------------------------------------
// Integration Test 5: runCommandmentAudit() on mock workspace
// -------------------------------------------------------------
const testDir = path.join(process.cwd(), 'tests', 'fixtures', 'p2_commandment_audit');
const manuscriptDir = path.join(testDir, 'manuscript');
const ch1Dir = path.join(manuscriptDir, 'ch-01');
const reportsDir = path.join(testDir, 'stages', '04_diagnostics_edits', 'output', 'reports');
const verdictsDir = path.join(testDir, 'stages', '04_diagnostics_edits', 'output', 'verdicts');

fs.mkdirSync(ch1Dir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
fs.mkdirSync(verdictsDir, { recursive: true });

const mockSceneContent = `---
id: sc-0001
chapter: ch-01
pov: Julian
location: Archives
threads: [th-01]
value_in: "Ignorance (+)"
value_out: "Danger (-)"
commandments:
  inciting_incident: "Julian enters the dark vault"
  progressive_complication: "Tumblers will not budge without master key"
  crisis: "Either break the lock or forfeit the truth"
  climax: "Plunges dagger to force latch"
  resolution: "Seal reveals the royal crest"
status: drafted
schema: 2.0
---

${sampleProse}
`;

const mockScenePath = path.join(ch1Dir, 'sc-0001.md');
fs.writeFileSync(mockScenePath, mockSceneContent, 'utf8');

const auditResults = runCommandmentAudit('sc-0001', testDir);
assert(auditResults.length === 1, 'Audits single scene sc-0001');

const reportFile = path.join(reportsDir, 'commandment_audit_sc-0001.md');
assert(fs.existsSync(reportFile), 'Generates commandment_audit_sc-0001.md');
const reportText = fs.readFileSync(reportFile, 'utf8');
assert(reportText.includes('Planned Intent vs. Prose Delivery'), 'Report includes side-by-side comparison table');
assert(reportText.includes('Human-in-the-Loop (HITL) Revision Playbook Options'), 'Report includes Revision Playbook section');
assert(reportText.includes('Honest Coverage Report'), 'Report includes honest coverage reporting');

// Machine gate check: Verdict file must be PASS
const verdictFile = path.join(verdictsDir, 'ch01', 'commandments_sc-0001.json');
assert(fs.existsSync(verdictFile), 'Generates commandments_sc-0001.json verdict');
const verdictData = JSON.parse(fs.readFileSync(verdictFile, 'utf8'));
assert(verdictData.verdict === 'PASS', `Advisory verdict is PASS to preserve machine gate safety (actual: ${verdictData.verdict})`);
assert(verdictData.check === 'commandment_audit', 'Verdict check is commandment_audit');

// Cleanup
fs.rmSync(testDir, { recursive: true, force: true });

console.log(`\n✔ All ${passed} Commandment Advisory Audit tests passed successfully!`);
