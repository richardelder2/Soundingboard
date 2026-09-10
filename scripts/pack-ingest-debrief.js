#!/usr/bin/env node

/**
 * Deterministic Context Packer for Ingest Debrief Playbook
 * Assembles chapter draft text, established canon, preceding exit anchor,
 * and voice exemplars for developmental debriefing.
 * Pure mechanical assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { getDraftingDir, getChapterFiles } from './path_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/pack-ingest-debrief.js [chapter_number_or_path]');
  console.log('Assembles chapter draft text, established canon, and exit anchor for developmental debriefing.');
  process.exit(0);
}

const packer = new ContextPacker('Ingest Debrief Context');
packer.emitHeader();

// 1. Resolve Target Chapter
const allChapters = getChapterFiles(cwd);
let targetChapterPath = null;
let chapterNum = null;

if (args[0]) {
  if (fs.existsSync(args[0]) && fs.statSync(args[0]).isFile()) {
    targetChapterPath = path.resolve(args[0]);
    const m = path.basename(targetChapterPath).match(/\d+/);
    if (m) chapterNum = parseInt(m[0], 10);
  } else {
    chapterNum = parseInt(args[0], 10);
  }
}

if (!targetChapterPath && chapterNum) {
  const pad = String(chapterNum).padStart(2, '0');
  targetChapterPath = allChapters.find(f => {
    const base = path.basename(f);
    return base.includes(`chapter_${pad}`) || base.includes(`ch_${pad}`) || base.includes(`chapter_${chapterNum}`) || base.includes(`ch${pad}`);
  });
}

// Default to most recently modified chapter if not specified
if (!targetChapterPath && allChapters.length > 0) {
  targetChapterPath = allChapters[allChapters.length - 1];
  const m = path.basename(targetChapterPath).match(/\d+/);
  if (m) chapterNum = parseInt(m[0], 10);
}

if (!targetChapterPath || !fs.existsSync(targetChapterPath)) {
  packer.emitSection('Error', 'No chapter draft found to debrief. Ingest a chapter first using: node scripts/soundingboard.js ingest <file>');
  packer.emitSummary();
  process.exit(1);
}

// 2. Playbook Directive Header
packer.emitSection('Playbook Instructions', `
You are executing the Soundingboard Ingest Debrief Playbook (_config/templates/ingest_debrief_playbook.template.md).
Analyze the provided chapter draft across the 5 Mirror Registers:
1. The Core Story Turn (Value Shift & Polarity: Opening charge, Closing charge, Turning Point pivot)
2. Narrative Promises & Dangling Hooks (Explicit promises, subtle clues, payoff urgency)
3. Character Dynamics & Status Transactions (Keith Johnstone status shifts, voice pop, wound/lie peeks)
4. Continuity & Canon Sentry (Newly established facts, potential collisions with prior canon)
5. Creative Runways Forward (3 concrete narrative forks with opening hook images/dialogue)
Maintain a supportive, domain-expert tone that fuels drafting momentum.
`);

// 3. Preceding Chapter Exit Anchor (for continuity entry)
if (chapterNum && chapterNum > 1) {
  const prevPad = String(chapterNum - 1).padStart(2, '0');
  const prevPath = allChapters.find(f => {
    const base = path.basename(f);
    return base.includes(`chapter_${prevPad}`) || base.includes(`ch_${prevPad}`) || base.includes(`chapter_${chapterNum - 1}`) || base.includes(`ch${prevPad}`);
  });

  if (prevPath && fs.existsSync(prevPath)) {
    const rawPrev = fs.readFileSync(prevPath, 'utf8');
    const cleanPrev = rawPrev.replace(/^---[\s\S]*?---\s*/, '').trim();
    const words = cleanPrev.split(/\s+/);
    const trailingWords = words.slice(-350).join(' ');
    packer.emitSection(`Preceding Chapter Exit Anchor (Ch ${chapterNum - 1} Exit)`, `... ${trailingWords}`);
  }
}

// 4. Target Chapter Draft Text
const rawTarget = fs.readFileSync(targetChapterPath, 'utf8');
const cleanTarget = rawTarget.replace(/^---[\s\S]*?---\s*/, '').trim();
const targetWordCount = cleanTarget.split(/\s+/).filter(Boolean).length;
packer.emitSection(`Target Chapter Draft (${path.basename(targetChapterPath)} — ~${targetWordCount} words)`, rawTarget);

// 5. Established Canon (to detect new assertions vs known lore)
const canonPath = path.join(cwd, 'stages', '02_planning', 'output', 'canon.md');
if (fs.existsSync(canonPath)) {
  const rawCanon = fs.readFileSync(canonPath, 'utf8');
  packer.emitSection('Established Canon Ledger (Reference Truth)', rawCanon);
}

// 6. Voice Exemplars (for voice fidelity reference)
const voicePath = path.join(cwd, 'stages', '02_planning', 'output', 'voice_exemplars.md');
if (fs.existsSync(voicePath)) {
  const rawVoice = fs.readFileSync(voicePath, 'utf8');
  packer.emitSection('Voice Exemplars (Calibration Baseline)', rawVoice);
}

packer.emitSummary();
