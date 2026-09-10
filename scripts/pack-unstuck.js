#!/usr/bin/env node

/**
 * Deterministic Context Packer for Unstuck Playbook
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { getDraftingDir, getBeatsDir, getChapterFiles } from './path_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/pack-unstuck.js [chapter_number]`);
  console.log(`Assembles active chapter tail, beatsheet, canon, and structure plan context.`);
  process.exit(0);
}

const packer = new ContextPacker('Unstuck Playbook Context');
packer.emitHeader();

// 1. Resolve active chapter
const allChapters = getChapterFiles();
let targetChapterPath = null;
let chapterNum = args[0] ? parseInt(args[0], 10) : null;

if (chapterNum) {
  const pad = String(chapterNum).padStart(2, '0');
  targetChapterPath = allChapters.find(f => {
    const base = path.basename(f);
    return base.includes(`chapter_${pad}`) || base.includes(`ch_${pad}`) || base.includes(`chapter_${chapterNum}`) || base.includes(`ch${pad}`);
  });
} else if (allChapters.length > 0) {
  targetChapterPath = allChapters[allChapters.length - 1];
  const match = path.basename(targetChapterPath).match(/\d+/);
  if (match) chapterNum = parseInt(match[0], 10);
}

if (targetChapterPath && fs.existsSync(targetChapterPath)) {
  const raw = fs.readFileSync(targetChapterPath, 'utf8');
  const lines = raw.split('\n');
  const tail = lines.slice(-50).join('\n');
  packer.emitSection(`Active Chapter Draft Tail (${path.basename(targetChapterPath)})`, tail);
} else {
  packer.emitSection('Active Chapter Draft', 'No drafting chapters found or specified.');
}

// 2. Resolve Beatsheet
if (chapterNum) {
  const pad = String(chapterNum).padStart(2, '0');
  const beatsDir = getBeatsDir(cwd);
  const candidateBeats = [
    path.join(beatsDir, `ch${pad}.md`),
    path.join(beatsDir, `ch${chapterNum}.md`),
    path.join(beatsDir, `chapter_${pad}_beats.md`),
    path.join(beatsDir, `chapter_${chapterNum}_beats.md`),
    path.join(cwd, '01_Planning', 'beats', `chapter_${pad}_beats.md`)
  ];
  const beatPath = ContextPacker.findFirstExisting(candidateBeats);
  if (beatPath) {
    packer.emitSection(`Scene Beatsheet (${path.basename(beatPath)})`, ContextPacker.readTextSafe(beatPath));
  }
}

// 3. Resolve Canon
const canonPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'canon.md'),
  path.join(cwd, 'canon.md'),
  path.join(cwd, '00_Story_Bible', 'canon.md')
]);
if (canonPath) {
  packer.emitSection('Project Canon (Summary / Active Facts)', ContextPacker.readTextSafe(canonPath, 6000));
}

// 4. Resolve Structure Plan
const structurePath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'structure_plan.md'),
  path.join(cwd, 'structure_plan.md'),
  path.join(cwd, '01_Planning', 'structure_plan.md')
]);
if (structurePath) {
  packer.emitSection('Structure Plan (Obligatory Scenes & Authenticity Dials)', ContextPacker.readTextSafe(structurePath, 5000));
}

packer.emitSummary();
