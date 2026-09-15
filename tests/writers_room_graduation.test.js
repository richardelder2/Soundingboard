/**
 * Test Suite: Writer's Room, Scene Graduation, Flat Scene Pool, and Preferences
 */

import * as fs from 'fs';
import * as path from 'path';
import assert from 'assert';
import { reindex } from '../scripts/reindex.js';
import { findScenePath } from '../scripts/hash_staleness.js';
import { assessModelHealth } from '../scripts/model_health.js';
import { compileManuscript } from '../scripts/compile_manuscript.js';
import { parse, stringify } from '../scripts/frontmatter.js';

const tempTestDir = path.join(process.cwd(), 'tests', 'fixtures', 'tmp_writers_room_test');

function cleanup() {
  if (fs.existsSync(tempTestDir)) {
    fs.rmSync(tempTestDir, { recursive: true, force: true });
  }
}

console.log('\n--- Running Writer\'s Room & Scene Graduation Test Suite ---');

cleanup();
fs.mkdirSync(tempTestDir, { recursive: true });

try {
  // 1. Scaffold preferences.md at root
  const prefContent = `---
author_name: "Elena Rostova"
working_mode: "solo"
primary_editor: "obsidian"
ai_prose_generation: "never"
editorial_style: "bracket"
tell_tolerance: "advisory"
form: "novel"
target_words: 85000
---

# Author Preferences
`;
  fs.writeFileSync(path.join(tempTestDir, 'preferences.md'), prefContent, 'utf8');

  // 2. Scaffold writers_room/ with notes and drafts
  const roomDir = path.join(tempTestDir, 'writers_room');
  fs.mkdirSync(path.join(roomDir, 'notes'), { recursive: true });
  fs.mkdirSync(path.join(roomDir, 'drafts'), { recursive: true });
  fs.mkdirSync(path.join(roomDir, 'inputs'), { recursive: true });

  // Add raw draft in writers_room/drafts/
  const rawDraftContent = `# The Alley Confrontation

Elena pulled her coat tighter against the freezing sleet. The messenger had lied.
She knew it the moment the lantern glass cracked.
`;
  fs.writeFileSync(path.join(roomDir, 'drafts', 'dock_fight.md'), rawDraftContent, 'utf8');

  // 3. Verify Model Health ignores writers_room by default (Immunity Shield)
  const healthInit = assessModelHealth(tempTestDir);
  assert.strictEqual(healthInit.schema, 'uninitialized', 'Uninitialized workspace with only writers_room reports uninitialized without failure');

  // 4. Setup flat scene pool in manuscript/scenes/
  const manuscriptDir = path.join(tempTestDir, 'manuscript');
  const scenesPoolDir = path.join(manuscriptDir, 'scenes');
  const chaptersPoolDir = path.join(manuscriptDir, 'chapters');
  fs.mkdirSync(scenesPoolDir, { recursive: true });
  fs.mkdirSync(chaptersPoolDir, { recursive: true });

  // Create scene sc-0001 in flat pool
  const sc1Meta = {
    id: 'sc-0001',
    pov: 'Elena Rostova',
    location: 'Lower Docks',
    threads: ['th-01'],
    value_in: 'Suspicion (+1)',
    value_out: 'Ambush (-2)',
    commandments: {
      inciting_incident: 'Lantern glass cracks',
      progressive_complication: 'Shadows surround the alley',
      crisis: 'Draw blade or surrender',
      climax: 'Draws blade and lunges',
      resolution: 'Disarms first assailant'
    },
    status: 'drafted',
    schema: '2.0'
  };
  const sc1Body = 'Elena drew her dagger as the shadows converged around the iron lamppost.';
  fs.writeFileSync(path.join(scenesPoolDir, 'sc-0001.md'), stringify(sc1Meta, sc1Body), 'utf8');

  // Create floating scene sc-0002 (unassigned to any chapter)
  const sc2Meta = {
    id: 'sc-0002',
    pov: 'Elena Rostova',
    location: 'The Bell Tower',
    threads: ['th-01'],
    value_in: 'Relief (+1)',
    value_out: 'Discovery (-1)',
    commandments: {
      inciting_incident: 'Reaches the bells',
      progressive_complication: 'Sees the city guard marching',
      crisis: 'Ring the alarm or hide',
      climax: 'Pulls the bronze rope',
      resolution: 'Bells echo across the harbor'
    },
    status: 'drafted',
    schema: '2.0'
  };
  const sc2Body = 'The bronze bell swung with a deafening groan, vibrating in her teeth.';
  fs.writeFileSync(path.join(scenesPoolDir, 'sc-0002.md'), stringify(sc2Meta, sc2Body), 'utf8');

  // 5. Create chapter playlist in manuscript/chapters/ch-01.md referencing sc-0001
  const ch1Meta = {
    id: 'ch-01',
    number: 1,
    title: 'The Ambush at the Docks',
    scenes: ['sc-0001'],
    break_rationale: 'Ends on the cliffhanger before the bell tower.',
    status: 'passed'
  };
  fs.writeFileSync(path.join(chaptersPoolDir, 'ch-01.md'), stringify(ch1Meta, ''), 'utf8');

  // 6. Test reindex() with flat pool and preferences.md
  const index = reindex(tempTestDir);
  assert.strictEqual(index.author, 'Elena Rostova', 'reindex reads author from root preferences.md');
  assert.strictEqual(index.target_words, 85000, 'reindex reads target_words from root preferences.md');
  assert.strictEqual(index.scenes.length, 2, 'reindex finds all scenes in flat pool');
  assert.strictEqual(index.chapters.length, 1, 'reindex finds chapter playlist');
  assert.deepStrictEqual(index.unassigned_scenes, ['sc-0002'], 'reindex correctly identifies floating scene sc-0002');
  console.log('  ✔ reindex() detects scenes in flat pool, playlist chapters, and unassigned floating scenes.');

  // 7. Test findScenePath()
  const foundSc1 = findScenePath('sc-0001', tempTestDir);
  assert(foundSc1 && foundSc1.includes('scenes'), 'findScenePath finds scene in flat pool');
  console.log('  ✔ findScenePath() resolves flat pool paths accurately.');

  // 8. Test Model Health with flat pool
  const health = assessModelHealth(tempTestDir);
  assert.strictEqual(health.schema, '2.0', 'Identifies 2.0 schema');
  assert.strictEqual(health.scenes.total, 2, 'Inventories 2 scenes');
  assert.strictEqual(health.chapters.missingRationale.length, 0, 'No missing rationales on valid playlist');
  console.log('  ✔ Model Health console accurately evaluates flat scene pool.');

  // 9. Test compilation of playlist chapter
  // Create mock gate verdict so checkChapterGate passes
  const vDir = path.join(tempTestDir, 'stages', '04_diagnostics_edits', 'output', 'verdicts', 'ch01');
  fs.mkdirSync(vDir, { recursive: true });
  for (const check of ['scan', 'canon_check', 'rubric', 'ledger_delivery']) {
    fs.writeFileSync(path.join(vDir, `${check}.json`), JSON.stringify({ verdict: 'PASS' }), 'utf8');
  }

  const res = compileManuscript([], { rootDir: tempTestDir });
  assert.strictEqual(res.chapterCount, 1, 'Compiled 1 chapter');
  assert.strictEqual(res.sceneCount, 1, 'Compiled 1 scene from playlist');
  console.log('  ✔ compileManuscript resolves playlist chapters and compiles cleanly.');

  console.log('\n✔ All Writer\'s Room & Scene Graduation tests passed successfully (9/9)!\n');
} finally {
  cleanup();
}
