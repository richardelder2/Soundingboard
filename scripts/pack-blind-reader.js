#!/usr/bin/env node

/**
 * Deterministic Context Packer for Blind Reader Simulator Playbook
 * Assembles cold-reading chapter text with strict epistemic isolation (zero future hindsight).
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { getDraftingDir, getBeatsDir, getChapterFiles } from './path_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/pack-blind-reader.js [chapter_number_or_path]`);
  console.log(`Assembles full chapter text, preceding entry anchor, and stated scene intent with strict zero-hindsight isolation.`);
  process.exit(0);
}

const packer = new ContextPacker('Blind Reader Simulator Context');
packer.emitHeader();

// 1. Resolve Target Chapter
const allChapters = getChapterFiles(cwd);
let targetChapterPath = null;
let chapterNum = null;

if (args[0]) {
  if (fs.existsSync(args[0]) && fs.statSync(args[0]).isFile()) {
    targetChapterPath = path.resolve(args[0]);
    const m = path.basename(targetChapterPath).match(/\d+/);
    if (m) chapterNum = parseInt(m[0], 10);
  } else {
    chapterNum = parseInt(args[0], 10);
  }
}

if (!targetChapterPath && chapterNum) {
  const pad = String(chapterNum).padStart(2, '0');
  targetChapterPath = allChapters.find(f => {
    const base = path.basename(f);
    return base.includes(`chapter_${pad}`) || base.includes(`ch_${pad}`) || base.includes(`chapter_${chapterNum}`) || base.includes(`ch${pad}`);
  });
}

if (!targetChapterPath && allChapters.length > 0) {
  targetChapterPath = allChapters[allChapters.length - 1];
  const m = path.basename(targetChapterPath).match(/\d+/);
  if (m) chapterNum = parseInt(m[0], 10);
}

// 2. Epistemic Isolation Guard Header
packer.emitSection('Epistemic Isolation Guard (Zero Hindsight)', `
IMPORTANT: You are simulating a first-time reader experiencing this novel chronologically for the first time.
- You have ZERO knowledge of events, plot twists, betrayals, or resolutions occurring in chapters after this one.
- You must NOT evaluate this chapter with authorial hindsight or secret worldbuilding knowledge.
- Report only what is genuinely conveyed on the page through prose, dialogue, and sensory blocking.
`.trim());

// 3. Manuscript Chronological Position
let positionInfo = `Target Chapter: ${chapterNum || 'Unknown'}`;
const manifestPath = path.join(cwd, 'manuscript.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));
    if (chapterNum && manifest.chapters) {
      const entry = manifest.chapters.find(c => c.id === chapterNum || c.chapter === chapterNum);
      if (entry) {
        positionInfo += `\nTitle: ${entry.title || 'Untitled'}\nStatus: ${entry.status || 'drafted'}\nWord Count Target: ${entry.target_words || 'N/A'}`;
        if (entry.act) positionInfo += `\nAct: ${entry.act}`;
        if (entry.pov) positionInfo += `\nPOV Character: ${entry.pov}`;
      }
    }
  } catch (e) {}
}
packer.emitSection('Chronological Reader Position', positionInfo);

// 4. Preceding Anchor (Last ~350 words of previous chapter for emotional entry velocity)
if (chapterNum && chapterNum > 1) {
  const prevNum = chapterNum - 1;
  const prevPad = String(prevNum).padStart(2, '0');
  const prevPath = allChapters.find(f => {
    const b = path.basename(f);
    return b.includes(`chapter_${prevPad}`) || b.includes(`ch_${prevPad}`) || b.includes(`chapter_${prevNum}`) || b.includes(`ch${prevPad}`);
  });

  if (prevPath && fs.existsSync(prevPath)) {
    const rawPrev = fs.readFileSync(prevPath, 'utf8');
    const words = rawPrev.split(/\s+/);
    const anchor = words.slice(-350).join(' ');
    packer.emitSection(`Preceding Scene Anchor (Ch ${prevNum} Exit Momentum)`, `... ${anchor}`);
  }
}

// 5. Stated Scene Intent & Value Shift (Author's target to compare against reader reality)
let intentFound = false;
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
      const beatsContent = fs.readFileSync(bp, 'utf8');
      // Extract frontmatter or top value shift summary
      packer.emitSection('Author Stated Scene Intent (Benchmark)', beatsContent);
      intentFound = true;
      break;
    }
  }
}

// 6. Target Chapter Text (Full prose to read cold)
if (targetChapterPath && fs.existsSync(targetChapterPath)) {
  const chapterText = fs.readFileSync(targetChapterPath, 'utf8');
  packer.emitSection(`Active Chapter Reading Draft (${path.basename(targetChapterPath)})`, chapterText);
} else {
  packer.emitSection('Active Chapter Reading Draft', 'No chapter draft found. Provide chapter number or path as argument.');
}

packer.emitSummary();
