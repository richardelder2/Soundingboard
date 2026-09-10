#!/usr/bin/env node

/**
 * Deterministic Context Packer for Sensory Bloom Playbook
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { getDraftingDir, getChapterFiles } from './path_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/pack-sensory-bloom.js [location_name_or_chapter]`);
  console.log(`Assembles sensory lexicon, location details, tell allowlist, and recent scene passage.`);
  process.exit(0);
}

const targetLocationOrCh = args[0];
const packer = new ContextPacker('Sensory Bloom Playbook Context');
packer.emitHeader();

// 1. Sensory Lexicon
const lexiconPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '01_onboarding', 'output', 'sensory_lexicon.md'),
  path.join(cwd, 'sensory_lexicon.md'),
  path.join(cwd, '_config', 'templates', 'sensory_lexicon.template.md')
]);
if (lexiconPath) {
  packer.emitSection('Project Sensory Lexicon', ContextPacker.readTextSafe(lexiconPath, 4000));
}

// 2. Tell Allowlist
const allowlistPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '01_onboarding', 'output', 'tell_allowlist.md'),
  path.join(cwd, 'tell_allowlist.md')
]);
if (allowlistPath) {
  packer.emitSection('In-World Terminology & Allowlist', ContextPacker.readTextSafe(allowlistPath, 3000));
}

// 3. Location Bible Sheet if available
const locationsDir = path.join(cwd, 'stages', '01_onboarding', 'output', 'locations');
if (fs.existsSync(locationsDir) && targetLocationOrCh) {
  const locFiles = fs.readdirSync(locationsDir).filter(f => f.endsWith('.md'));
  const found = locFiles.find(f => f.toLowerCase().includes(targetLocationOrCh.toLowerCase()));
  if (found) {
    packer.emitSection(`Setting Sheet (${found})`, ContextPacker.readTextSafe(path.join(locationsDir, found)));
  }
}

// 4. Active Chapter Passage
const allChapters = getChapterFiles();
let chapterFile = null;
if (targetLocationOrCh && !isNaN(parseInt(targetLocationOrCh, 10))) {
  const chNum = parseInt(targetLocationOrCh, 10);
  const pad = String(chNum).padStart(2, '0');
  chapterFile = allChapters.find(f => path.basename(f).includes(`chapter_${pad}`) || path.basename(f).includes(`ch_${pad}`) || path.basename(f).includes(`ch${pad}`));
} else if (allChapters.length > 0) {
  chapterFile = allChapters[allChapters.length - 1];
}

if (chapterFile && fs.existsSync(chapterFile)) {
  const raw = fs.readFileSync(chapterFile, 'utf8');
  const lines = raw.split('\n').slice(-45).join('\n');
  packer.emitSection(`Recent Scene Context (${path.basename(chapterFile)})`, lines);
}

// 5. Sensory Prose Dial Rules
const authPath = path.join(cwd, '_config', 'narrative_authenticity.md');
if (fs.existsSync(authPath)) {
  const authText = fs.readFileSync(authPath, 'utf8');
  const sensorySection = authText.match(/(?:### Sensation|### Emotion Modes|## Layer 2)[\s\S]*?(?=\n### |\n## |$)/i);
  if (sensorySection) {
    packer.emitSection('Authenticity Sensation Rules (Viscosity & Moderation)', sensorySection[0]);
  }
}

packer.emitSummary();
