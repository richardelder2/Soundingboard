/**
 * Test Suite for Thread Lane Visualizer (SB2-P3-02)
 * Zero external runtime dependencies; built-in Node only.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {
  generateThreadLaneHtml,
  runThreadVisualizerCli
} from '../scripts/thread_visualizer.js';

const rootDir = process.cwd();
const testTmpDir = path.join(rootDir, 'tests', 'fixtures', 'tmp_thread_viz_test');

console.log('\n--- Running Thread Lane Visualizer Test Suite (SB2-P3-02) ---');

function setupTestEnv() {
  fs.mkdirSync(testTmpDir, { recursive: true });
  const planningDir = path.join(testTmpDir, 'stages', '02_planning', 'output');
  const manuscriptDir = path.join(testTmpDir, 'manuscript');
  const ch1Dir = path.join(manuscriptDir, 'ch-01');
  const ch2Dir = path.join(manuscriptDir, 'ch-02');

  fs.mkdirSync(planningDir, { recursive: true });
  fs.mkdirSync(ch1Dir, { recursive: true });
  fs.mkdirSync(ch2Dir, { recursive: true });

  // 1. Thread tracker definition
  const threadContent = [
    '---',
    'dormancy_threshold_words: 3000',
    'threads:',
    '  - id: th-01',
    '    name: Spine - The Guild Conspiracy',
    '    spine: true',
    '    value_spectrum: Truth / Deception',
    '  - id: th-02',
    '    name: Romance - Evelyn and Marcus',
    '    spine: false',
    '    value_spectrum: Intimacy / Distance',
    '---'
  ].join('\n');
  fs.writeFileSync(path.join(planningDir, 'threads.md'), threadContent, 'utf8');

  // 2. Chapter 1 scenes
  const sc1 = [
    '---',
    'id: sc-0001',
    'type: scene',
    'threads: [th-01]',
    'value_in: (-) Suspicion',
    'value_out: (+) Revelat',
    '---',
    'Prose content for scene one with ten words here right now.'
  ].join('\n');
  fs.writeFileSync(path.join(ch1Dir, 'sc-0001.md'), sc1, 'utf8');

  // Scene 2 is a braid point (both th-01 and th-02)
  const sc2 = [
    '---',
    'id: sc-0002',
    'type: scene',
    'threads: [th-01, th-02]',
    'value_in: (+) Trust',
    'value_out: (-) Betray',
    '---',
    'Prose content for scene two with ten more words for testing.'
  ].join('\n');
  fs.writeFileSync(path.join(ch1Dir, 'sc-0002.md'), sc2, 'utf8');

  // 3. Chapter 2 scenes
  // Scene 3 has unrecorded value shift (null value_out) to verify distinct coverage mark
  const sc3 = [
    '---',
    'id: sc-0003',
    'type: scene',
    'threads: [th-02]',
    '---',
    'Prose content for scene three with fifteen words to test dormancy and gaps.'
  ].join('\n');
  fs.writeFileSync(path.join(ch2Dir, 'sc-0003.md'), sc3, 'utf8');
}

function teardownTestEnv() {
  if (fs.existsSync(testTmpDir)) {
    fs.rmSync(testTmpDir, { recursive: true, force: true });
  }
}

try {
  setupTestEnv();

  // Test 1: Generate standalone interactive HTML file
  const htmlPath = generateThreadLaneHtml({ rootDir: testTmpDir });
  assert.strictEqual(fs.existsSync(htmlPath), true, 'Generates thread_lanes.html file');
  console.log('  ✔ generateThreadLaneHtml writes standalone thread_lanes.html.');

  // Test 2: Verify HTML contents and zero external CDN dependencies
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(htmlContent.includes('<svg'), 'Includes embedded SVG chart');
  assert.ok(!htmlContent.includes('http://') && !htmlContent.includes('https://cdn.'), 'Zero external CDN dependencies (completely self-contained)');
  assert.ok(htmlContent.includes('th-01'), 'Includes th-01 lane');
  assert.ok(htmlContent.includes('th-02'), 'Includes th-02 lane');
  assert.ok(htmlContent.includes('[SPINE]'), 'Distinguishes spine thread with tag');
  console.log('  ✔ HTML visualizer is completely zero-dependency and embeds SVG lanes.');

  // Test 3: Verify X-axis cumulative word-count scale
  assert.ok(htmlContent.includes('w</text>'), 'Word count X-axis rendered in SVG');
  assert.ok(htmlContent.includes('Total Word Count'), 'Telemetry summary displays word count');
  console.log('  ✔ Renders cumulative word-count X-axis.');

  // Test 4: Verify polarity vertical levels and trajectory lines
  assert.ok(htmlContent.includes('<polyline'), 'Draws connected trajectory polyline between scenes');
  assert.ok(htmlContent.includes('Positive Polarity Turn'), 'Legend includes positive polarity turn');
  assert.ok(htmlContent.includes('Negative Polarity Turn'), 'Legend includes negative polarity turn');
  console.log('  ✔ Renders polarity trajectories and vertical value levels.');

  // Test 5: Verify Braid Point polygon glyph
  // sc-0002 has both th-01 and th-02 -> rendered with polygon star
  assert.ok(htmlContent.includes('<polygon'), 'Renders star polygon mark for braid points');
  assert.ok(htmlContent.includes('Braid Point: Bound to th-01, th-02'), 'Braid point tooltip identifies linked threads');
  console.log('  ✔ Accurately marks multi-thread braid points with distinct glyph.');

  // Test 6: Verify Distinct mark for unrecorded value shifts (coverage principle PRD §16.4)
  // sc-0003 has no value shift -> rendered with dashed rect
  assert.ok(htmlContent.includes('stroke-dasharray="2,2"'), 'Renders distinct dashed mark for unrecorded value shift');
  assert.ok(htmlContent.includes('UNRECORDED (Coverage Gap)'), 'Tooltip explicitly notes unrecorded value shift');
  console.log('  ✔ Renders distinct coverage mark for unrecorded value shifts.');

  // Test 7: CLI runner executes without error
  const cliRes = runThreadVisualizerCli({ rootDir: testTmpDir });
  assert.strictEqual(fs.existsSync(cliRes.htmlPath), true);
  console.log('  ✔ runThreadVisualizerCli prints ASCII view and generates HTML artifact.');

  console.log('\n\x1b[32m✔ All Thread Lane Visualizer tests passed (7/7)!\x1b[0m\n');
} finally {
  teardownTestEnv();
}
