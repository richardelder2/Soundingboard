#!/usr/bin/env node

/**
 * Deterministic Context Packer for Stage Scene Playbook
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { getBeatsDir, getChapterFiles, getPlanningDir } from './path_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`Usage: node scripts/pack-stage-scene.js <chapter_number>`);
  console.log(`Assembles structure plan requirements, preceding chapter ending, beat template, and character goals.`);
  process.exit(0);
}

const chNum = parseInt(args[0], 10);
const pad = String(chNum).padStart(2, '0');
const prevChNum = chNum > 1 ? chNum - 1 : null;
const prevPad = prevChNum ? String(prevChNum).padStart(2, '0') : null;

const packer = new ContextPacker(`Stage Scene Context (Chapter ${chNum})`);
packer.emitHeader();

// 1. Structure Plan entry for Chapter
const structurePath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'structure_plan.md'),
  path.join(cwd, 'structure_plan.md')
]);
if (structurePath) {
  const fullText = fs.readFileSync(structurePath, 'utf8');
  const chPattern = new RegExp(`(?:###?\\s*(?:Chapter\\s*${chNum}|Ch\\.?\\s*${chNum}|Chapter\\s*${pad}))[\\s\\S]*?(?=\\n###?\\s*(?:Chapter|Ch\\.)|$)`, 'i');
  const match = fullText.match(chPattern);
  if (match) {
    packer.emitSection(`Structure Plan Requirements for Chapter ${chNum}`, match[0]);
  } else {
    packer.emitSection('Structure Plan Overview', ContextPacker.readTextSafe(structurePath, 3500));
  }
}

// 2. Preceding Chapter Tail (~500 words / 40 lines)
if (prevChNum) {
  const allChapters = getChapterFiles();
  const prevFile = allChapters.find(f => path.basename(f).includes(`chapter_${prevPad}`) || path.basename(f).includes(`ch_${prevPad}`) || path.basename(f).includes(`ch${prevPad}`));
  if (prevFile && fs.existsSync(prevFile)) {
    const lines = fs.readFileSync(prevFile, 'utf8').split('\n').slice(-40).join('\n');
    packer.emitSection(`Preceding Chapter Ending (Chapter ${prevChNum} Anchor)`, lines);
  }
}

// 3. Existing Beat Sheet if present
const beatsDir = getBeatsDir(cwd);
const candidateBeats = [
  path.join(beatsDir, `ch${pad}.md`),
  path.join(beatsDir, `ch${chNum}.md`),
  path.join(beatsDir, `chapter_${pad}_beats.md`),
  path.join(beatsDir, `chapter_${chNum}_beats.md`)
];
const beatFile = ContextPacker.findFirstExisting(candidateBeats);
if (beatFile) {
  packer.emitSection(`Current Beat File (${path.basename(beatFile)})`, ContextPacker.readTextSafe(beatFile));
}

// 4. Scene Beat Template
const templatePath = path.join(cwd, '_config', 'templates', 'scene_beat.template.md');
if (fs.existsSync(templatePath)) {
  packer.emitSection('Scene Beat Standard Template', ContextPacker.readTextSafe(templatePath));
}

packer.emitSummary();
