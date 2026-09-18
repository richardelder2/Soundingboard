#!/usr/bin/env node

/**
 * Deterministic Context Packer for Tactical Naming & World Onomastics Playbook (#22)
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { loadExistingCast } from './name_generator.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/pack-naming.js [target_entity_or_culture]');
  console.log('Assembles world naming rules, current cast acoustic matrix, world bible, and anti-AI denylist for onomastic planning.');
  process.exit(0);
}

const targetName = args[0] || 'Project World & Cast';
const packer = new ContextPacker(`Tactical Onomastics & World Naming Context (${targetName})`);
packer.emitHeader();

// 1. Playbook Contract
const playbookPath = path.join(cwd, '_config', 'templates', 'tactical_naming_playbook.template.md');
if (fs.existsSync(playbookPath)) {
  packer.emitSection('Tactical Naming Playbook (#22) Contract', ContextPacker.readTextSafe(playbookPath));
}

// 2. Active World Naming Rules or Template
const namingRulesPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '01_onboarding', 'output', 'naming_system.md'),
  path.join(cwd, 'naming_system.md'),
  path.join(cwd, '_config', 'templates', 'naming_system.template.md')
]);
if (namingRulesPath) {
  packer.emitSection('Project Naming System & Onomastic Laws', ContextPacker.readTextSafe(namingRulesPath, 5000));
}

// 3. Current Cast Roster & Acoustic Matrix (To Prevent Collisions)
const cast = loadExistingCast(cwd);
if (cast.length > 0) {
  let castTable = '| Name | Initial | Syllables | Ending Coda |\n|---|---|---|---|\n';
  cast.forEach(c => {
    castTable += `| ${c.fullName} | ${c.initial} | ${c.syllables} | -${c.ending} |\n`;
  });
  packer.emitSection(`Existing Cast Acoustic Matrix (${cast.length} Monitored)`, castTable);
} else {
  packer.emitSection('Existing Cast Acoustic Matrix', '*No existing characters registered in canon.md or characters directory yet. Roster is open.*');
}

// 4. World Bible (Culture, Factions, Caste Structure)
const worldBiblePath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '01_onboarding', 'output', 'world_bible.md'),
  path.join(cwd, 'stages', '01_onboarding', 'output', 'bible', 'world_bible.md'),
  path.join(cwd, '00_Story_Bible', 'world_bible.md'),
  path.join(cwd, 'world_bible.md'),
  path.join(cwd, '_config', 'templates', 'world_bible.template.md')
]);
if (worldBiblePath) {
  packer.emitSection('World Bible Context (Tech, Caste & Factions)', ContextPacker.readTextSafe(worldBiblePath, 4000));
}

// 5. Genre Bible & Trope Expectations
const genreBiblePath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '01_onboarding', 'output', 'bible', 'genre_bible.md'),
  path.join(cwd, 'stages', '01_onboarding', 'output', 'genre_bible.md'),
  path.join(cwd, 'genre_bible.md')
]);
if (genreBiblePath) {
  packer.emitSection('Genre Expectations & Trope Stack', ContextPacker.readTextSafe(genreBiblePath, 3000));
}

// 6. Anti-AI Slop Denylist & Authentic Onomastic Rules
const authPath = path.join(cwd, '_config', 'okf_craft', 'tactical_onomastics_and_world_naming_systems.md');
if (fs.existsSync(authPath)) {
  packer.emitSection('OKF Craft: Tactical Onomastics & Anti-Slop Directive', ContextPacker.readTextSafe(authPath, 4000));
}

packer.emitSummary();
