#!/usr/bin/env node

/**
 * Deterministic Context Packer for Subplot Collision & Crisis Reversal Playbook
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { getBeatsDir, getChapterFiles } from './path_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`Usage: node scripts/pack-subplot-collision.js <chapter_number>`);
  console.log(`Assembles main plot goals, active subplots, and beats for engineering a collision crisis.`);
  process.exit(0);
}

const chNum = parseInt(args[0], 10);
const pad = String(chNum).padStart(2, '0');

const packer = new ContextPacker(`Subplot Collision Context (Chapter ${chNum})`);
packer.emitHeader();

// 1. Target Chapter Beats / Scene Goals
const beatsDir = getBeatsDir(cwd);
const candidateBeats = [
  path.join(beatsDir, `ch${pad}.md`),
  path.join(beatsDir, `ch${chNum}.md`),
  path.join(beatsDir, `chapter_${pad}_beats.md`),
  path.join(beatsDir, `chapter_${chNum}_beats.md`)
];
const beatPath = ContextPacker.findFirstExisting(candidateBeats);
if (beatPath) {
  packer.emitSection(`Target Chapter Beats (${path.basename(beatPath)})`, ContextPacker.readTextSafe(beatPath));
}

// 2. Active Secondary Threads
const threadsPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'trackers', 'threads.md'),
  path.join(cwd, 'stages', '02_planning', 'output', 'threads.md'),
  path.join(cwd, 'threads.md'),
  path.join(cwd, '_config', 'templates', 'threads.template.md')
]);
if (threadsPath) {
  packer.emitSection('Active Secondary Threads for Collision', ContextPacker.readTextSafe(threadsPath, 3000));
}

// 3. Active Chapter Draft Excerpt (if already drafted)
const allChapters = getChapterFiles();
const draftFile = allChapters.find(f => path.basename(f).includes(`chapter_${pad}`) || path.basename(f).includes(`ch_${pad}`) || path.basename(f).includes(`ch${pad}`));
if (draftFile && fs.existsSync(draftFile)) {
  const lines = fs.readFileSync(draftFile, 'utf8').split('\n').slice(-50).join('\n');
  packer.emitSection(`Active Scene Draft Excerpt (${path.basename(draftFile)})`, lines);
}

// 4. Structure Plan Midpoint / Climax Crisis Dial
const structurePath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'structure_plan.md'),
  path.join(cwd, 'structure_plan.md')
]);
if (structurePath) {
  const text = fs.readFileSync(structurePath, 'utf8');
  const match = text.match(/(?:### Crisis|### Resolution Variety|## Layer 1)[\s\S]*?(?=\n### |\n## |$)/i);
  if (match) {
    packer.emitSection('Authenticity Guidelines on Crises & Moral Ambivalence', match[0]);
  }
}

packer.emitSummary();
