#!/usr/bin/env node

/**
 * Deterministic Context Packer for Subplot Genesis & Anti-Default Architecture Playbook
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { getCharactersDir, getStoryBibleDir, getPlanningDir } from './path_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/pack-subplot-genesis.js [focus_or_theme]`);
  console.log(`Assembles foolscap controlling idea, outline spine, cast sheets, and thread ledger for subplot genesis.`);
  process.exit(0);
}

const focus = args[0] || 'Subplot Architecture';
const packer = new ContextPacker(`Subplot Genesis Context (${focus})`);
packer.emitHeader();

// 1. Foolscap Controlling Idea & Theme
const foolscapPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'foolscap.md'),
  path.join(cwd, 'foolscap.md'),
  path.join(cwd, '_config', 'templates', 'foolscap.template.md')
]);
if (foolscapPath) {
  packer.emitSection('Foolscap (Controlling Idea & Engine)', ContextPacker.readTextSafe(foolscapPath, 3500));
}

// 2. Macro Outline Spine
const outlinePath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'outline.md'),
  path.join(cwd, 'outline.md'),
  path.join(cwd, '_config', 'templates', 'outline.template.md')
]);
if (outlinePath) {
  packer.emitSection('Macro Outline Spine', ContextPacker.readTextSafe(outlinePath, 4500));
}

// 3. Existing Thread Ledger
const threadsPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'trackers', 'threads.md'),
  path.join(cwd, 'stages', '02_planning', 'output', 'threads.md'),
  path.join(cwd, 'threads.md'),
  path.join(cwd, '_config', 'templates', 'threads.template.md')
]);
if (threadsPath) {
  packer.emitSection('Existing Narrative Threads Ledger', ContextPacker.readTextSafe(threadsPath, 3000));
}

// 4. Secondary Cast Overview
const charsDir = getCharactersDir(cwd);
if (fs.existsSync(charsDir)) {
  const charFiles = fs.readdirSync(charsDir).filter(f => f.endsWith('.md'));
  if (charFiles.length > 0) {
    const castOverview = charFiles.map(f => {
      const charName = path.basename(f, '.md');
      const snippet = ContextPacker.readTextSafe(path.join(charsDir, f), 300);
      return `### ${charName.toUpperCase()}\n${snippet}\n`;
    }).join('\n');
    packer.emitSection('Cast Profiles (Potential Subplot Anchors)', castOverview);
  }
}

// 5. Narrative Authenticity Subplot Directives
const authPath = path.join(cwd, '_config', 'narrative_authenticity.md');
if (fs.existsSync(authPath)) {
  const authText = fs.readFileSync(authPath, 'utf8');
  const subplotMatch = authText.match(/(?:### Plot shape|## Layer 1)[\s\S]*?(?=\n### Time|\n## Layer 2|$)/i);
  if (subplotMatch) {
    packer.emitSection('Authenticity Directive: Mandatory Subplot Rules', subplotMatch[0]);
  }
}

packer.emitSummary();
