#!/usr/bin/env node

/**
 * Deterministic Context Packer for Tactical Worldbuilding & World Codex Playbook (#23)
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/pack-world.js [topic_or_location_or_article]');
  console.log('Assembles world bible, political economy, cultural codes, factions, wiki entries, and Playbook #23.');
  process.exit(0);
}

const targetName = args[0] || 'General World & Setting';
const packer = new ContextPacker(`Tactical Worldbuilding & Codex Context (${targetName})`);
packer.emitHeader();

// 1. Playbook Contract
const playbookPath = path.join(cwd, '_config', 'templates', 'tactical_worldbuilding_playbook.template.md');
if (fs.existsSync(playbookPath)) {
  packer.emitSection('Playbook #23 Contract: Tactical Worldbuilding & Codex', ContextPacker.readTextSafe(playbookPath));
}

// 2. Specific Target Document (Location or Wiki Article if specified)
if (args[0]) {
  const targetClean = args[0].toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const targetCandidates = [
    path.join(cwd, 'stages', '01_onboarding', 'output', 'locations', `${targetClean}.md`),
    path.join(cwd, 'stages', '01_onboarding', 'output', 'wiki', `${targetClean}.md`),
    path.join(cwd, 'stages', '01_onboarding', 'output', `${targetClean}.md`),
    path.join(cwd, '00_Story_Bible', 'locations', `${targetClean}.md`),
    path.join(cwd, '00_Story_Bible', 'wiki', `${targetClean}.md`)
  ];
  const foundTarget = ContextPacker.findFirstExisting(targetCandidates);
  if (foundTarget) {
    packer.emitSection(`Target Entity Dossier (${path.basename(foundTarget)})`, ContextPacker.readTextSafe(foundTarget, 4000));
  }
}

// 3. World Bible & Constitutional Reality
const worldBiblePath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '01_onboarding', 'output', 'world_bible.md'),
  path.join(cwd, 'stages', '01_onboarding', 'output', 'bible', 'world_bible.md'),
  path.join(cwd, '00_Story_Bible', 'world_bible.md'),
  path.join(cwd, 'world_bible.md'),
  path.join(cwd, '_config', 'templates', 'world_bible.template.md')
]);
if (worldBiblePath) {
  packer.emitSection('World Bible (Cosmology, Tech Level & Laws)', ContextPacker.readTextSafe(worldBiblePath, 5000));
}

// 4. Political Economy & Resource Architecture
const econPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '01_onboarding', 'output', 'political_economy.md'),
  path.join(cwd, 'political_economy.md'),
  path.join(cwd, '_config', 'templates', 'political_economy.template.md')
]);
if (econPath) {
  packer.emitSection('Political Economy & Resource Bottlenecks', ContextPacker.readTextSafe(econPath, 4000));
}

// 5. Cultural Codes & Sacred Taboos
const culturePath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '01_onboarding', 'output', 'cultural_codes.md'),
  path.join(cwd, 'cultural_codes.md'),
  path.join(cwd, '_config', 'templates', 'cultural_codes.template.md')
]);
if (culturePath) {
  packer.emitSection('Cultural Codes, Sacred Taboos & Hospitality Rites', ContextPacker.readTextSafe(culturePath, 4000));
}

// 6. Faction Collision Matrix & Power Web
const factionMatrixPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '01_onboarding', 'output', 'faction_matrix.md'),
  path.join(cwd, 'faction_matrix.md'),
  path.join(cwd, '_config', 'templates', 'faction_matrix.template.md')
]);
if (factionMatrixPath) {
  packer.emitSection('Faction Collision Matrix & Asymmetric Power Web', ContextPacker.readTextSafe(factionMatrixPath, 4000));
}

// 7. Established Canon Facts
const canonPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'canon.md'),
  path.join(cwd, 'stages', '01_onboarding', 'output', 'canon.md'),
  path.join(cwd, 'canon.md')
]);
if (canonPath) {
  packer.emitSection('Established World Canon Facts', ContextPacker.readTextSafe(canonPath, 3500));
}

// 8. OKF Craft Principles on Setting Resistance & Anthropology
const settingCraft = path.join(cwd, '_config', 'okf_craft', 'setting_as_dramatic_agent_and_constraint.md');
if (fs.existsSync(settingCraft)) {
  packer.emitSection('OKF Craft: Setting as Dramatic Agent & Resistance Machine', ContextPacker.readTextSafe(settingCraft, 3000));
}

packer.emitSummary();
