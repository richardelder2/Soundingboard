#!/usr/bin/env node

/**
 * Deterministic Context Packer for Tactical Worldbuilding & World Codex Playbook (#23)
 * Implements Interpretable Context Methodology (ICM) semantic domain routing across:
 *   - Local Book Tier (stages/)
 *   - Series Tier (series/)
 *   - Universe Tier (world/) with 6 Canonical Domains
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/pack-world.js [topic_or_domain_or_entity]');
  console.log('Assembles world bible, political economy, cultural codes, factions, wiki entries, and Playbook #23.');
  console.log('Supported ICM World Domains: cosmology, chronology, geography, cultures, economy, factions');
  process.exit(0);
}

const targetQuery = args[0] || '';
const packer = new ContextPacker(`Tactical Worldbuilding & Codex Context (${targetQuery || 'General Universe'})`);
packer.emitHeader();

// 1. Playbook Contract
const playbookPath = path.join(cwd, '_config', 'templates', 'tactical_worldbuilding_playbook.template.md');
if (fs.existsSync(playbookPath)) {
  packer.emitSection('Playbook #23 Contract: Tactical Worldbuilding & Codex', ContextPacker.readTextSafe(playbookPath));
}

// 2. ICM Semantic Category Contract (world/CONTEXT.md)
const worldContextPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'world', 'CONTEXT.md'),
  path.join(cwd, '_config', 'templates', 'world_context.template.md')
]);
if (worldContextPath) {
  packer.emitSection('Universe Semantic Domain Contract (world/CONTEXT.md)', ContextPacker.readTextSafe(worldContextPath, 3500));
}

// Helper to scan a directory for markdown files
function getMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  try {
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.md') && !f.toLowerCase().includes('readme'))
      .map(f => path.join(dir, f));
  } catch (e) {
    return [];
  }
}

// 3. Domain-Specific Dynamic Retrieval
const domainKeywords = {
  cosmology: ['magic', 'spell', 'deity', 'god', 'pantheon', 'cosmology', 'metaphysics', 'tech', 'religion'],
  chronology: ['era', 'history', 'timeline', 'cataclysm', 'dynasty', 'war', 'age', 'ancient', 'chronology'],
  geography: ['map', 'city', 'biome', 'terrain', 'naming', 'onomastic', 'gazetteer', 'geography', 'border'],
  cultures: ['culture', 'taboo', 'custom', 'rite', 'hospitality', 'manners', 'slang', 'dress'],
  economy: ['economy', 'trade', 'money', 'scarcity', 'bottleneck', 'currency', 'contraband', 'market'],
  factions: ['faction', 'guild', 'house', 'empire', 'cabal', 'alliance', 'order', 'matrix', 'power']
};

let activeDomain = null;
if (targetQuery) {
  const qLower = targetQuery.toLowerCase();
  for (const [domain, kws] of Object.entries(domainKeywords)) {
    if (domain === qLower || kws.some(kw => qLower.includes(kw))) {
      activeDomain = domain;
      break;
    }
  }
}

// If targeted domain matched, prioritize domain files
if (activeDomain) {
  const domainDir = path.join(cwd, 'world', activeDomain);
  const domainFiles = getMarkdownFiles(domainDir);
  if (domainFiles.length > 0) {
    domainFiles.forEach(df => {
      packer.emitSection(`ICM Domain: ${activeDomain.toUpperCase()} (${path.basename(df)})`, ContextPacker.readTextSafe(df, 4000));
    });
  }
}

// 4. Specific Target Document (Direct File or Entity Match)
if (targetQuery) {
  const targetClean = targetQuery.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const targetCandidates = [
    path.join(cwd, 'world', 'geography', `${targetClean}.md`),
    path.join(cwd, 'world', 'factions', `${targetClean}.md`),
    path.join(cwd, 'world', 'cultures', `${targetClean}.md`),
    path.join(cwd, 'world', 'economy', `${targetClean}.md`),
    path.join(cwd, 'world', 'cosmology', `${targetClean}.md`),
    path.join(cwd, 'world', 'chronology', `${targetClean}.md`),
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

// 5. World Bible & Constitutional Reality
const worldBiblePath = ContextPacker.findFirstExisting([
  path.join(cwd, 'world', 'world_bible.md'),
  path.join(cwd, 'stages', '01_onboarding', 'output', 'world_bible.md'),
  path.join(cwd, 'stages', '01_onboarding', 'output', 'bible', 'world_bible.md'),
  path.join(cwd, '00_Story_Bible', 'world_bible.md'),
  path.join(cwd, 'world_bible.md'),
  path.join(cwd, '_config', 'templates', 'world_bible.template.md')
]);
if (worldBiblePath) {
  packer.emitSection('World Bible (Cosmology, Invariant Laws & Tech Hard Caps)', ContextPacker.readTextSafe(worldBiblePath, 5000));
}

// 6. Political Economy (if not already packed via activeDomain)
if (activeDomain !== 'economy') {
  const econPath = ContextPacker.findFirstExisting([
    path.join(cwd, 'world', 'economy', 'political_economy.md'),
    path.join(cwd, 'stages', '01_onboarding', 'output', 'political_economy.md'),
    path.join(cwd, 'political_economy.md'),
    path.join(cwd, '_config', 'templates', 'political_economy.template.md')
  ]);
  if (econPath) {
    packer.emitSection('Political Economy & Resource Bottlenecks', ContextPacker.readTextSafe(econPath, 3500));
  }
}

// 7. Cultural Codes (if not already packed via activeDomain)
if (activeDomain !== 'cultures') {
  const culturePath = ContextPacker.findFirstExisting([
    path.join(cwd, 'world', 'cultures', 'cultural_codes.md'),
    path.join(cwd, 'stages', '01_onboarding', 'output', 'cultural_codes.md'),
    path.join(cwd, 'cultural_codes.md'),
    path.join(cwd, '_config', 'templates', 'cultural_codes.template.md')
  ]);
  if (culturePath) {
    packer.emitSection('Cultural Codes, Sacred Taboos & Hospitality Rites', ContextPacker.readTextSafe(culturePath, 3500));
  }
}

// 8. Faction Collision Matrix (if not already packed via activeDomain)
if (activeDomain !== 'factions') {
  const factionMatrixPath = ContextPacker.findFirstExisting([
    path.join(cwd, 'world', 'factions', 'faction_matrix.md'),
    path.join(cwd, 'stages', '01_onboarding', 'output', 'faction_matrix.md'),
    path.join(cwd, 'faction_matrix.md'),
    path.join(cwd, '_config', 'templates', 'faction_matrix.template.md')
  ]);
  if (factionMatrixPath) {
    packer.emitSection('Faction Collision Matrix & Asymmetric Power Web', ContextPacker.readTextSafe(factionMatrixPath, 3500));
  }
}

// 9. Established World Canon Facts
const canonPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'world', 'world_canon.md'),
  path.join(cwd, 'stages', '02_planning', 'output', 'canon.md'),
  path.join(cwd, 'stages', '01_onboarding', 'output', 'canon.md'),
  path.join(cwd, 'canon.md')
]);
if (canonPath) {
  packer.emitSection('Established World Canon Facts', ContextPacker.readTextSafe(canonPath, 3500));
}

// 10. OKF Craft Card on Setting Resistance
const settingCraft = path.join(cwd, '_config', 'okf_craft', 'setting_as_dramatic_agent_and_constraint.md');
if (fs.existsSync(settingCraft)) {
  packer.emitSection('OKF Craft: Setting as Dramatic Agent & Resistance Machine', ContextPacker.readTextSafe(settingCraft, 2500));
}

packer.emitSummary();
