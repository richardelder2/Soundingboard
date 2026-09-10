#!/usr/bin/env node

/**
 * Deterministic Context Packer for WWXDU (What Would X Do) Playbook
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { getCharactersDir } from './path_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`Usage: node scripts/pack-wwxdu.js <character_name>`);
  console.log(`Assembles character profile, established canon facts, relationships, and voice exemplars.`);
  process.exit(0);
}

const charQuery = args[0].toLowerCase().trim();
const packer = new ContextPacker(`WWXDU Scenario Drop-Test Context (${charQuery})`);
packer.emitHeader();

// 1. Resolve Character Profile
const charsDir = getCharactersDir(cwd);
let charFilePath = null;
if (fs.existsSync(charsDir)) {
  const files = fs.readdirSync(charsDir).filter(f => f.endsWith('.md'));
  const found = files.find(f => f.toLowerCase().includes(charQuery));
  if (found) charFilePath = path.join(charsDir, found);
}

if (charFilePath && fs.existsSync(charFilePath)) {
  packer.emitSection(`Target Character Sheet (${path.basename(charFilePath)})`, ContextPacker.readTextSafe(charFilePath));
} else {
  packer.emitSection('Target Character Sheet', `Character "${charQuery}" not found under ${charsDir}.`);
}

// 2. Canon Facts
const canonPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'canon.md'),
  path.join(cwd, 'canon.md')
]);
if (canonPath) {
  packer.emitSection('Established Canon Facts', ContextPacker.readTextSafe(canonPath, 5000));
}

// 3. Voice Exemplars
const voicePath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'voice_exemplars.md'),
  path.join(cwd, 'voice_exemplars.md')
]);
if (voicePath) {
  packer.emitSection('Voice Exemplars & Dialect Rules', ContextPacker.readTextSafe(voicePath, 3500));
}

packer.emitSummary();
