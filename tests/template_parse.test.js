#!/usr/bin/env node

/**
 * Soundingboard 2.0 - Template Parse & Schema Test
 * Acceptance test for SB2-P1-01:
 * Verifies all markdown templates in _config/templates/ parse cleanly with scripts/frontmatter.js,
 * and manuscript.template.json is valid JSON with unit_type: "scene".
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from '../scripts/frontmatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

console.log('Testing template parsing with scripts/frontmatter.js ...');

const templatesDir = path.join(rootDir, '_config', 'templates');
const templateFiles = fs.readdirSync(templatesDir).filter(f => f.endsWith('.template.md'));

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✗ FAIL:\x1b[0m ${message}`);
    if (details) console.error(`    \x1b[90m${details}\x1b[0m`);
    failed++;
  }
}

// 1. Check all .template.md files parse frontmatter cleanly
for (const file of templateFiles) {
  const fullPath = path.join(templatesDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  try {
    const data = parse(content, fullPath);
    assert(typeof data === 'object' && data !== null, `Template parses cleanly: ${file}`);
  } catch (err) {
    assert(false, `Template parses cleanly: ${file}`, err.message);
  }
}

// 2. Check scene_card.template.md schema
const scPath = path.join(templatesDir, 'scene_card.template.md');
assert(fs.existsSync(scPath), 'scene_card.template.md exists');
if (fs.existsSync(scPath)) {
  const scData = parse(fs.readFileSync(scPath, 'utf8'), scPath);
  assert(scData.id === 'sc-0001', 'scene_card has id: sc-0001');
  assert(scData.chapter === 'ch-01', 'scene_card has chapter: ch-01');
  assert(scData.schema === '2.0', 'scene_card has schema: 2.0');
  assert(typeof scData.commandments === 'object', 'scene_card has nested commandments map');
  assert(Array.isArray(scData.threads), 'scene_card has threads array');
}

// 3. Check chapter.template.md schema
const chPath = path.join(templatesDir, 'chapter.template.md');
assert(fs.existsSync(chPath), 'chapter.template.md exists');
if (fs.existsSync(chPath)) {
  const chData = parse(fs.readFileSync(chPath, 'utf8'), chPath);
  assert(chData.id === 'ch-01', 'chapter has id: ch-01');
  assert(typeof chData.break_rationale === 'string' && chData.break_rationale.length > 0, 'chapter has non-empty break_rationale');
  assert(Array.isArray(chData.scenes), 'chapter has scenes array');
  assert(chData.schema === '2.0', 'chapter has schema: 2.0');
}

// 4. Check threads.template.md schema
const thPath = path.join(templatesDir, 'threads.template.md');
assert(fs.existsSync(thPath), 'threads.template.md exists');
if (fs.existsSync(thPath)) {
  const thData = parse(fs.readFileSync(thPath, 'utf8'), thPath);
  assert(thData.dormancy_threshold_words === 5000, 'threads template declares dormancy_threshold_words');
  const thContent = fs.readFileSync(thPath, 'utf8');
  assert(thContent.includes('th-01') && thContent.includes('Spine'), 'threads template includes th-01 Spine thread');
  assert(thContent.includes('Value Spectrum'), 'threads template includes Value Spectrum');
}

// 5. Check canon.template.md schema
const canonPath = path.join(templatesDir, 'canon.template.md');
assert(fs.existsSync(canonPath), 'canon.template.md exists');
if (fs.existsSync(canonPath)) {
  const canonData = parse(fs.readFileSync(canonPath, 'utf8'), canonPath);
  assert(canonData.schema === '2.0', 'canon template has schema: 2.0');
  const canonContent = fs.readFileSync(canonPath, 'utf8');
  assert(canonContent.includes('Established In') && canonContent.includes('Reader Known As Of') && canonContent.includes('Epistemic Status'),
    'canon template includes provenance, reader_known_as_of, and epistemic_status');
}

// 6. Check manuscript.template.json
const msJsonPath = path.join(templatesDir, 'manuscript.template.json');
assert(fs.existsSync(msJsonPath), 'manuscript.template.json exists');
if (fs.existsSync(msJsonPath)) {
  const msJson = JSON.parse(fs.readFileSync(msJsonPath, 'utf8'));
  assert(msJson.unit_type === 'scene', 'manuscript.template.json has unit_type: "scene"');
  assert(msJson.schema_version === '2.0.0', 'manuscript.template.json has schema_version: "2.0.0"');
  assert(Array.isArray(msJson.scenes) && msJson.scenes.length > 0, 'manuscript.template.json defines scenes array');
  assert(Array.isArray(msJson.chapters) && msJson.chapters.length > 0, 'manuscript.template.json defines chapters array');
}

if (failed > 0) {
  console.error(`\n\x1b[31mFailed: ${failed} tests failed!\x1b[0m`);
  process.exit(1);
} else {
  console.log(`\n\x1b[32m✔ All ${passed} template parse tests passed successfully!\x1b[0m\n`);
}
