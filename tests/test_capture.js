#!/usr/bin/env node

/**
 * Soundingboard — Literary Conversation Provenance Engine Tests
 * Verifies secret redaction, transcript parsing, visual markdown formatting, and ledger indexing.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
import {
  redactSecrets,
  computeHash,
  parseTranscriptJsonl,
  normalizeSessionSteps,
  formatSessionMarkdown,
  updateLedger,
  captureSession
} from '../scripts/capture.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

console.log('\n--- Running Conversation Provenance Test Suite ---');

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

// 1. Secret Redaction
const sensitive = 'Contact author at author@testmail.com with key sk-ant-api03-abcdef1234567890abcdef123 and token ghp_123456789012345678901234567890123456';
const redacted = redactSecrets(sensitive);
assert(!redacted.includes('author@testmail.com') && redacted.includes('[REDACTED_EMAIL]'), 'Redacts email addresses');
assert(!redacted.includes('sk-ant-') && redacted.includes('[REDACTED_API_KEY]'), 'Redacts API keys');
assert(!redacted.includes('ghp_') && redacted.includes('[REDACTED_GITHUB_TOKEN]'), 'Redacts GitHub tokens');

// 2. JSONL Parsing
const sampleJsonl = [
  JSON.stringify({
    conversationId: 'test-session-001',
    created_at: '2026-09-18T14:15:00Z',
    type: 'USER_INPUT',
    content: 'Mara hesitates before opening the iron gate.'
  }),
  JSON.stringify({
    conversationId: 'test-session-001',
    created_at: '2026-09-18T14:15:30Z',
    type: 'PLANNER_RESPONSE',
    content: '<thinking>Consider Swain MRU.</thinking>What does she hear behind the gate?',
    tool_calls: [
      {
        name: 'write_to_file',
        args: {
          TargetFile: 'manuscript/scenes/sc-0001.md',
          CodeContent: 'Mara paused [Sensory: iron rusted cold] before the gate.'
        }
      }
    ]
  })
].join('\n');

const steps = parseTranscriptJsonl(sampleJsonl);
assert(steps.length === 2, 'parseTranscriptJsonl parses all JSONL steps');

// 3. Normalization
const normalized = normalizeSessionSteps(steps, rootDir);
assert(normalized.sessionId === 'test-session-001', 'normalizeSessionSteps extracts session ID');
assert(normalized.turns.length === 2, 'normalizeSessionSteps extracts exactly 2 dialogue turns');
assert(normalized.turns[0].speaker === 'author', 'Identifies author turn');
assert(normalized.turns[1].speaker === 'agent', 'Identifies agent turn');
assert(!normalized.turns[1].content.includes('<thinking>'), 'Strips thinking block from agent dialogue');
assert(normalized.redPenEvents.length === 1, 'Records Red Pen event from write_to_file tool call');
assert(normalized.redPenEvents[0].outcome.includes('Bracket-Only'), 'Classifies bracket edit in red pen event');

// 4. Visual Markdown Formatting (Author flush-left, Agent quoted)
const md = formatSessionMarkdown(normalized, { harness: 'antigravity', workingMode: 'hybrid' });
assert(md.includes('### ✍️ Author · 14:15'), 'Author turn header is unquoted flush-left');
assert(md.includes('> ### 🤖 Concierge · 14:15'), 'Agent turn header is encased in blockquote');
assert(md.includes('> What does she hear behind the gate?'), 'Agent text is indented with >');
assert(md.includes('> 🛡️ **Red Pen Event:**'), 'Red Pen event is docked with shield badge');

// 5. End-to-End Capture & Ledger Update
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb2-capture-test-'));
const fixtureTranscript = path.join(tempDir, 'transcript.jsonl');
fs.writeFileSync(fixtureTranscript, sampleJsonl, 'utf8');

const captureRes = captureSession(fixtureTranscript, { harness: 'antigravity' }, tempDir);
assert(captureRes.success, 'captureSession runs successfully');
assert(fs.existsSync(captureRes.outPath), 'Generated transcript markdown file exists on disk');

const ledgerPath = path.join(tempDir, 'conversations', 'INDEX.md');
assert(fs.existsSync(ledgerPath), 'conversations/INDEX.md ledger created');
const ledgerText = fs.readFileSync(ledgerPath, 'utf8');
assert(ledgerText.includes('test-ses'), 'Ledger records session row');
assert(ledgerText.includes(captureRes.hash.slice(0, 8)), 'Ledger records content hash');

// Duplicate capture should not duplicate ledger row
captureSession(fixtureTranscript, { harness: 'antigravity' }, tempDir);
const ledgerLines = fs.readFileSync(ledgerPath, 'utf8').split('\n').filter(l => l.includes('test-ses'));
assert(ledgerLines.length === 1, 'Ledger deduplicates repeated session captures');

// Cleanup
fs.rmSync(tempDir, { recursive: true, force: true });

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('✔ All Conversation Provenance tests passed successfully!\n');
}
