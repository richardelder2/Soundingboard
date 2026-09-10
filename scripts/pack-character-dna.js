#!/usr/bin/env node

/**
 * Deterministic Context Packer for Character DNA & Persona Mashup Playbook
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { getCharactersDir } from './path_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/pack-character-dna.js [character_name]`);
  console.log(`Assembles world bible, genre tropes, existing cast overview, allowlist, and character template for DNA fusion.`);
  process.exit(0);
}

const targetName = args[0] || 'New Character';
const packer = new ContextPacker(`Character DNA & Archetype Fusion Context (${targetName})`);
packer.emitHeader();

// 1. Canonical Character Profile Template Schema
const templatePath = path.join(cwd, '_config', 'templates', 'character.template.md');
if (fs.existsSync(templatePath)) {
  packer.emitSection('Target Character Schema (character.template.md)', ContextPacker.readTextSafe(templatePath));
}

// 2. World Bible & Cultural Rules
const worldBiblePath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '01_onboarding', 'output', 'world_bible.md'),
  path.join(cwd, 'stages', '01_onboarding', 'output', 'bible', 'world_bible.md'),
  path.join(cwd, '00_Story_Bible', 'world_bible.md'),
  path.join(cwd, 'world_bible.md'),
  path.join(cwd, '_config', 'templates', 'world_bible.template.md')
]);
if (worldBiblePath) {
  packer.emitSection('World Bible (Tech Level, Caste & Laws)', ContextPacker.readTextSafe(worldBiblePath, 5000));
}

// 3. Genre Bible & Trope Roles
const genreBiblePath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '01_onboarding', 'output', 'bible', 'genre_bible.md'),
  path.join(cwd, 'stages', '01_onboarding', 'output', 'genre_bible.md'),
  path.join(cwd, 'genre_bible.md')
]);
if (genreBiblePath) {
  packer.emitSection('Genre Trope Stack & Archetype Expectations', ContextPacker.readTextSafe(genreBiblePath, 4000));
}

// 4. In-World Terminology & Tell Allowlist
const allowlistPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '01_onboarding', 'output', 'tell_allowlist.md'),
  path.join(cwd, 'tell_allowlist.md'),
  path.join(cwd, '_config', 'templates', 'tell_allowlist.template.md')
]);
if (allowlistPath) {
  packer.emitSection('In-World Vocabulary & Tell Allowlist', ContextPacker.readTextSafe(allowlistPath, 2500));
}

// 5. Existing Cast Roster (To Prevent Overlap / Duplicate Roles)
const charsDir = getCharactersDir(cwd);
if (fs.existsSync(charsDir)) {
  const charFiles = fs.readdirSync(charsDir).filter(f => f.endsWith('.md'));
  if (charFiles.length > 0) {
    const castOverview = charFiles.map(f => {
      const charName = path.basename(f, '.md');
      const snippet = ContextPacker.readTextSafe(path.join(charsDir, f), 350);
      return `### ${charName.toUpperCase()}\n${snippet}\n`;
    }).join('\n');
    packer.emitSection('Current Cast Roster (Avoid Role & Voice Duplication)', castOverview);
  }
}

// 6. Narrative Authenticity Guidelines for Characters
const authPath = path.join(cwd, '_config', 'narrative_authenticity.md');
if (fs.existsSync(authPath)) {
  const authText = fs.readFileSync(authPath, 'utf8');
  const charMatch = authText.match(/(?:### Character introductions|### Rarity — beat the default)[\s\S]*?(?=\n### |\n## Layer 2|$)/i);
  if (charMatch) {
    packer.emitSection('Authenticity Rules: Human Contradictions & Rarity', charMatch[0]);
  }
}

packer.emitSummary();
