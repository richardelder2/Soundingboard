#!/usr/bin/env node

/**
 * Deterministic Context Packer for Lore & Brainstorming Playbook
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { getCharactersDir, getStoryBibleDir } from './path_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/pack-brainstorm.js [topic_or_keyword]`);
  console.log(`Assembles world bible, genre tropes, tell allowlist, and cast overview for worldbuilding brainstorming.`);
  process.exit(0);
}

const topic = args[0] || 'General World & Lore';
const packer = new ContextPacker(`Lore Brainstorming (${topic})`);
packer.emitHeader();

// 1. World Bible
const worldBiblePath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '01_onboarding', 'output', 'world_bible.md'),
  path.join(cwd, 'stages', '01_onboarding', 'output', 'bible', 'world_bible.md'),
  path.join(cwd, '00_Story_Bible', 'world_bible.md'),
  path.join(cwd, 'world_bible.md'),
  path.join(cwd, '_config', 'templates', 'world_bible.template.md')
]);
if (worldBiblePath) {
  packer.emitSection('World Bible & Lore Structure', ContextPacker.readTextSafe(worldBiblePath, 8000));
}

// 2. Genre Bible & Trope Stack
const genreBiblePath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '01_onboarding', 'output', 'bible', 'genre_bible.md'),
  path.join(cwd, 'stages', '01_onboarding', 'output', 'genre_bible.md'),
  path.join(cwd, 'genre_bible.md')
]);
if (genreBiblePath) {
  packer.emitSection('Genre Bible & Trope Stack', ContextPacker.readTextSafe(genreBiblePath, 6000));
}

// 3. Tell Allowlist (In-world vocabulary)
const allowlistPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '01_onboarding', 'output', 'tell_allowlist.md'),
  path.join(cwd, 'tell_allowlist.md')
]);
if (allowlistPath) {
  packer.emitSection('In-World Terminology & Tell Allowlist', ContextPacker.readTextSafe(allowlistPath, 3000));
}

// 4. Existing Cast / Factions summary
const charsDir = getCharactersDir(cwd);
if (fs.existsSync(charsDir)) {
  const charFiles = fs.readdirSync(charsDir).filter(f => f.endsWith('.md'));
  if (charFiles.length > 0) {
    const castOverview = charFiles.map(f => {
      const charName = path.basename(f, '.md');
      const snippet = ContextPacker.readTextSafe(path.join(charsDir, f), 300);
      return `### ${charName.toUpperCase()}\n${snippet}\n`;
    }).join('\n');
    packer.emitSection('Existing Cast Overview', castOverview);
  }
}

packer.emitSummary();
