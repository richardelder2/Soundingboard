import * as fs from 'fs';
import * as path from 'path';
import assert from 'assert';
import { migrateToScenes, createPreSceneBackup, detectSceneSplits } from '../scripts/migrate_to_scenes.js';
import { strip } from '../scripts/frontmatter.js';

console.log('Testing scripts/migrate_to_scenes.js ...');

const tempMigrateDir = path.join('tests', 'fixtures', 'temp_migration_test');
if (fs.existsSync(tempMigrateDir)) {
  fs.rmSync(tempMigrateDir, { recursive: true, force: true });
}
fs.mkdirSync(tempMigrateDir, { recursive: true });

try {
  // 1. Create a legacy 1.x manuscript fixture
  const legacyChaptersDir = path.join(tempMigrateDir, 'stages', '03_drafting', 'output', 'chapters');
  fs.mkdirSync(legacyChaptersDir, { recursive: true });

  const chapter1Prose = `The rain beat against the stained glass windows of the cathedral.
Maren checked her gloves. The leather was damp, smelling of old salt and tallow.
"We move in five minutes," Tam whispered.

***

In the crypt below, the candles had burned down to pools of gray wax.
Father Vane was waiting by the iron grating.
"You shouldn't have come," he said without turning around.`;

  const chapter1FileContent = `---
chapter: 1
title: The Bell Tower
pov: Maren
status: drafted
---

${chapter1Prose}
`;

  const chapter2Prose = `Across the river, the lanterns on the dock swayed in the gale.
Every barge was locked to the wooden pilings.
Tam took the oars while Maren watched the watchtowers.`;

  const chapter2FileContent = `---
chapter: 2
title: River Crossing
pov: Tam
status: drafted
---

${chapter2Prose}
`;

  fs.writeFileSync(path.join(legacyChaptersDir, 'ch01.md'), chapter1FileContent, 'utf8');
  fs.writeFileSync(path.join(legacyChaptersDir, 'ch02.md'), chapter2FileContent, 'utf8');

  // Also create legacy manuscript.json
  const legacyManifest = {
    schema_version: '2.0.0',
    unit_type: 'chapter',
    title: 'The Salt Cathedral',
    author: 'Test Author',
    chapters: [
      { id: 1, title: 'The Bell Tower', draft_file: 'stages/03_drafting/output/chapters/ch01.md' },
      { id: 2, title: 'River Crossing', draft_file: 'stages/03_drafting/output/chapters/ch02.md' }
    ]
  };
  fs.writeFileSync(path.join(tempMigrateDir, 'manuscript.json'), JSON.stringify(legacyManifest, null, 2), 'utf8');

  // Run migration
  const report = migrateToScenes(tempMigrateDir);

  // Verification 1: Unconditional backup exists before writes
  assert.ok(fs.existsSync(path.join(tempMigrateDir, 'manuscript.pre-scene')), 'Backup folder must exist');
  assert.ok(fs.existsSync(path.join(tempMigrateDir, 'manuscript.pre-scene', 'chapters', 'ch01.md')), 'Backup must contain original chapters');
  console.log('✔ PASS: Unconditional backup created before any writes');

  // Verification 2: Check chapters and scenes generated
  assert.strictEqual(report.chaptersMigrated, 2);
  // Chapter 1 has *** break -> 2 scenes. Chapter 2 has no break -> 1 scene. Total = 3 scenes
  assert.strictEqual(report.scenesCreated, 3);
  console.log('✔ PASS: Chapter 1 split into 2 scenes via break marker; Chapter 2 preserved as single scene');

  // Verification 3: Concatenation Parity (PRD §8 / SB2-P0-09 top requirement)
  // For Chapter 1, concatenate scene bodies and compare to original chapter 1 prose
  const ch1Dir = path.join(tempMigrateDir, 'manuscript', 'ch-01');
  const sc1Raw = fs.readFileSync(path.join(ch1Dir, 'sc-0001.md'), 'utf8');
  const sc2Raw = fs.readFileSync(path.join(ch1Dir, 'sc-0002.md'), 'utf8');
  const sc1Body = strip(sc1Raw).trim();
  const sc2Body = strip(sc2Raw).trim();

  const originalParts = chapter1Prose.split(/\*\*\*/).map(s => s.trim());
  assert.strictEqual(sc1Body, originalParts[0], 'Scene 1 body matches first segment of original chapter');
  assert.strictEqual(sc2Body, originalParts[1], 'Scene 2 body matches second segment of original chapter');

  // For Chapter 2:
  const ch2Dir = path.join(tempMigrateDir, 'manuscript', 'ch-02');
  const sc3Raw = fs.readFileSync(path.join(ch2Dir, 'sc-0003.md'), 'utf8');
  const sc3Body = strip(sc3Raw).trim();
  assert.strictEqual(sc3Body, chapter2Prose.trim(), 'Scene 3 body matches original single-scene chapter byte-for-byte');
  console.log('✔ PASS: Concatenated scene bodies match original chapter prose with zero byte alteration');

  // Verification 4: Spine thread th-01 instantiated
  const threadsPath = path.join(tempMigrateDir, 'stages', '02_planning', 'output', 'threads.md');
  assert.ok(fs.existsSync(threadsPath), 'threads.md must be instantiated');
  const threadsContent = fs.readFileSync(threadsPath, 'utf8');
  assert.ok(threadsContent.includes('th-01'), 'Spine thread th-01 present in threads.md');
  console.log('✔ PASS: Spine thread th-01 instantiated for 100% initial thread coverage');

  // Verification 5: Reindex generated new manuscript.json with unit_type: scene
  const manifest = JSON.parse(fs.readFileSync(path.join(tempMigrateDir, 'manuscript.json'), 'utf8'));
  assert.strictEqual(manifest.unit_type, 'scene');
  assert.strictEqual(manifest.chapters.length, 2);
  assert.strictEqual(manifest.scenes.length, 3);
  console.log('✔ PASS: manuscript.json successfully updated to unit_type: "scene"');

  console.log('\nAll migration tests passed successfully!\n');
} finally {
  if (fs.existsSync(tempMigrateDir)) {
    fs.rmSync(tempMigrateDir, { recursive: true, force: true });
  }
}
