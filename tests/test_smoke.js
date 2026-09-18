#!/usr/bin/env node

/**
 * Soundingboard — 5-Minute Harness Conformance Smoke Test
 * Tests core capabilities: CLI execution, Red Pen gating, Socratic pack, and session capture.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { evaluateRedPenPolicy, evaluateShellCommand } from '../scripts/redpen.js';
import { captureSession } from '../scripts/capture.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

console.log('\n--- Running 5-Minute Harness Conformance Smoke Test ---');

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

// 1. CLI Execution Check
try {
  const statusOut = execSync('node scripts/soundingboard.js status', { cwd: rootDir, encoding: 'utf8' });
  assert(statusOut.includes('Soundingboard Stage Pipeline Status') || statusOut.includes('Soundingboard'),
    'CLI soundingboard status executes successfully');
} catch (e) {
  assert(false, 'CLI soundingboard status failed to execute', e.message);
}

// 2. Red Pen Gating on Fixture Scene
const fixturePath = path.join(rootDir, 'tests', 'fixtures', 'smoke_scene.md');
const originalText = fs.readFileSync(fixturePath, 'utf8');

// Test A: Unauthorized word edit in solo mode -> must ASK
const rewrittenText = originalText.replace('gray and silent', 'tempestuous and wild');
const soloCheck = evaluateRedPenPolicy({
  targetPath: 'manuscript/scenes/sc-9999.md',
  oldText: originalText,
  newText: rewrittenText,
  workingMode: 'solo',
  baseDir: rootDir
});
assert(soloCheck.decision === 'ask', 'Red Pen intercepts unauthorized prose change in solo mode (decision: ask)');

// Test B: Bracket-only edit in hybrid mode -> must ALLOW
const bracketedText = originalText.replace('The iron gate stood locked.', 'The iron gate stood locked. [Sensory: rusted hinges]');
const hybridCheck = evaluateRedPenPolicy({
  targetPath: 'manuscript/scenes/sc-9999.md',
  oldText: originalText,
  newText: bracketedText,
  workingMode: 'hybrid',
  baseDir: rootDir
});
assert(hybridCheck.decision === 'allow', 'Red Pen permits bracket-only diagnostic suggestion in hybrid mode (decision: allow)');

// 3. Shell Guard Check
const shellCheck = evaluateShellCommand('sed -i "s/gray/green/g" manuscript/scenes/sc-9999.md');
assert(shellCheck.decision === 'ask', 'Shell Guard intercepts destructive sed command targeting protected prose');

// 4. Socratic Dig Context Packer Check
try {
  const packOut = execSync('node scripts/soundingboard.js pack dig "The Iron Gate"', { cwd: rootDir, encoding: 'utf8' });
  assert(packOut.includes('SOCRATIC DIG PLAYBOOK CONTEXT') && packOut.toLowerCase().includes('socratic discovery playbook (#24)'),
    'Context packer pack dig assembles canon, target, and Playbook #24');
} catch (e) {
  assert(false, 'Context packer pack dig failed', e.message);
}

// 5. Conversation Provenance Capture
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb2-smoke-capture-'));
const sampleLog = [
  JSON.stringify({
    conversationId: 'smoke-session-123',
    created_at: '2026-09-18T12:00:00Z',
    type: 'USER_INPUT',
    content: 'What does the iron gate signify for Mara?'
  }),
  JSON.stringify({
    conversationId: 'smoke-session-123',
    created_at: '2026-09-18T12:00:30Z',
    type: 'PLANNER_RESPONSE',
    content: 'You mentioned the gate is locked. What is on the other side that she wants?'
  })
].join('\n');

const transcriptFile = path.join(tempDir, 'transcript.jsonl');
fs.writeFileSync(transcriptFile, sampleLog, 'utf8');

const capResult = captureSession(transcriptFile, { harness: 'antigravity' }, tempDir);
assert(capResult.success, 'Session capture executes and normalizes transcript');

const capturedMd = fs.readFileSync(capResult.outPath, 'utf8');
assert(capturedMd.includes('### ✍️ Author') && capturedMd.includes('> ### 🤖 Concierge'),
  'Captured transcript renders high-contrast author flush-left and agent quoted');

const ledgerContent = fs.readFileSync(path.join(tempDir, 'conversations', 'INDEX.md'), 'utf8');
assert(ledgerContent.includes('smoke-se') && ledgerContent.includes(capResult.hash.slice(0, 8)),
  'Ledger records session with SHA-256 integrity hash');

// Cleanup
fs.rmSync(tempDir, { recursive: true, force: true });

console.log(`\nSmoke Test Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('✔ All Harness Conformance Smoke Tests passed successfully!\n');
}
