#!/usr/bin/env node

/**
 * Deterministic Context Packer for Plot Interrogator & Devil's Advocate Playbook
 * Assembles scene turning points, character capabilities, world constraints, and timeline facts.
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { getDraftingDir, getBeatsDir, getChapterFiles } from './path_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/pack-plot-interrogator.js [chapter_or_scene_file]`);
  console.log(`Assembles scene text/beats, character capabilities, physical world limits, and canon constraints for rigorous plot stress-testing.`);
  process.exit(0);
}

const packer = new ContextPacker("Plot Interrogator & Devil's Advocate Context");
packer.emitHeader();

// 1. Resolve Target Scene / Chapter
const allChapters = getChapterFiles(cwd);
let targetPath = null;
let chapterNum = null;

if (args[0]) {
  if (fs.existsSync(args[0]) && fs.statSync(args[0]).isFile()) {
    targetPath = path.resolve(args[0]);
    const m = path.basename(targetPath).match(/\d+/);
    if (m) chapterNum = parseInt(m[0], 10);
  } else if (!isNaN(parseInt(args[0], 10))) {
    chapterNum = parseInt(args[0], 10);
  }
}

if (!targetPath && chapterNum) {
  const pad = String(chapterNum).padStart(2, '0');
  targetPath = allChapters.find(f => {
    const base = path.basename(f);
    return base.includes(`chapter_${pad}`) || base.includes(`ch_${pad}`) || base.includes(`chapter_${chapterNum}`) || base.includes(`ch${pad}`);
  });
}

if (!targetPath && allChapters.length > 0) {
  targetPath = allChapters[allChapters.length - 1];
  const m = path.basename(targetPath).match(/\d+/);
  if (m) chapterNum = parseInt(m[0], 10);
}

// 2. Active Scene Text or Beats
let sceneLoaded = false;
if (targetPath && fs.existsSync(targetPath)) {
  const text = fs.readFileSync(targetPath, 'utf8');
  packer.emitSection(`Target Scene / Chapter Under Examination (${path.basename(targetPath)})`, text);
  sceneLoaded = true;
}

// Check beatsheet if prose wasn't found or as companion context
if (chapterNum) {
  const pad = String(chapterNum).padStart(2, '0');
  const beatsDir = getBeatsDir(cwd);
  const candidateBeats = [
    path.join(beatsDir, `ch${pad}.md`),
    path.join(beatsDir, `ch${chapterNum}.md`),
    path.join(beatsDir, `ch${pad}_beats.md`),
    path.join(beatsDir, `chapter_${pad}_beats.md`),
  ];
  for (const bp of candidateBeats) {
    if (fs.existsSync(bp)) {
      packer.emitSection(`Scene Turning Points & Beat Structure (${path.basename(bp)})`, fs.readFileSync(bp, 'utf8'));
      sceneLoaded = true;
      break;
    }
  }
}

if (!sceneLoaded) {
  packer.emitSection('Target Scene', 'No target chapter or beatsheet specified. Provide chapter number or path as argument.');
}

// 3. Physical World Constraints & Limitations (World Bible)
const worldBibleCandidates = [
  path.join(cwd, 'stages', '01_onboarding', 'output', 'bible', 'world_bible.md'),
  path.join(cwd, '01_Planning', 'world_bible.md'),
  path.join(cwd, 'world_bible.md'),
];
let worldLoaded = false;
for (const wb of worldBibleCandidates) {
  if (fs.existsSync(wb)) {
    const raw = fs.readFileSync(wb, 'utf8');
    packer.emitSection('World Laws, Tech/Magic Limits & Physical Constraints', raw);
    worldLoaded = true;
    break;
  }
}
if (!worldLoaded) {
  packer.emitSection('World Laws', 'No world_bible.md found. Assess constraints using standard physical reality and genre conventions.');
}

// 4. Character Capabilities & Skills
const charDirCandidates = [
  path.join(cwd, 'stages', '01_onboarding', 'output', 'characters'),
  path.join(cwd, '01_Planning', 'characters'),
  path.join(cwd, 'characters')
];
let charSummaries = [];
for (const cd of charDirCandidates) {
  if (fs.existsSync(cd)) {
    const files = fs.readdirSync(cd).filter(f => f.endsWith('.md'));
    files.forEach(f => {
      const cText = fs.readFileSync(path.join(cd, f), 'utf8');
      const lines = cText.split('\n');
      const name = path.basename(f, '.md');
      // Grab role, competence, and contradiction lines
      const summaryLines = lines.filter(l => /role:|competence:|contradiction:|skills:|profession:/i.test(l));
      if (summaryLines.length > 0) {
        charSummaries.push(`### ${name}\n${summaryLines.join('\n')}`);
      } else {
        charSummaries.push(`### ${name}\n${lines.slice(0, 15).join('\n')}`);
      }
    });
    break;
  }
}
if (charSummaries.length > 0) {
  packer.emitSection('Active Character Capabilities & Knowledge Baseline', charSummaries.join('\n\n'));
}

// 5. Canon & Physical Evidence Ledger
const canonCandidates = [
  path.join(cwd, 'stages', '02_planning', 'output', 'canon.md'),
  path.join(cwd, '01_Planning', 'canon.md'),
  path.join(cwd, 'canon.md')
];
const canonPath = canonCandidates.find(c => fs.existsSync(c));
if (canonPath) {
  const canonRaw = fs.readFileSync(canonPath, 'utf8');
  // Include first 100 lines of canon for active facts
  const canonLines = canonRaw.split('\n').slice(0, 100).join('\n');
  packer.emitSection('Canon State & Established In-World Facts', canonLines);
}

packer.emitSummary();
