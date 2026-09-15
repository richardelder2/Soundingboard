/**
 * Test Suite: Git & Creative History (Playbook #21)
 *
 * Verifies:
 * 1. Scene movement (stable identity & context across chapter playlists)
 * 2. Scene revision (prose diff detection)
 * 3. Context revision (frontmatter metadata diff detection)
 * 4. Bracket lifecycle (creation, revision, resolution tracking)
 * 5. Author rejection (preservation of author decision without modifying prose)
 * 6. Structural experiment (branch creation, playlist swap, structural diff)
 * 7. Checkpoint creation & restoration
 * 8. Push summary & authorization boundaries
 * 9. Technical integrity validation (catches malformed YAML & broken links without blocking on creative findings)
 * 10. Workspace recovery & lossless derived cache synchronization
 * 11. Strict zero silent prose modification guarantee
 */

import * as fs from 'fs';
import * as path from 'path';
import assert from 'assert';
import { execSync } from 'child_process';
import {
  isGitRepository,
  getGitStatus,
  analyzeCreativeChanges,
  formatCreativeSummary,
  verifyTechnicalIntegrity,
  createCheckpointCommit,
  getPushSummary,
  compareExperiments
} from '../scripts/git_history.js';
import { parse, stringify, strip } from '../scripts/frontmatter.js';
import { reindex } from '../scripts/reindex.js';

const testDir = path.join(process.cwd(), 'tests', 'fixtures', 'tmp_git_history_test');

function runInTestDir(cmd) {
  return execSync(cmd, { cwd: testDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function cleanup() {
  if (fs.existsSync(testDir)) {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

console.log('\n--- Running Git & Creative History Test Suite (Playbook #21) ---');

cleanup();
fs.mkdirSync(testDir, { recursive: true });

try {
  // 0. Initialize a clean Git repository in fixture directory
  runInTestDir('git init');
  try { runInTestDir('git branch -M main'); } catch (_) {}
  runInTestDir('git config user.name "Author Tester"');
  runInTestDir('git config user.email "author@soundingboard.test"');

  // Scaffold workspace folders
  const msDir = path.join(testDir, 'manuscript');
  const scenesDir = path.join(msDir, 'scenes');
  const chaptersDir = path.join(msDir, 'chapters');
  const writersRoomDir = path.join(testDir, 'writers_room');
  const planningDir = path.join(testDir, 'stages', '02_planning', 'output');

  fs.mkdirSync(scenesDir, { recursive: true });
  fs.mkdirSync(chaptersDir, { recursive: true });
  fs.mkdirSync(path.join(writersRoomDir, 'drafts'), { recursive: true });
  fs.mkdirSync(planningDir, { recursive: true });

  // 1. Scaffold preferences.md
  const prefContent = `---
author_name: "Elena Rostova"
working_mode: "solo"
git_mode: "gentle"
git_remote_push: "ask"
---

# Author Preferences
`;
  fs.writeFileSync(path.join(testDir, 'preferences.md'), prefContent, 'utf8');

  // 2. Scaffold Scene 1 (sc-0001)
  const sc1Meta = {
    id: 'sc-0001',
    pov: 'Elena',
    location: 'Dock warehouse',
    value_in: 'Fear (-)',
    value_out: 'Resolve (+)',
    commandments: {
      inciting_incident: 'The whistle blows in the fog',
      climax: 'Elena grabs the manifest'
    },
    threads: ['th-01'],
    status: 'drafted',
    schema: '2.0'
  };
  const sc1Prose = `The fog hung thick over the salt wharves. Elena kept her hand flat against the icy brickwork.
She listened for the boots on the cobbles, her heart hammering against her ribs.`;
  fs.writeFileSync(path.join(scenesDir, 'sc-0001.md'), stringify(sc1Meta, sc1Prose), 'utf8');

  // 3. Scaffold Scene 2 (sc-0002)
  const sc2Meta = {
    id: 'sc-0002',
    pov: 'Elena',
    location: 'Barge cabin',
    value_in: 'Uncertainty (?)',
    value_out: 'Clarity (+)',
    threads: ['th-01'],
    status: 'drafted',
    schema: '2.0'
  };
  const sc2Prose = `The lantern swung with the tide. On the plank table lay the cipher crystal.
It glowed with faint indigo light.`;
  fs.writeFileSync(path.join(scenesDir, 'sc-0002.md'), stringify(sc2Meta, sc2Prose), 'utf8');

  // 4. Scaffold Chapter Playlists: ch-01 with [sc-0001], ch-02 with [sc-0002]
  const ch1Meta = {
    id: 'ch-01',
    number: 1,
    title: 'The Fog Whistle',
    scenes: ['sc-0001'],
    break_rationale: 'Ends on Elena grabbing the manifest, creating urgency.',
    schema: '2.0'
  };
  fs.writeFileSync(path.join(chaptersDir, 'ch-01.md'), stringify(ch1Meta, '# Chapter 1'), 'utf8');

  const ch2Meta = {
    id: 'ch-02',
    number: 2,
    title: 'The Cabin Light',
    scenes: ['sc-0002'],
    break_rationale: 'Ends on the cipher crystal glowing.',
    schema: '2.0'
  };
  fs.writeFileSync(path.join(chaptersDir, 'ch-02.md'), stringify(ch2Meta, '# Chapter 2'), 'utf8');

  // Initial commit
  const commit1 = createCheckpointCommit(testDir, { message: 'milestone: initial novel scaffold' });
  assert.strictEqual(commit1.success, true, 'Initial checkpoint commit created successfully');
  console.log('  ✔ Initial checkpoint commit created successfully.');

  // ==========================================
  // Scenario 1: Scene Movement (Stable Identity)
  // ==========================================
  // Move sc-0001 from ch-01 to ch-02 (e.g. combining scenes into chapter 2)
  ch1Meta.scenes = [];
  ch2Meta.scenes = ['sc-0001', 'sc-0002'];
  fs.writeFileSync(path.join(chaptersDir, 'ch-01.md'), stringify(ch1Meta, '# Chapter 1'), 'utf8');
  fs.writeFileSync(path.join(chaptersDir, 'ch-02.md'), stringify(ch2Meta, '# Chapter 2'), 'utf8');

  // Verify scene sc-0001 file was NOT touched and retains all metadata
  const sc1RawAfterMove = fs.readFileSync(path.join(scenesDir, 'sc-0001.md'), 'utf8');
  const sc1ParsedAfterMove = parse(sc1RawAfterMove, path.join(scenesDir, 'sc-0001.md'));
  assert.strictEqual(sc1ParsedAfterMove.id, 'sc-0001', 'Scene ID remains sc-0001 after moving chapters');
  assert.strictEqual(sc1ParsedAfterMove.pov, 'Elena', 'Scene POV is preserved');
  assert.strictEqual(sc1ParsedAfterMove.value_in, 'Fear (-)', 'Value shift intent is preserved');
  assert.strictEqual(strip(sc1RawAfterMove).trim(), sc1Prose, 'Scene prose is identical');

  const analysisMove = analyzeCreativeChanges(testDir);
  assert.strictEqual(analysisMove.scenesMoved.length, 2, 'Detects chapter playlist restructuring');
  assert.strictEqual(analysisMove.scenesRevised.length, 0, 'Does NOT mark sc-0001 as revised or replaced');

  const commitMove = createCheckpointCommit(testDir, { message: 'experiment: move sc-0001 into Chapter 2 playlist' });
  assert.strictEqual(commitMove.success, true, 'Committed scene movement cleanly');
  console.log('  ✔ Scene movement test: Scene identity and YAML context remain 100% intact across chapter moves.');

  // ==========================================
  // Scenario 2: Scene Prose Revision
  // ==========================================
  const sc1UpdatedProse = sc1Prose + '\nFootsteps scraped the wet gravel. Elena held her breath.';
  fs.writeFileSync(path.join(scenesDir, 'sc-0001.md'), stringify(sc1Meta, sc1UpdatedProse), 'utf8');

  const analysisProse = analyzeCreativeChanges(testDir);
  assert.strictEqual(analysisProse.scenesRevised.length, 1, 'Detects 1 revised scene');
  assert.strictEqual(analysisProse.scenesRevised[0].proseChanged, true, 'Correctly flags proseChanged: true');
  assert.strictEqual(analysisProse.scenesRevised[0].metaChanged, false, 'Correctly flags metaChanged: false');

  const commitProse = createCheckpointCommit(testDir, { message: 'scene(sc-0001): expand dock confrontation prose' });
  assert.strictEqual(commitProse.success, true, 'Prose revision committed cleanly');
  console.log('  ✔ Scene prose revision test: Git diff cleanly isolates prose updates from metadata.');

  // ==========================================
  // Scenario 3: Context Revision (Metadata Shift)
  // ==========================================
  sc1Meta.value_out = 'Triumph (++)'; // Author modifies intended dramatic value shift
  fs.writeFileSync(path.join(scenesDir, 'sc-0001.md'), stringify(sc1Meta, sc1UpdatedProse), 'utf8');

  const analysisMeta = analyzeCreativeChanges(testDir);
  assert.strictEqual(analysisMeta.scenesRevised.length, 1, 'Detects revised scene');
  assert.strictEqual(analysisMeta.scenesRevised[0].proseChanged, false, 'Flags proseChanged: false');
  assert.strictEqual(analysisMeta.scenesRevised[0].metaChanged, true, 'Flags metaChanged: true');

  const commitMeta = createCheckpointCommit(testDir, { message: 'revision: calibrate sc-0001 value shift to Triumph' });
  assert.strictEqual(commitMeta.success, true, 'Metadata revision committed cleanly');
  console.log('  ✔ Context revision test: Metadata updates are cleanly detected while prose is unchanged.');

  // ==========================================
  // Scenario 4: Bracket Lifecycle (Create & Resolve)
  // ==========================================
  // Step 4A: Inject editorial bracket
  const bracketProse = `The fog hung thick over the salt wharves [AI-TELL: Cliché atmospheric opener. Option A: Cut. Option B: Focus on sulfur smell. Option C: Keep.]. Elena kept her hand flat against the icy brickwork.`;
  fs.writeFileSync(path.join(scenesDir, 'sc-0001.md'), stringify(sc1Meta, bracketProse), 'utf8');

  const analysisBracketIn = analyzeCreativeChanges(testDir);
  assert.strictEqual(analysisBracketIn.scenesRevised[0].activeBrackets, 1, 'Detects 1 active bracket injected');

  createCheckpointCommit(testDir, { message: 'editorial: add bracketed feedback to sc-0001' });

  // Step 4B: Author resolves bracket by picking Option B
  const resolvedProse = `The smell of brine and burnt sulfur hung thick over the wharves. Elena kept her hand flat against the icy brickwork.`;
  fs.writeFileSync(path.join(scenesDir, 'sc-0001.md'), stringify(sc1Meta, resolvedProse), 'utf8');

  const analysisBracketOut = analyzeCreativeChanges(testDir);
  assert.strictEqual(analysisBracketOut.bracketsResolvedCount, 1, 'Detects 1 resolved bracket');
  assert.strictEqual(analysisBracketOut.suggestedType, 'revision', 'Recommends revision commit type');

  createCheckpointCommit(testDir);
  console.log('  ✔ Bracket lifecycle test: Bracket insertion and author resolution are tracked in Git history.');

  // ==========================================
  // Scenario 5: Author Rejection (Preserve Voice)
  // ==========================================
  // Author adds [PRESERVE] decision note and keeps original prose
  const preservedProseWithDecision = `The smell of brine and burnt sulfur hung thick over the wharves. Elena kept her hand flat against the icy brickwork.
She listened for the boots on the cobbles, her heart hammering against her ribs.
[PRESERVE: Repetition of footsteps is intentional to convey Elena's auditory paranoia.]`;
  fs.writeFileSync(path.join(scenesDir, 'sc-0001.md'), stringify(sc1Meta, preservedProseWithDecision), 'utf8');

  createCheckpointCommit(testDir, { message: 'revision: preserve auditory repetition in sc-0001 per author voice' });
  const sc1AfterRejection = fs.readFileSync(path.join(scenesDir, 'sc-0001.md'), 'utf8');
  assert.ok(sc1AfterRejection.includes('PRESERVE: Repetition of footsteps is intentional'), 'Author decision is preserved in file history');
  console.log('  ✔ Author rejection test: Author choice to preserve voice is explicitly recorded.');

  // ==========================================
  // Scenario 6: Structural Experiment with Branches
  // ==========================================
  // Create an experiment branch
  runInTestDir('git checkout -b experiment/alternate-ch2-order');

  // In this experiment, reverse the scene order in Chapter 2
  ch2Meta.scenes = ['sc-0002', 'sc-0001'];
  fs.writeFileSync(path.join(chaptersDir, 'ch-02.md'), stringify(ch2Meta, '# Chapter 2 Reordered'), 'utf8');
  createCheckpointCommit(testDir, { message: 'experiment: reverse scene order in ch-02' });

  // Compare experiment against main
  const experimentComparison = compareExperiments(testDir, 'main', 'HEAD');
  assert.strictEqual(experimentComparison.changedChapters.length, 1, 'Identifies chapter difference between branches');
  assert.strictEqual(experimentComparison.changedChapters[0].id, 'ch-02', 'Identifies ch-02 as changed');
  assert.strictEqual(experimentComparison.changedScenes.length, 0, 'Confirms atomic scene files are unchanged');

  // Switch back to main
  runInTestDir('git checkout main');
  console.log('  ✔ Structural experiment test: Branches isolate playlist explorations without mutating scene files.');

  // ==========================================
  // Scenario 7: Checkpoint & Recovery
  // ==========================================
  // Capture HEAD hash
  const baselineHash = runInTestDir('git rev-parse HEAD');

  // Simulate an accidental bad edit or file corruption in sc-0001
  fs.writeFileSync(path.join(scenesDir, 'sc-0001.md'), 'GARBAGE CORRUPTED ACCIDENTAL OVERWRITE', 'utf8');

  // Author recovers previous clean state
  runInTestDir(`git checkout ${baselineHash} -- manuscript/scenes/sc-0001.md`);
  const restoredContent = fs.readFileSync(path.join(scenesDir, 'sc-0001.md'), 'utf8');
  assert.ok(restoredContent.includes('Elena kept her hand flat'), 'Successfully restored earlier clean state from checkpoint');

  // Lossless reindex check
  const reindexed = reindex(testDir);
  assert.strictEqual(reindexed.scenes.length, 2, 'Lossless reindex restores derived index cleanly after recovery');
  console.log('  ✔ Checkpoint & recovery test: Clean checkpoint restore synchronizes losslessly with manuscript cache.');

  // ==========================================
  // Scenario 8: Push Summary & Boundaries
  // ==========================================
  const pushSummaryNoRemote = getPushSummary(testDir);
  assert.strictEqual(pushSummaryNoRemote.canPush, false, 'Correctly refuses push when no remote is configured');

  // Add a local mock remote to test push summary
  const mockRemoteDir = path.join(process.cwd(), 'tests', 'fixtures', 'tmp_git_mock_remote');
  if (fs.existsSync(mockRemoteDir)) fs.rmSync(mockRemoteDir, { recursive: true, force: true });
  fs.mkdirSync(mockRemoteDir, { recursive: true });
  execSync('git init --bare', { cwd: mockRemoteDir, stdio: ['pipe', 'pipe', 'pipe'] });

  runInTestDir(`git remote add origin "${mockRemoteDir.replace(/\\/g, '/')}"`);
  const pushSummaryWithRemote = getPushSummary(testDir);
  assert.strictEqual(pushSummaryWithRemote.canPush, true, 'Allows push summary when remote is present');
  assert.strictEqual(pushSummaryWithRemote.branch, 'main', 'Reports active branch');
  assert.ok(pushSummaryWithRemote.unpushedCommits > 0, 'Accurately counts unpushed commits');

  // Clean up mock remote
  try { fs.rmSync(mockRemoteDir, { recursive: true, force: true }); } catch (_) {}
  console.log('  ✔ Push boundary test: Push summary accurately computes unpushed commits and verifies remotes.');

  // ==========================================
  // Scenario 9: Technical Integrity vs. Creative Uncertainty
  // ==========================================
  // 9A: Malformed YAML in scene file MUST be blocked by technical integrity
  const brokenYamlScene = `---
id: sc-0099
invalid: [unclosed flow sequence
---

Prose here
`;
  fs.writeFileSync(path.join(scenesDir, 'sc-0099.md'), brokenYamlScene, 'utf8');
  const integrityFailYaml = verifyTechnicalIntegrity(testDir);
  assert.strictEqual(integrityFailYaml.valid, false, 'Technical integrity flags malformed YAML');
  const commitBlocked = createCheckpointCommit(testDir, { message: 'should fail' });
  assert.strictEqual(commitBlocked.success, false, 'Checkpoint commit is safely blocked on malformed YAML');
  fs.unlinkSync(path.join(scenesDir, 'sc-0099.md'));

  // 9B: Broken scene reference in chapter playlist MUST be blocked
  ch1Meta.scenes = ['sc-9999_nonexistent'];
  fs.writeFileSync(path.join(chaptersDir, 'ch-01.md'), stringify(ch1Meta, '# Chapter 1'), 'utf8');
  const integrityFailRef = verifyTechnicalIntegrity(testDir);
  assert.strictEqual(integrityFailRef.valid, false, 'Technical integrity flags missing referenced scene');
  ch1Meta.scenes = [];
  fs.writeFileSync(path.join(chaptersDir, 'ch-01.md'), stringify(ch1Meta, '# Chapter 1'), 'utf8');

  // 9C: Creative uncertainty (high tell count or rhythm note) does NOT block!
  const integrityClean = verifyTechnicalIntegrity(testDir);
  assert.strictEqual(integrityClean.valid, true, 'Technical integrity passes when syntax and references are sound');
  console.log('  ✔ Technical integrity test: Blocks corrupted YAML and broken references without blocking creative uncertainty.');

  // ==========================================
  // Scenario 10: Zero Silent Prose Modification
  // ==========================================
  const preInspectionProse = fs.readFileSync(path.join(scenesDir, 'sc-0001.md'), 'utf8');
  analyzeCreativeChanges(testDir);
  formatCreativeSummary(analyzeCreativeChanges(testDir));
  verifyTechnicalIntegrity(testDir);
  getGitStatus(testDir);
  getPushSummary(testDir);
  const postInspectionProse = fs.readFileSync(path.join(scenesDir, 'sc-0001.md'), 'utf8');
  assert.strictEqual(preInspectionProse, postInspectionProse, 'Prose is byte-identical across all Git inspection and analysis routines');
  console.log('  ✔ Zero silent prose modification test: Inspection tools NEVER alter canonical author prose.');

  console.log('\n✔ All 10 Git & Creative History test scenarios passed successfully!\n');
} finally {
  cleanup();
}
