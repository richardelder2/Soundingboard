import * as fs from 'fs';
import * as path from 'path';
import assert from 'assert';
import { writeGuarded, checkMigrationGate, ConcurrencyConflictError } from '../scripts/concurrency.js';
import { hashContent } from '../scripts/hash_staleness.js';

console.log('Testing scripts/concurrency.js ...');

const tempDir = path.join('tests', 'fixtures', 'temp_concurrency_test');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

try {
  const testSceneFile = path.join(tempDir, 'sc-0001.md');
  const initialText = '---\nid: sc-0001\n---\n\nInitial version written by author.';
  fs.writeFileSync(testSceneFile, initialText, 'utf8');

  const initialHash = hashContent(initialText);

  // 1. Guarded write with matching hash should succeed
  const updateText1 = '---\nid: sc-0001\n---\n\nUpdated version by agent.';
  writeGuarded(testSceneFile, updateText1, initialHash);

  assert.strictEqual(fs.readFileSync(testSceneFile, 'utf8'), updateText1);
  console.log('✔ PASS: writeGuarded succeeds when expected hash matches disk hash');

  // 2. Simulate concurrent modification on disk by the author
  const authorIntervention = '---\nid: sc-0001\n---\n\nAuthor edited this in their editor concurrently.';
  fs.writeFileSync(testSceneFile, authorIntervention, 'utf8');

  // 3. Agent attempts to write with stale hash (initialHash or updateText1 hash)
  let conflictCaught = false;
  try {
    writeGuarded(testSceneFile, 'Stale agent edit that must fail', initialHash);
  } catch (err) {
    assert.ok(err instanceof ConcurrencyConflictError);
    assert.ok(err.message.includes('Refusing to overwrite'));
    assert.ok(err.message.includes('sc-0001.md'));
    conflictCaught = true;
  }

  assert.ok(conflictCaught, 'Must throw ConcurrencyConflictError on stale write');

  // 4. Verify file on disk was UNTOUCHED (author's edit was preserved)
  assert.strictEqual(fs.readFileSync(testSceneFile, 'utf8'), authorIntervention);
  console.log('✔ PASS: Refused stale write without modifying file on disk (PRD §9 / Brief SB2-P0-06)');

  // 5. Test Migration Gate
  // Create an unmigrated fixture with unit_type: "chapter"
  const unmigratedManifest = {
    schema_version: '2.0.0',
    unit_type: 'chapter',
    chapters: [{ id: 1, title: 'Old Chapter' }]
  };
  const manifestPath = path.join(tempDir, 'manuscript.json');
  fs.writeFileSync(manifestPath, JSON.stringify(unmigratedManifest, null, 2), 'utf8');

  const gateResult = checkMigrationGate(tempDir, { silent: true });
  assert.strictEqual(gateResult, false, 'Unmigrated project must fail migration gate');
  console.log('✔ PASS: Unmigrated fixture correctly rejected by migration gate');

  // Update manifest to unit_type: "scene"
  unmigratedManifest.unit_type = 'scene';
  fs.writeFileSync(manifestPath, JSON.stringify(unmigratedManifest, null, 2), 'utf8');

  const gateMigratedResult = checkMigrationGate(tempDir, { silent: true });
  assert.strictEqual(gateMigratedResult, true, 'Migrated project must pass migration gate');
  console.log('✔ PASS: Migrated scene-based project passes migration gate');

  console.log('\nAll concurrency & migration gate tests passed successfully!\n');
} finally {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
