#!/usr/bin/env node

/**
 * Soundingboard — Red Pen Mechanical Enforcement Engine Tests
 * Verifies the Bracket Invariant, mode matrix, frontmatter handling, shell guard, and hook payloads.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
import {
  isProtectedPath,
  stripBrackets,
  splitFrontmatter,
  classifyTextEdit,
  evaluateRedPenPolicy,
  evaluateShellCommand,
  handleHookPayload
} from '../scripts/redpen.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

console.log('\n--- Running Red Pen Enforcement Engine Test Suite ---');

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

// 1. Path Protection
assert(isProtectedPath('manuscript/scenes/sc-0001.md'), 'manuscript/scenes is protected');
assert(isProtectedPath('writers_room/drafts/scene.md'), 'writers_room/drafts is protected');
assert(isProtectedPath('preferences.md'), 'preferences.md is protected');
assert(isProtectedPath('stages/03_drafting/output/chapters/ch-01.md'), 'stages/03_drafting/output/chapters is protected');
assert(!isProtectedPath('scratch/notes.md'), 'scratch/ is not protected');
assert(!isProtectedPath('_config/voice.md'), '_config/ is not protected');
assert(!isProtectedPath('tests/fixtures/test.md'), 'tests/fixtures is not protected');

// 2. Bracket Stripping & Invariant
const original = 'Mara walked to the edge of the lighthouse cliff and looked out at the ocean.';
const bracketed = 'Mara walked to the edge of the lighthouse cliff [Pacing: pause before looking] and looked out at the ocean. [Sensory: The spray was freezing.]';
assert(stripBrackets(bracketed) === stripBrackets(original), 'stripBrackets preserves author text when only brackets are added');

const rewritten = 'Mara sprinted to the edge of the lighthouse cliff and looked out at the ocean.';
assert(stripBrackets(rewritten) !== stripBrackets(original), 'stripBrackets detects single-word alteration');

const disguised = 'Mara sprinted to the edge of the lighthouse cliff [Edit: sprinted instead of walked] and looked out at the ocean.';
assert(stripBrackets(disguised) !== stripBrackets(original), 'stripBrackets detects disguised word change with bracket explanation');

// 3. Frontmatter & Body Splitting
const sceneText = `---
id: sc-0001
chapter: ch-01
pov: Mara
---
The storm raged across the cliffs.`;

const split = splitFrontmatter(sceneText);
assert(split.frontmatter.includes('pov: Mara'), 'splitFrontmatter extracts YAML block');
assert(split.body.trim() === 'The storm raged across the cliffs.', 'splitFrontmatter extracts body prose');

// 4. Text Edit Classification
const metaUpdated = `---
id: sc-0001
chapter: ch-01
pov: Mara
word_count: 500
---
The storm raged across the cliffs.`;

const cMeta = classifyTextEdit(sceneText, metaUpdated);
assert(cMeta.classification === 'frontmatter_only', 'classifyTextEdit identifies frontmatter-only updates');

const cBracket = classifyTextEdit(sceneText, sceneText + ' [Sensory: smell of sulfur]');
assert(cBracket.classification === 'bracket_only', 'classifyTextEdit identifies bracket-only additions');

const cProse = classifyTextEdit(sceneText, sceneText.replace('storm', 'tempest'));
assert(cProse.classification === 'author_words_changed', 'classifyTextEdit detects author prose alteration');

// 5. Mode Policy Evaluation
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb2-redpen-test-'));

// Solo Mode: all protected actions ask
const soloBracket = evaluateRedPenPolicy({
  targetPath: 'manuscript/scenes/sc-0001.md',
  oldText: original,
  newText: bracketed,
  workingMode: 'solo',
  baseDir: tempDir
});
assert(soloBracket.decision === 'ask', 'Solo Mode: bracket-only edits require author confirmation (ask)');

const soloProse = evaluateRedPenPolicy({
  targetPath: 'manuscript/scenes/sc-0001.md',
  oldText: original,
  newText: rewritten,
  workingMode: 'solo',
  baseDir: tempDir
});
assert(soloProse.decision === 'ask', 'Solo Mode: prose changes require author confirmation (ask)');

// Hybrid Mode: bracket allowed, prose change asked
const hybridBracket = evaluateRedPenPolicy({
  targetPath: 'manuscript/scenes/sc-0001.md',
  oldText: original,
  newText: bracketed,
  workingMode: 'hybrid',
  baseDir: tempDir
});
assert(hybridBracket.decision === 'allow', 'Hybrid Mode: bracket-only edit allowed automatically');

const hybridProse = evaluateRedPenPolicy({
  targetPath: 'manuscript/scenes/sc-0001.md',
  oldText: original,
  newText: rewritten,
  workingMode: 'hybrid',
  baseDir: tempDir
});
assert(hybridProse.decision === 'ask', 'Hybrid Mode: author prose changes prompt author for confirmation');

// Generative Mode: bracket allowed, new file allowed, existing prose change asked
const genNew = evaluateRedPenPolicy({
  targetPath: 'manuscript/scenes/sc-0002.md',
  oldText: null,
  newText: 'Brand new generated scene.',
  isNewFile: true,
  workingMode: 'generative',
  baseDir: tempDir
});
assert(genNew.decision === 'allow', 'Generative Mode: new file creation allowed');

const genProse = evaluateRedPenPolicy({
  targetPath: 'manuscript/scenes/sc-0001.md',
  oldText: original,
  newText: rewritten,
  workingMode: 'generative',
  baseDir: tempDir
});
assert(genProse.decision === 'ask', 'Generative Mode: editing existing author prose still prompts author');

// 6. Shell Command Guarding
assert(evaluateShellCommand('node scripts/soundingboard.js status').decision === 'allow',
  'Standalone soundingboard status command allowed');
assert(evaluateShellCommand('node scripts/soundingboard.js audit manuscript/scenes/sc-0001.md').decision === 'allow',
  'Standalone soundingboard audit command allowed');
assert(evaluateShellCommand('sed -i "s/old/new/g" manuscript/scenes/sc-0001.md').decision === 'ask',
  'Destructive sed command on manuscript path prompted');
assert(evaluateShellCommand('echo "slop" > writers_room/drafts/ch01.md').decision === 'ask',
  'Destructive echo redirect on writers_room path prompted');
assert(evaluateShellCommand('node scripts/soundingboard.js status && rm manuscript/scenes/sc-0001.md').decision === 'ask',
  'Chained command targeting protected path prompted');

// 7. Hook Payload Simulation
const hookPayload = {
  toolCall: {
    name: 'write_to_file',
    args: {
      TargetFile: path.join(tempDir, 'manuscript', 'scenes', 'sc-0001.md'),
      CodeContent: bracketed
    }
  }
};

// Create the target scene file on disk first
fs.mkdirSync(path.join(tempDir, 'manuscript', 'scenes'), { recursive: true });
fs.writeFileSync(path.join(tempDir, 'manuscript', 'scenes', 'sc-0001.md'), original, 'utf8');

// Write preferences.md with hybrid mode
fs.writeFileSync(path.join(tempDir, 'preferences.md'), 'working_mode: hybrid\n', 'utf8');

const hookRes = await handleHookPayload(JSON.stringify(hookPayload), tempDir);
assert(hookRes.decision === 'allow', 'handleHookPayload parses write_to_file and allows bracket edit in hybrid mode');

// Cleanup
fs.rmSync(tempDir, { recursive: true, force: true });

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('✔ All Red Pen Enforcement tests passed successfully!\n');
}
