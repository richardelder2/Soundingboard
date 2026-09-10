#!/usr/bin/env node

/**
 * Deterministic Context Packer for Dialogue Heat Playbook
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { getDraftingDir, getCharactersDir, getChapterFiles } from './path_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/pack-dialogue-heat.js [chapter_number_or_path] [character_names...]`);
  console.log(`Assembles recent chapter dialogue, character voice sheets, and subtext/status craft rules.`);
  process.exit(0);
}

const packer = new ContextPacker('Dialogue Heat Playbook Context');
packer.emitHeader();

// 1. Resolve Chapter or Passage
let targetChapterPath = null;
const allChapters = getChapterFiles();
const firstArg = args[0];

if (firstArg && !isNaN(parseInt(firstArg, 10))) {
  const chNum = parseInt(firstArg, 10);
  const pad = String(chNum).padStart(2, '0');
  targetChapterPath = allChapters.find(f => path.basename(f).includes(`chapter_${pad}`) || path.basename(f).includes(`ch_${pad}`) || path.basename(f).includes(`ch${pad}`));
} else if (firstArg && fs.existsSync(firstArg)) {
  targetChapterPath = firstArg;
} else if (allChapters.length > 0) {
  targetChapterPath = allChapters[allChapters.length - 1];
}

if (targetChapterPath && fs.existsSync(targetChapterPath)) {
  const content = fs.readFileSync(targetChapterPath, 'utf8');
  // Extract dialogue-heavy passages or last 60 lines
  const lines = content.split('\n').slice(-60).join('\n');
  packer.emitSection(`Active Scene Draft Excerpt (${path.basename(targetChapterPath)})`, lines);
} else {
  packer.emitSection('Active Scene Draft', 'Provide the dialogue excerpt to heat up directly in your conversation.');
}

// 2. Character Profiles for Speakers
const charsDir = getCharactersDir(cwd);
if (fs.existsSync(charsDir)) {
  const charFiles = fs.readdirSync(charsDir).filter(f => f.endsWith('.md'));
  const specifiedChars = args.slice(1).map(c => c.toLowerCase());
  
  const relevantFiles = specifiedChars.length > 0
    ? charFiles.filter(f => specifiedChars.some(sc => f.toLowerCase().includes(sc)))
    : charFiles.slice(0, 3); // top 3 if unspecified

  if (relevantFiles.length > 0) {
    const profiles = relevantFiles.map(f => {
      return `### ${path.basename(f, '.md').toUpperCase()}\n${ContextPacker.readTextSafe(path.join(charsDir, f), 2000)}\n`;
    }).join('\n');
    packer.emitSection('Speaker Character Profiles', profiles);
  }
}

// 3. Dialogue Craft Rules & Authenticity
const authPath = path.join(cwd, '_config', 'narrative_authenticity.md');
if (fs.existsSync(authPath)) {
  const authText = fs.readFileSync(authPath, 'utf8');
  const dialogueSectionMatch = authText.match(/(?:## Dialogue|### Dialogue)[\s\S]*?(?=\n## |\n### |$)/i);
  if (dialogueSectionMatch) {
    packer.emitSection('Authenticity Guidelines: Dialogue Friction & Tells', dialogueSectionMatch[0]);
  }
}

packer.emitSummary();
