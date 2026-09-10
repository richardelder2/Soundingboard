#!/usr/bin/env node

/**
 * Deterministic Context Packer for Character Voice Interview Playbook
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { getCharactersDir } from './path_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`Usage: node scripts/pack-interview.js <character_name>`);
  console.log(`Assembles character profile, voice exemplars, and dialogue style context.`);
  process.exit(0);
}

const charQuery = args[0].toLowerCase().trim();
const packer = new ContextPacker(`Character Interview Context (${charQuery})`);
packer.emitHeader();

// 1. Resolve Character File
const charsDir = getCharactersDir(cwd);
let charFilePath = null;

if (fs.existsSync(charsDir)) {
  const files = fs.readdirSync(charsDir).filter(f => f.endsWith('.md'));
  const found = files.find(f => f.toLowerCase().includes(charQuery));
  if (found) {
    charFilePath = path.join(charsDir, found);
  }
}

if (charFilePath && fs.existsSync(charFilePath)) {
  packer.emitSection(`Target Character Sheet (${path.basename(charFilePath)})`, ContextPacker.readTextSafe(charFilePath));
} else {
  packer.emitSection('Target Character Sheet', `Character "${charQuery}" not found under ${charsDir}.`);
}

// 2. Voice Exemplars & Dialogue Rules
const voiceExemplarPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'voice_exemplars.md'),
  path.join(cwd, 'voice_exemplars.md'),
  path.join(cwd, '00_Story_Bible', 'style_guide.md')
]);
if (voiceExemplarPath) {
  packer.emitSection('Project Voice Exemplars & Style Guide', ContextPacker.readTextSafe(voiceExemplarPath, 5000));
}

// 3. Character Arcs context if available
const arcsPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'character_arcs.md'),
  path.join(cwd, 'character_arcs.md')
]);
if (arcsPath) {
  packer.emitSection('Character Arc Map', ContextPacker.readTextSafe(arcsPath, 4000));
}

packer.emitSummary();
