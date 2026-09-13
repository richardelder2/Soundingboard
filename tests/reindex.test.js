import * as fs from 'fs';
import * as path from 'path';
import assert from 'assert';
import { reindex } from '../scripts/reindex.js';

console.log('Testing scripts/reindex.js ...');

const tempProjectDir = path.join('tests', 'fixtures', 'temp_reindex_test');
if (fs.existsSync(tempProjectDir)) {
  fs.rmSync(tempProjectDir, { recursive: true, force: true });
}
fs.mkdirSync(tempProjectDir, { recursive: true });

try {
  // Create fixture manuscript
  const ch1Dir = path.join(tempProjectDir, 'manuscript', 'ch-01');
  fs.mkdirSync(ch1Dir, { recursive: true });

  const chapter1Md = `---
id: ch-01
number: 1
title: The Awakening
scenes: [sc-0001, sc-0002]
break_rationale: Ends on the warning horn before the wall falls.
status: drafted
schema: 2.0
---
`;
  fs.writeFileSync(path.join(ch1Dir, 'chapter.md'), chapter1Md);

  const scene1Md = `---
id: sc-0001
chapter: ch-01
pov: Maren
location: Watchtower, dusk
threads: [th-01]
value_in: Vigilance (+)
value_out: Ambush (--)
commandments:
  inciting_incident: Rider crosses the moat
  progressive_complication: Rider carries no banner
  crisis: Sound the horn or verify identity
  climax: She blows the brass horn
  resolution: The garrison stirs into panic
voice_anchor: null
anchor_provisional: false
craft_modules: [okf-042]
status: drafted
schema: 2.0
---

The north wind carried the reek of marsh gas up the ramparts...
`;
  fs.writeFileSync(path.join(ch1Dir, 'sc-0001.md'), scene1Md);

  const scene2Md = `---
id: sc-0002
chapter: ch-01
pov: Tam
location: Lower courtyard
threads: [th-01, th-02]
value_in: Calm (+)
value_out: Chaos (--)
commandments:
  inciting_incident: The brass horn sounds
  progressive_complication: Stable doors are bolted from outside
  crisis: Kick open the side door or scale the loft
  climax: He kicks through the rotted oak
  resolution: Horses bolt into the alley
voice_anchor: sc-0001
anchor_provisional: false
craft_modules: []
status: drafted
schema: 2.0
---

Tam had two nails in his teeth when the horn broke the evening quiet...
`;
  fs.writeFileSync(path.join(ch1Dir, 'sc-0002.md'), scene2Md);

  // Run reindex to generate initial manuscript.json
  reindex(tempProjectDir);

  const manifestPath = path.join(tempProjectDir, 'manuscript.json');
  assert.ok(fs.existsSync(manifestPath), 'manuscript.json must exist after reindex');

  const originalContent = fs.readFileSync(manifestPath, 'utf8');

  // Now delete manuscript.json
  fs.unlinkSync(manifestPath);
  assert.ok(!fs.existsSync(manifestPath), 'manuscript.json must be deleted');

  // Re-run reindex
  reindex(tempProjectDir);

  const regeneratedContent = fs.readFileSync(manifestPath, 'utf8');

  // Byte-identical comparison: PRD §4 Criterion 1
  assert.strictEqual(regeneratedContent, originalContent, 'Rebuilt manuscript.json must be byte-identical to original');
  console.log('✔ PASS: rm manuscript.json && reindex produces byte-identical file (PRD §4 Criterion 1)');

  const index = JSON.parse(regeneratedContent);
  assert.strictEqual(index.unit_type, 'scene');
  assert.strictEqual(index.chapters.length, 1);
  assert.strictEqual(index.scenes.length, 2);
  assert.deepStrictEqual(index.chapters[0].scenes, ['sc-0001', 'sc-0002']);
  assert.strictEqual(index.scenes[0].id, 'sc-0001');
  assert.strictEqual(index.scenes[1].id, 'sc-0002');
  assert.ok(index.total_words > 20);
  console.log('✔ PASS: Derived index fields match scene frontmatter specifications');

  console.log('\nAll reindex tests passed successfully!\n');
} finally {
  if (fs.existsSync(tempProjectDir)) {
    fs.rmSync(tempProjectDir, { recursive: true, force: true });
  }
}
