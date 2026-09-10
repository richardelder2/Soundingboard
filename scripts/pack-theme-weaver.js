#!/usr/bin/env node

/**
 * Deterministic Context Packer for Theme Weaver Playbook
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { getChapterFiles, getBeatsDir } from './path_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/pack-theme-weaver.js [chapter_number_or_theme]`);
  console.log(`Assembles foolscap controlling idea, structure plan dials, scene draft, and authenticity rules.`);
  process.exit(0);
}

const target = args[0] || 'Core Theme';
const packer = new ContextPacker(`Theme Weaver Context (${target})`);
packer.emitHeader();

// 1. Foolscap Controlling Idea
const foolscapPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'foolscap.md'),
  path.join(cwd, 'foolscap.md'),
  path.join(cwd, '_config', 'templates', 'foolscap.template.md')
]);
if (foolscapPath) {
  packer.emitSection('Foolscap (Controlling Idea & Engine)', ContextPacker.readTextSafe(foolscapPath, 3500));
}

// 2. Structure Plan Theme Dials
const structurePath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'structure_plan.md'),
  path.join(cwd, 'structure_plan.md')
]);
if (structurePath) {
  packer.emitSection('Structure Plan (Theme & Authenticity Dials)', ContextPacker.readTextSafe(structurePath, 4000));
}

// 3. Scene Draft or Beat File
let chNum = parseInt(target, 10);
if (!isNaN(chNum)) {
  const pad = String(chNum).padStart(2, '0');
  const allChapters = getChapterFiles();
  const chFile = allChapters.find(f => path.basename(f).includes(`chapter_${pad}`) || path.basename(f).includes(`ch_${pad}`) || path.basename(f).includes(`ch${pad}`));
  if (chFile && fs.existsSync(chFile)) {
    const lines = fs.readFileSync(chFile, 'utf8').split('\n').slice(-45).join('\n');
    packer.emitSection(`Target Chapter Excerpt (${path.basename(chFile)})`, lines);
  }
}

// 4. Non-Negotiable Authenticity Rule (Narrator Never States Theme)
packer.emitSection('Narrative Authenticity Rule 4', `THE NARRATOR NEVER STATES THE THEME.
Themes must emerge mechanically through character choices, physical objects, environmental decay/growth, and dialogue subtext. Never write a paragraph where the narrator or protagonist summarizes the philosophical takeaway or moral of a scene.`);

packer.emitSummary();
