/**
 * Test Suite for Multi-Tier Manuscript Compiler (SB2-P3-01)
 * Zero external runtime dependencies; built-in Node only.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {
  compileManuscript,
  resolveSceneBreakHtml,
  resolveChapterScenes,
  mdToHtml
} from '../scripts/compile_manuscript.js';

const rootDir = process.cwd();
const testTmpDir = path.join(rootDir, 'tests', 'fixtures', 'tmp_compile_test');

console.log('\n--- Running Multi-Tier Manuscript Compiler Test Suite (SB2-P3-01) ---');

function setupTestEnv() {
  fs.mkdirSync(testTmpDir, { recursive: true });
  const manuscriptDir = path.join(testTmpDir, 'manuscript');
  const ch1Dir = path.join(manuscriptDir, 'ch-01');
  const ch2Dir = path.join(manuscriptDir, 'ch-02');
  fs.mkdirSync(ch1Dir, { recursive: true });
  fs.mkdirSync(ch2Dir, { recursive: true });

  // Chapter 1: 2 scenes (sc-0001, sc-0002)
  const ch1Meta = [
    '---',
    'id: ch-01',
    'number: 1',
    'title: The Gathering Mist',
    'scenes:',
    '  - sc-0001',
    '  - sc-0002',
    'break_rationale: "Cliffhanger on midnight toll"',
    '---'
  ].join('\n');
  fs.writeFileSync(path.join(ch1Dir, 'chapter.md'), ch1Meta, 'utf8');

  const sc1 = [
    '---',
    'id: sc-0001',
    'type: scene',
    'title: Harbor Arrival',
    '---',
    'Evelyn stepped onto the rain-slicked dock. The cold wind bit at her neck.',
    'A bell rang out in the darkness.'
  ].join('\n');
  fs.writeFileSync(path.join(ch1Dir, 'sc-0001.md'), sc1, 'utf8');

  const sc2 = [
    '---',
    'id: sc-0002',
    'type: scene',
    'title: The Alleyway Shadow',
    '---',
    'Across the cobblestones, a lantern flickered.',
    'Someone called her name from the fog.'
  ].join('\n');
  fs.writeFileSync(path.join(ch1Dir, 'sc-0002.md'), sc2, 'utf8');

  // Chapter 2: References non-existent sc-0004 to test fail-loud behavior
  const ch2Meta = [
    '---',
    'id: ch-02',
    'number: 2',
    'title: Missing Trail',
    'scenes:',
    '  - sc-0003',
    '  - sc-0004',
    'break_rationale: "Abrupt turn"',
    '---'
  ].join('\n');
  fs.writeFileSync(path.join(ch2Dir, 'chapter.md'), ch2Meta, 'utf8');

  const sc3 = [
    '---',
    'id: sc-0003',
    'type: scene',
    'title: The Tavern Door',
    '---',
    'The tavern was warm and smelling of roasted cloves.'
  ].join('\n');
  fs.writeFileSync(path.join(ch2Dir, 'sc-0003.md'), sc3, 'utf8');

  // manuscript.json production ledger
  const manifest = {
    schema_version: '2.0.0',
    title: 'The Silent Harbor',
    author: 'A. R. Sterling',
    chapters: [
      { id: 1, title: 'The Gathering Mist', status: 'passed' },
      { id: 2, title: 'Missing Trail', status: 'passed' }
    ]
  };
  fs.writeFileSync(path.join(testTmpDir, 'manuscript.json'), JSON.stringify(manifest, null, 2), 'utf8');

  // Stage 04 Gate verdicts for Chapter 1 (all 4 passed)
  const v1Dir = path.join(testTmpDir, 'stages', '04_diagnostics_edits', 'output', 'verdicts', 'ch01');
  fs.mkdirSync(v1Dir, { recursive: true });
  for (const check of ['scan', 'canon_check', 'rubric', 'ledger_delivery']) {
    fs.writeFileSync(path.join(v1Dir, `${check}.json`), JSON.stringify({ check, verdict: 'PASS' }), 'utf8');
  }

  // Stage 04 Gate verdicts for Chapter 2 (all 4 passed)
  const v2Dir = path.join(testTmpDir, 'stages', '04_diagnostics_edits', 'output', 'verdicts', 'ch02');
  fs.mkdirSync(v2Dir, { recursive: true });
  for (const check of ['scan', 'canon_check', 'rubric', 'ledger_delivery']) {
    fs.writeFileSync(path.join(v2Dir, `${check}.json`), JSON.stringify({ check, verdict: 'PASS' }), 'utf8');
  }
}

function teardownTestEnv() {
  if (fs.existsSync(testTmpDir)) {
    fs.rmSync(testTmpDir, { recursive: true, force: true });
  }
}

try {
  setupTestEnv();

  // Test 1: resolveSceneBreakHtml variations
  assert.strictEqual(resolveSceneBreakHtml('***'), '<hr class="scene-break scene-break-asterisks">');
  assert.strictEqual(resolveSceneBreakHtml('blank'), '<div class="scene-break scene-break-blank"></div>');
  assert.strictEqual(resolveSceneBreakHtml('none'), '');
  assert.strictEqual(resolveSceneBreakHtml('---'), '<hr class="scene-break scene-break-line">');
  assert.strictEqual(resolveSceneBreakHtml('~ ~ ~'), '<div class="scene-break scene-break-custom"><span class="scene-break-glyph">~ ~ ~</span></div>');
  console.log('  ✔ resolveSceneBreakHtml generates expected HTML for all break styles.');

  // Test 2: mdToHtml with markdown formatting
  const sampleMd = '## Scene Header\n\n**Bold text** and *italic words*.\n\n---\n\nSecond paragraph.';
  const htmlOutput = mdToHtml(sampleMd, '***');
  assert.ok(htmlOutput.includes('<h2>Scene Header</h2>'));
  assert.ok(htmlOutput.includes('<strong>Bold text</strong>'));
  assert.ok(htmlOutput.includes('<em>italic words</em>'));
  assert.ok(htmlOutput.includes('hr class="scene-break'));
  console.log('  ✔ mdToHtml correctly formats markdown prose and scene break glyphs.');

  // Test 3: Fail-loud behavior on missing scene (PRD §5 / §16)
  // ch-02 lists sc-0004 which does not exist
  let caughtError = null;
  try {
    resolveChapterScenes('ch-02', testTmpDir, false);
  } catch (err) {
    caughtError = err;
  }
  assert.ok(caughtError, 'Halted loudly when scene was missing');
  assert.ok(caughtError.message.includes('sc-0004'), 'Error identifies missing scene ID');
  console.log('  ✔ Fail-loud verification halts compilation immediately when a scene is missing.');

  // Test 4: resolveChapterScenes with ignoreMissing=true (graceful fallback)
  const resolvedCh2Forced = resolveChapterScenes('ch-02', testTmpDir, true);
  assert.strictEqual(resolvedCh2Forced.sceneFiles.length, 1, 'Includes surviving scene sc-0003');
  console.log('  ✔ resolveChapterScenes honors ignoreMissing flag when forced.');

  // Test 5: Full 2.0 manuscript compilation of Chapter 1 with default break glyph
  // Temporarily remove ch-02 from manifest so we test a clean full compilation
  const cleanManifest = {
    schema_version: '2.0.0',
    title: 'The Silent Harbor',
    author: 'A. R. Sterling',
    chapters: [
      { id: 1, title: 'The Gathering Mist', status: 'passed' }
    ]
  };
  fs.writeFileSync(path.join(testTmpDir, 'manuscript.json'), JSON.stringify(cleanManifest, null, 2), 'utf8');

  const compRes = compileManuscript([], { rootDir: testTmpDir });
  assert.strictEqual(compRes.chaptersCount, 1);
  assert.strictEqual(compRes.scenesCount, 2);
  assert.strictEqual(fs.existsSync(compRes.htmlPath), true);

  const compiledHtml = fs.readFileSync(compRes.htmlPath, 'utf8');
  assert.ok(compiledHtml.includes('<h1>The Silent Harbor</h1>'));
  assert.ok(compiledHtml.includes('A. R. Sterling'));
  assert.ok(compiledHtml.includes('The Gathering Mist'));
  assert.ok(compiledHtml.includes('Evelyn stepped onto the rain-slicked dock.'));
  assert.ok(compiledHtml.includes('Someone called her name from the fog.'));
  assert.ok(compiledHtml.includes('hr class="scene-break scene-break-asterisks"'));
  console.log('  ✔ Compiles atomic scenes -> chapter -> byte-clean manuscript HTML with scene break glyph.');

  // Test 6: Configurable scene break glyphs in compilation (--break=blank)
  const compBlank = compileManuscript(['--break=blank'], { rootDir: testTmpDir });
  const htmlBlank = fs.readFileSync(compBlank.htmlPath, 'utf8');
  assert.ok(htmlBlank.includes('div class="scene-break scene-break-blank"'));
  console.log('  ✔ Compiles successfully with custom scene break glyph (--break=blank).');

  // Test 7: Configurable scene break glyphs in compilation (--break="none")
  const compNone = compileManuscript(['--break=none'], { rootDir: testTmpDir });
  const htmlNone = fs.readFileSync(compNone.htmlPath, 'utf8');
  const chapterSection = htmlNone.match(/<section class="chapter">[\s\S]*?<\/section>/)[0];
  assert.ok(!chapterSection.includes('scene-break'));
  console.log('  ✔ Compiles successfully with no scene break divider (--break=none).');

  console.log('\n\x1b[32m✔ All Multi-Tier Manuscript Compiler tests passed (7/7)!\x1b[0m\n');
} finally {
  teardownTestEnv();
}
