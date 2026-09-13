#!/usr/bin/env node

/**
 * Soundingboard 2.0 - Scene-Scoped Drafting Context Packer
 * Assembles token-disciplined drafting kit (<= 6,000 tokens):
 * 1. Target scene card with Story Grid 5 Commandments and value shift intent.
 * 2. Matched canon entities with spoiler guard (respecting reader_known_as_of).
 * 3. Voice anchor prose calibrated to same POV via anchor_resolver.js.
 * 4. Targeted OKF craft cards selected from scene needs and craft_modules.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { parse } from './frontmatter.js';
import { resolveVoiceAnchor } from './anchor_resolver.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log('Usage: node scripts/pack-scene.js <scene_id>');
  console.log('Example: node scripts/pack-scene.js sc-0001');
  console.log('Assembles trimmed scene drafting kit (<= 6,000 tokens) with same-POV anchor and canon matching.');
  process.exit(0);
}

let sceneArg = args[0].trim();
// Support numeric shorthand like "1" -> "sc-0001"
if (/^\d+$/.test(sceneArg)) {
  sceneArg = `sc-${String(parseInt(sceneArg, 10)).padStart(4, '0')}`;
}

const packer = new ContextPacker(`Scene Drafting Kit (${sceneArg})`);
packer.emitHeader();

// 1. Locate and load target scene card
let sceneFile = null;
let sceneData = null;
let sceneContent = '';

// Check manuscript/ tree first
const msDir = path.join(cwd, 'manuscript');
if (fs.existsSync(msDir)) {
  const chDirs = fs.readdirSync(msDir).filter(d => fs.statSync(path.join(msDir, d)).isDirectory());
  for (const ch of chDirs) {
    const candidate = path.join(msDir, ch, `${sceneArg}.md`);
    if (fs.existsSync(candidate)) {
      sceneFile = candidate;
      break;
    }
  }
}

// Fallback search in stages/02_planning/output/scenes/ or beats/
if (!sceneFile) {
  const fallbackCandidates = [
    path.join(cwd, 'stages', '02_planning', 'output', 'scenes', `${sceneArg}.md`),
    path.join(cwd, 'stages', '02_planning', 'output', 'beats', `${sceneArg}.md`)
  ];
  sceneFile = fallbackCandidates.find(c => fs.existsSync(c));
}

if (!sceneFile) {
  console.error(`\x1b[31mError: Scene card "${sceneArg}" not found in manuscript/ tree.\x1b[0m`);
  process.exit(1);
}

sceneContent = fs.readFileSync(sceneFile, 'utf8');
try {
  sceneData = parse(sceneContent, sceneFile);
} catch (e) {
  console.warn(`Warning: Could not parse scene frontmatter: ${e.message}`);
  sceneData = { id: sceneArg };
}

packer.emitSection(`Scene Card (${sceneArg})`, sceneContent);

// Extract entity names from scene card
const mentionedEntities = new Set();
if (sceneData.pov) mentionedEntities.add(String(sceneData.pov).toLowerCase().trim());
if (sceneData.location) mentionedEntities.add(String(sceneData.location).toLowerCase().trim());

// Scan body for markdown links [Name](...)
const linkMatches = sceneContent.match(/\[([^\]]+)\]\([^)]+\)/g) || [];
linkMatches.forEach(m => {
  const text = m.replace(/^\[/, '').replace(/\].*$/, '').toLowerCase().trim();
  if (text.length > 2) mentionedEntities.add(text);
});

// 2. Resolve Voice Anchor Prose (Same-POV)
const anchorRes = resolveVoiceAnchor(sceneArg, cwd);
if (anchorRes.prose) {
  const anchorTag = anchorRes.anchorSceneId ?
    `Resolved Anchor: ${anchorRes.anchorSceneId} (POV: ${anchorRes.pov || 'unknown'})` :
    `Baseline Voice Sample (${anchorRes.source})${anchorRes.anchorProvisional ? ' [PROVISIONAL]' : ''}`;
  packer.emitSection(`Voice Anchor Calibration Prose (${anchorTag})`, anchorRes.prose);
} else {
  packer.emitSection('Voice Anchor Calibration Prose', 'No prior scene or voice sample available. Anchor is provisional.');
}

// 3. Canon Extraction with Spoiler Guard
function parseSceneNum(id) {
  const m = String(id || '').match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}
const targetSceneNum = parseSceneNum(sceneArg);

const canonLayers = ContextPacker.resolveCascadingCanon(cwd);
const matchedCanonRows = [];
const globalRuleRows = [];
let withheldCount = 0;

for (const layer of canonLayers) {
  const rawCanon = fs.readFileSync(layer.path, 'utf8');
  const lines = rawCanon.split(/\r?\n/);
  let inWorldSection = false;

  for (const line of lines) {
    if (/^#{1,3}\s+.*(?:world|mechanic|rule|magic|setting|cosmolog|law)/i.test(line)) {
      inWorldSection = true;
    } else if (/^#{1,3}\s+/.test(line)) {
      inWorldSection = false;
    }

    if (line.trim().startsWith('|') && !line.includes('---') && !line.toLowerCase().includes('| entity |')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 3) {
        const entName = cells[0].replace(/[\[\]]/g, '').trim();
        const entLower = entName.toLowerCase();

        // Check reader_known_as_of column (column index 4 if 7-column schema)
        let readerKnownAsOf = 0;
        if (cells.length >= 6) {
          const knownCell = cells[4];
          if (/sc-\d+/i.test(knownCell)) {
            readerKnownAsOf = parseSceneNum(knownCell);
          }
        }

        // Spoiler Guard: If the reader only discovers this in a later scene, withhold it!
        if (readerKnownAsOf > 0 && targetSceneNum > 0 && readerKnownAsOf > targetSceneNum) {
          withheldCount++;
          continue;
        }

        const isMentioned = Array.from(mentionedEntities).some(e => entLower.includes(e) || e.includes(entLower));

        if (inWorldSection || /world|magic|rule/i.test(entLower)) {
          globalRuleRows.push(`| [${layer.level}] | ${line.replace(/^\|/, '').trim()}`);
        } else if (isMentioned || mentionedEntities.size === 0) {
          matchedCanonRows.push(`| [${layer.level}] | ${line.replace(/^\|/, '').trim()}`);
        }
      }
    }
  }
}

const canonOutput = [];
if (globalRuleRows.length > 0) {
  canonOutput.push('### Invariant World Rules\n' + globalRuleRows.join('\n'));
}
if (matchedCanonRows.length > 0) {
  canonOutput.push('### Active Entity Facts\n' + matchedCanonRows.join('\n'));
}
if (withheldCount > 0) {
  canonOutput.push(`\n*(Note: ${withheldCount} future fact(s) withheld by Spoiler Guard — reader_known_as_of > current scene)*`);
}

if (canonOutput.length > 0) {
  packer.emitSection('Matched Canon Facts (Spoiler-Guarded)', canonOutput.join('\n\n'));
} else {
  packer.emitSection('Matched Canon Facts', 'No matching canon rows found for entities on stage.');
}

// 4. Targeted Craft Cards
const targetedCraftModules = [];
if (Array.isArray(sceneData.craft_modules)) {
  targetedCraftModules.push(...sceneData.craft_modules);
}

// Core scene craft card is always included if available
const coreSceneCraft = path.join(cwd, '_config', 'okf_craft', 'scene_level_five_commandments_coyne.md');
if (fs.existsSync(coreSceneCraft) && targetedCraftModules.length === 0) {
  targetedCraftModules.push('scene_level_five_commandments_coyne');
}

const craftSections = [];
for (const mod of targetedCraftModules.slice(0, 2)) {
  const modFile = mod.endsWith('.md') ? mod : `${mod}.md`;
  const modPath = path.join(cwd, '_config', 'okf_craft', modFile);
  if (fs.existsSync(modPath)) {
    const text = fs.readFileSync(modPath, 'utf8');
    craftSections.push(text);
  }
}

if (craftSections.length > 0) {
  packer.emitSection('Targeted Craft Cards', craftSections.join('\n\n---\n\n'));
}

packer.emitSummary();
