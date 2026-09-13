#!/usr/bin/env node

/**
 * Soundingboard 2.0 - Deterministic Context Packer for The Bracket Method (Playbook #18)
 * Assembles scene draft, scene card commandments, voice anchor, and bracket taxonomy.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { parse, strip } from './frontmatter.js';
import { resolveVoiceAnchor } from './anchor_resolver.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log('Usage: node scripts/pack-bracket.js <scene_or_file>');
  console.log('Example: node scripts/pack-bracket.js sc-0003');
  console.log('Assembles scene prose, scene card intent, voice anchor, and bracket editing taxonomy.');
  process.exit(0);
}

let sceneArg = args[0].trim();
if (/^\d+$/.test(sceneArg)) {
  sceneArg = `sc-${String(parseInt(sceneArg, 10)).padStart(4, '0')}`;
}

const packer = new ContextPacker(`The Bracket Method Context (${sceneArg})`);
packer.emitHeader();

// 1. Resolve Scene File
let scenePath = null;
if (fs.existsSync(sceneArg)) {
  scenePath = sceneArg;
} else {
  // Search in manuscript/ tree
  const msDir = path.join(cwd, 'manuscript');
  if (fs.existsSync(msDir)) {
    const chDirs = fs.readdirSync(msDir).filter(d => fs.statSync(path.join(msDir, d)).isDirectory());
    for (const ch of chDirs) {
      const candidate = path.join(msDir, ch, `${sceneArg}.md`);
      if (fs.existsSync(candidate)) {
        scenePath = candidate;
        break;
      }
    }
  }
  // Fallback to stages/03_drafting or stages/02_planning
  if (!scenePath) {
    const candidates = [
      path.join(cwd, 'stages', '03_drafting', 'output', 'chapters', `${sceneArg}.md`),
      path.join(cwd, 'stages', '02_planning', 'output', 'scenes', `${sceneArg}.md`),
      path.join(cwd, 'stages', '02_planning', 'output', 'beats', `${sceneArg}.md`)
    ];
    scenePath = candidates.find(c => fs.existsSync(c));
  }
}

if (!scenePath) {
  console.error(`\x1b[31mError: Scene or draft file "${sceneArg}" not found.\x1b[0m`);
  process.exit(1);
}

const rawContent = fs.readFileSync(scenePath, 'utf8');
let sceneMeta = {};
let sceneProse = '';

try {
  sceneMeta = parse(rawContent, scenePath);
  sceneProse = strip(rawContent).trim();
} catch (_) {
  sceneProse = rawContent.trim();
}

packer.emitSection(`Active Scene Draft (${path.basename(scenePath)})`, sceneProse || rawContent);

// 2. Scene Card & Structural Intent
const sceneCardContent = [];
if (sceneMeta.value_in || sceneMeta.value_out) {
  sceneCardContent.push(`- **Value Shift Intent:** ${sceneMeta.value_in || '?'} → ${sceneMeta.value_out || '?'}`);
}
if (sceneMeta.commandments && typeof sceneMeta.commandments === 'object') {
  sceneCardContent.push('### Story Grid 5 Commandments (Planned Intent):');
  Object.entries(sceneMeta.commandments).forEach(([k, v]) => {
    sceneCardContent.push(`- **${k.replace(/_/g, ' ')}:** ${v}`);
  });
}
if (sceneMeta.pov) {
  sceneCardContent.push(`- **POV:** ${sceneMeta.pov}`);
}
if (sceneMeta.location) {
  sceneCardContent.push(`- **Location:** ${sceneMeta.location}`);
}

if (sceneCardContent.length > 0) {
  packer.emitSection('Scene Card Structural Intent', sceneCardContent.join('\n'));
}

// 3. Voice Anchor Calibration
const scIdMatch = path.basename(scenePath).match(/sc-\d+/i);
if (scIdMatch) {
  const anchor = resolveVoiceAnchor(scIdMatch[0], cwd);
  if (anchor && anchor.prose) {
    packer.emitSection(`Voice Anchor (${anchor.anchorSceneId || anchor.source})`, anchor.prose);
  }
}

// 4. Bracket Method Taxonomy & Instructions
const taxonomyGuide = `
### The Bracket Taxonomy
- \`[PRESERVE]\` : The existing text is strong. Keep it exactly as-is. Explain briefly *why* it works.
- \`[CUT]\` : The text should be removed entirely (redundant, tells instead of shows, pre-empts emotional beat).
- \`[REORDER]\` : The text is good but happens in the wrong place. Specify where it should go.
- \`[STRUCTURAL NOTE: ...]\` : Explain the underlying narrative logic, emotional sequencing, or pacing reason for a change.
- \`[DRAFT SUGGESTION: ...]\` : Provide a rough draft of bridging prose or a missing beat, written in the author's voice, to demonstrate the shape of the fix. Always explicitly invite the author to revise it into their own words.

### Swain Motivating-Reaction Units (MRU) Rule
Ensure the character experiences reality in psychological order:
Action / Stimulus -> Sensation -> Emotion -> Thought -> Decision / Action.
Do not let characters feel guilt before the accusation, or relief before the danger passes.
`;

packer.emitSection('The Bracket Method Taxonomy & Protocol', taxonomyGuide.trim());

packer.emitSummary();
