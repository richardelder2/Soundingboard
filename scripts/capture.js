#!/usr/bin/env node

/**
 * Soundingboard — Literary Conversation Provenance Engine (v2.2 LTS)
 * Captures, normalizes, and indexes agent sessions into conversations/
 * Formats Markdown with high visual contrast (Author flush-left, Agent quoted, Red Pen docked).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';
import { stripBrackets, classifyTextEdit, isProtectedPath, getWorkingMode } from './redpen.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const rootDir = path.resolve(__dirname, '..');

/**
 * Redacts common sensitive tokens, keys, and personal identifiers.
 */
export function redactSecrets(text) {
  if (!text) return '';
  return text
    .replace(/\b(sk-[A-Za-z0-9_-]{20,})\b/g, '[REDACTED_API_KEY]')
    .replace(/\b(AIzaSy[A-Za-z0-9_-]{33})\b/g, '[REDACTED_GEMINI_KEY]')
    .replace(/\b(ghp_[A-Za-z0-9]{36})\b/g, '[REDACTED_GITHUB_TOKEN]')
    .replace(/\bBearer\s+[A-Za-z0-9._-]{20,}/gi, 'Bearer [REDACTED_TOKEN]')
    .replace(/password\s*[:=]\s*['"][^'"]+['"]/gi, 'password: "[REDACTED]"')
    .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '[REDACTED_EMAIL]');
}

/**
 * Computes SHA-256 hash of content.
 */
export function computeHash(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Parses a JSONL transcript file into structured turns.
 */
export function parseTranscriptJsonl(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  const steps = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      steps.push(obj);
    } catch (e) {
      // Skip invalid JSON lines
    }
  }

  return steps;
}

/**
 * Extracts turns, metadata, and red-pen events from parsed transcript steps.
 */
export function normalizeSessionSteps(steps, baseDir = rootDir) {
  const turns = [];
  const filesTouched = new Set();
  const redPenEvents = [];
  let sessionId = 'session_' + Date.now();
  let startTime = null;
  let endTime = null;

  for (const step of steps) {
    const timestamp = step.created_at || step.timestamp || new Date().toISOString();
    if (!startTime) startTime = timestamp;
    endTime = timestamp;

    if (step.conversationId || step.conversation_id) {
      sessionId = step.conversationId || step.conversation_id;
    }

    // Determine role
    const isUser = step.type === 'USER_INPUT' ||
                   step.source === 'USER_EXPLICIT' ||
                   step.role === 'user';
    const isModel = step.type === 'PLANNER_RESPONSE' ||
                    step.source === 'MODEL' ||
                    step.role === 'assistant' ||
                    step.role === 'model';

    // Tool calls inspection
    const toolCalls = step.tool_calls || (step.toolCall ? [step.toolCall] : []);
    const currentRedPenEvents = [];

    for (const tc of toolCalls) {
      const name = tc.name || '';
      const args = tc.args || {};

      if (name === 'write_to_file' || name === 'replace_file_content') {
        const target = args.TargetFile || args.path || '';
        if (target) {
          const rel = path.relative(baseDir, path.resolve(baseDir, target)).replace(/\\/g, '/');
          filesTouched.add(rel);

          const isProtected = isProtectedPath(rel, baseDir);
          let outcome = '[Standard File Edit]';

          if (isProtected) {
            const newContent = args.CodeContent || args.ReplacementContent || '';
            const stripped = stripBrackets(newContent);
            if (newContent.includes('[') && newContent.includes(']')) {
              outcome = '[Bracket-Only Diagnostic Suggestion]';
            } else {
              outcome = '[Author-Approved Prose Modification]';
            }
          }

          currentRedPenEvents.push({
            tool: name,
            file: rel,
            outcome,
            timestamp
          });
          redPenEvents.push(currentRedPenEvents[currentRedPenEvents.length - 1]);
        }
      }
    }

    let textContent = step.content || step.text || '';
    if (typeof textContent !== 'string') {
      textContent = JSON.stringify(textContent);
    }

    // Exclude internal thinking blocks
    textContent = textContent.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();

    if (isUser && textContent) {
      turns.push({
        speaker: 'author',
        time: timestamp.includes('T') ? timestamp.split('T')[1].slice(0, 5) : '',
        timestamp,
        content: redactSecrets(textContent)
      });
    } else if (isModel && (textContent || currentRedPenEvents.length > 0)) {
      turns.push({
        speaker: 'agent',
        time: timestamp.includes('T') ? timestamp.split('T')[1].slice(0, 5) : '',
        timestamp,
        content: redactSecrets(textContent),
        redPenEvents: currentRedPenEvents
      });
    }
  }

  return {
    sessionId,
    startTime,
    endTime,
    filesTouched: Array.from(filesTouched),
    redPenEvents,
    turns
  };
}

/**
 * Formats a normalized session into high-contrast Markdown.
 */
export function formatSessionMarkdown(session, options = {}) {
  const {
    sessionId,
    startTime,
    endTime,
    filesTouched,
    turns
  } = session;

  const harness = options.harness || 'antigravity';
  const mode = options.workingMode || getWorkingMode();
  const dateStr = (startTime || new Date().toISOString()).split('T')[0];

  let md = `---
session_id: "${sessionId}"
harness: "${harness}"
date: "${dateStr}"
start_time: "${startTime || ''}"
end_time: "${endTime || ''}"
working_mode: "${mode}"
files_touched:
${filesTouched.map(f => `  - "${f}"`).join('\n') || '  []'}
---

# Soundingboard Session — ${dateStr} (${sessionId.slice(0, 8)})

`;

  for (const turn of turns) {
    const timeLabel = turn.time ? ` · ${turn.time}` : '';
    if (turn.speaker === 'author') {
      md += `### ✍️ Author${timeLabel}\n\n${turn.content}\n\n`;
    } else if (turn.speaker === 'agent') {
      md += `> ### 🤖 Concierge${timeLabel}\n`;
      const quotedLines = turn.content.split('\n').map(l => `> ${l}`).join('\n');
      md += `${quotedLines}\n`;

      if (turn.redPenEvents && turn.redPenEvents.length > 0) {
        md += `>\n> ---\n`;
        for (const rpe of turn.redPenEvents) {
          md += `> 🛡️ **Red Pen Event:** \`${rpe.tool}(${rpe.file})\` → **${rpe.outcome}**\n`;
        }
      }
      md += `\n`;
    }
  }

  return md;
}

/**
 * Updates the canonical conversations/INDEX.md ledger.
 */
export function updateLedger(entry, baseDir = rootDir) {
  const convDir = path.join(baseDir, 'conversations');
  if (!fs.existsSync(convDir)) {
    fs.mkdirSync(convDir, { recursive: true });
  }

  const indexPath = path.join(convDir, 'INDEX.md');
  const header = `# Soundingboard Conversation Provenance Ledger

| Date | Session ID | Harness | Mode | Files Touched | Hash | Transcript |
|---|---|---|---|---|---|---|
`;

  let existing = '';
  if (fs.existsSync(indexPath)) {
    existing = fs.readFileSync(indexPath, 'utf8');
  } else {
    existing = header;
  }

  const filesLabel = entry.filesTouched.length > 0 ? entry.filesTouched.join(', ') : 'none';
  const row = `| ${entry.date} | ${entry.sessionId.slice(0, 8)} | ${entry.harness} | ${entry.mode} | ${filesLabel} | \`${entry.hash.slice(0, 8)}\` | [${path.basename(entry.transcriptFile)}](${path.basename(entry.transcriptFile)}) |\n`;

  // Avoid duplicate rows for the same session ID
  if (!existing.includes(entry.sessionId.slice(0, 8))) {
    existing += row;
    fs.writeFileSync(indexPath, existing, 'utf8');
  }
}

/**
 * Executes a full capture workflow from a transcript path.
 */
export function captureSession(transcriptPath, options = {}, baseDir = rootDir) {
  if (!fs.existsSync(transcriptPath)) {
    return { success: false, error: `Transcript file not found: ${transcriptPath}` };
  }

  const raw = fs.readFileSync(transcriptPath, 'utf8');
  const steps = parseTranscriptJsonl(raw);
  if (steps.length === 0) {
    return { success: false, error: 'No valid turns found in transcript' };
  }

  const normalized = normalizeSessionSteps(steps, baseDir);
  const workingMode = options.workingMode || getWorkingMode(baseDir);
  const harness = options.harness || 'antigravity';

  const mdContent = formatSessionMarkdown(normalized, { harness, workingMode });
  const hash = computeHash(mdContent);

  const dateStr = (normalized.startTime || new Date().toISOString()).split('T')[0];
  const shortId = normalized.sessionId.slice(0, 8);
  const filename = `${dateStr}_${harness}_${shortId}.md`;

  const convDir = path.join(baseDir, 'conversations');
  if (!fs.existsSync(convDir)) {
    fs.mkdirSync(convDir, { recursive: true });
  }

  const outPath = path.join(convDir, filename);
  fs.writeFileSync(outPath, mdContent, 'utf8');

  // Update ledger
  updateLedger({
    date: dateStr,
    sessionId: normalized.sessionId,
    harness,
    mode: workingMode,
    filesTouched: normalized.filesTouched,
    hash,
    transcriptFile: outPath
  }, baseDir);

  return {
    success: true,
    sessionId: normalized.sessionId,
    outPath,
    hash,
    turnsCount: normalized.turns.length,
    filesTouched: normalized.filesTouched
  };
}

// CLI Execution Entry Point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'stop') {
    // Antigravity Stop hook receives context on stdin
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { input += chunk; });
    process.stdin.on('end', () => {
      try {
        const payload = input.trim() ? JSON.parse(input) : {};
        const transcriptPath = payload.transcriptPath;
        if (transcriptPath && fs.existsSync(transcriptPath)) {
          const res = captureSession(transcriptPath, { harness: 'antigravity' });
          console.log(JSON.stringify({ decision: 'allow', reason: `Captured session to ${res.outPath}` }));
        } else {
          console.log(JSON.stringify({ decision: 'allow' }));
        }
      } catch (err) {
        console.log(JSON.stringify({ decision: 'allow' }));
      }
      process.exit(0);
    });
  } else {
    // Standalone CLI invocation
    const fileIdx = args.indexOf('--file');
    const targetFile = fileIdx !== -1 ? args[fileIdx + 1] : null;

    if (targetFile) {
      const res = captureSession(targetFile);
      if (res.success) {
        console.log(`\x1b[32m✔ Successfully captured session:\x1b[0m ${res.outPath}`);
        console.log(`  - Turns: ${res.turnsCount}`);
        console.log(`  - Hash: ${res.hash.slice(0, 16)}...`);
      } else {
        console.error(`\x1b[31m✗ Error:\x1b[0m ${res.error}`);
      }
    } else {
      console.log('Soundingboard Literary Provenance Capture');
      console.log('Usage:');
      console.log('  node scripts/capture.js --file <transcript.jsonl>');
      console.log('  node scripts/capture.js stop  # Runs as harness Stop hook');
    }
  }
}
