#!/usr/bin/env node

/**
 * Deterministic Context Packer for Causal Calculus (Therefore / But) Playbook
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { getBeatsDir } from './path_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`Usage: node scripts/pack-causality.js <chapter_number_or_beatsheet_path>`);
  console.log(`Extracts beat sequence and pairs each adjacent beat for causal linkage analysis.`);
  process.exit(0);
}

const input = args[0];
let beatsPath = null;

if (fs.existsSync(input)) {
  beatsPath = input;
} else if (!isNaN(parseInt(input, 10))) {
  const chNum = parseInt(input, 10);
  const pad = String(chNum).padStart(2, '0');
  const beatsDir = getBeatsDir(cwd);
  const candidates = [
    path.join(beatsDir, `ch${pad}.md`),
    path.join(beatsDir, `ch${chNum}.md`),
    path.join(beatsDir, `chapter_${pad}_beats.md`),
    path.join(beatsDir, `chapter_${chNum}_beats.md`),
    path.join(cwd, '01_Planning', 'beats', `chapter_${pad}_beats.md`)
  ];
  beatsPath = ContextPacker.findFirstExisting(candidates);
}

const packer = new ContextPacker(`Causal Calculus Beat Sequence (${input})`);
packer.emitHeader();

if (!beatsPath || !fs.existsSync(beatsPath)) {
  packer.emitSection('Error', `Could not resolve beatsheet for "${input}". Ensure beats exist in stages/02_planning/output/beats/`);
  packer.emitSummary();
  process.exit(1);
}

const content = fs.readFileSync(beatsPath, 'utf8');
const lines = content.split('\n');

const beatItems = [];
lines.forEach((line, idx) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
    beatItems.push({
      lineNum: idx + 1,
      raw: trimmed,
      text: trimmed.slice(5).trim()
    });
  }
});

packer.emitSection(`Full Beatsheet File (${path.basename(beatsPath)})`, content);

if (beatItems.length < 2) {
  packer.emitSection('Causal Analysis Notice', `Found ${beatItems.length} beats. Causal linking requires at least 2 beats.`);
} else {
  let pairsOutput = `Found ${beatItems.length} sequential beats across ${beatItems.length - 1} transition points:\n\n`;
  for (let i = 0; i < beatItems.length - 1; i++) {
    const a = beatItems[i];
    const b = beatItems[i + 1];
    pairsOutput += `### Transition ${i + 1}: Beat ${i + 1} ➔ Beat ${i + 2}\n`;
    pairsOutput += `- **Beat ${i + 1} (Line ${a.lineNum}):** "${a.text}"\n`;
    pairsOutput += `- **Beat ${i + 2} (Line ${b.lineNum}):** "${b.text}"\n`;
    pairsOutput += `- **Causal Check:** Is Beat ${i + 2} connected by *THEREFORE* (consequence), *BUT* (reversal/obstacle), or weak *AND THEN* (episodic drift)?\n\n`;
  }
  packer.emitSection('Sequential Beat Pairs for Audit', pairsOutput);
}

packer.emitSummary();
