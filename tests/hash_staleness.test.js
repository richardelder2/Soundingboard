import * as fs from 'fs';
import * as path from 'path';
import assert from 'assert';
import { hashContent, hashSceneProse, buildComputedAgainst, checkStaleness } from '../scripts/hash_staleness.js';

console.log('Testing scripts/hash_staleness.js ...');

const tempHashDir = path.join('tests', 'fixtures', 'temp_hash_test');
if (fs.existsSync(tempHashDir)) {
  fs.rmSync(tempHashDir, { recursive: true, force: true });
}
fs.mkdirSync(tempHashDir, { recursive: true });

try {
  const chDir = path.join(tempHashDir, 'manuscript', 'ch-01');
  fs.mkdirSync(chDir, { recursive: true });

  const sc1Path = path.join(chDir, 'sc-0001.md');
  const sc2Path = path.join(chDir, 'sc-0002.md');

  fs.writeFileSync(sc1Path, '---\nid: sc-0001\n---\n\nInitial prose for scene one.');
  fs.writeFileSync(sc2Path, '---\nid: sc-0002\n---\n\nInitial prose for scene two.');

  // Create findings computed against sc-0001, sc-0002, and both
  const findingScene1 = {
    id: 'f-1',
    scope: 'scene',
    scene: 'sc-0001',
    defect: 'Repeated triad',
    computed_against: buildComputedAgainst(['sc-0001'], tempHashDir)
  };

  const findingScene2 = {
    id: 'f-2',
    scope: 'scene',
    scene: 'sc-0002',
    defect: 'Low olfactory register',
    computed_against: buildComputedAgainst(['sc-0002'], tempHashDir)
  };

  const findingChapter = {
    id: 'f-ch1',
    scope: 'chapter',
    chapter: 'ch-01',
    defect: 'Monotonous cadence',
    // Chapter-scoped finding computes against direct inputs only (the scenes in the chapter)
    computed_against: buildComputedAgainst(['sc-0001', 'sc-0002'], tempHashDir)
  };

  // Initially, none should be stale
  assert.strictEqual(checkStaleness(findingScene1, tempHashDir).isStale, false);
  assert.strictEqual(checkStaleness(findingScene2, tempHashDir).isStale, false);
  assert.strictEqual(checkStaleness(findingChapter, tempHashDir).isStale, false);
  console.log('✔ PASS: Initial findings are fresh (not stale)');

  // Now edit scene 1 (a change in sc-0001 prose)
  fs.writeFileSync(sc1Path, '---\nid: sc-0001\n---\n\nEdited prose for scene one with an update.');

  // Check staleness across all findings:
  // 1. findingScene1 must be stale
  const st1 = checkStaleness(findingScene1, tempHashDir);
  assert.strictEqual(st1.isStale, true, 'Finding for edited scene must be marked stale');
  assert.deepStrictEqual(st1.changedScenes, ['sc-0001']);

  // 2. findingScene2 must NOT be stale (sibling isolation!)
  const st2 = checkStaleness(findingScene2, tempHashDir);
  assert.strictEqual(st2.isStale, false, 'Sibling scene finding must NOT be marked stale');
  assert.deepStrictEqual(st2.changedScenes, []);

  // 3. What if a cosmetic frontmatter edit happens on sc-0002?
  // Only frontmatter changes; prose stays untouched
  fs.writeFileSync(sc2Path, '---\nid: sc-0002\nstatus: diagnosed\n---\n\nInitial prose for scene two.');
  const st2AfterFm = checkStaleness(findingScene2, tempHashDir);
  assert.strictEqual(st2AfterFm.isStale, false, 'Cosmetic frontmatter edit does NOT invalidate prose findings');

  console.log('✔ PASS: Editing scene 1 marks exactly finding 1 stale, preserving sibling scene 2');
  console.log('✔ PASS: Cosmetic frontmatter edits do not cause prose finding invalidation');

  console.log('\nAll hash_staleness tests passed successfully!\n');
} finally {
  if (fs.existsSync(tempHashDir)) {
    fs.rmSync(tempHashDir, { recursive: true, force: true });
  }
}
