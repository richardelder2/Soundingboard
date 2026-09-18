#!/usr/bin/env node

/**
 * Deterministic Context Packer for Socratic Discovery Playbook (/dig) — Playbook #24
 * Pure mechanical file assembly — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/pack-dig.js [target]`);
  console.log(`Assembles Socratic Discovery context (canon, target atomics, and Playbook #24 contract).`);
  process.exit(0);
}

const target = args.join(' ').trim();
const packer = new ContextPacker(`Socratic Dig Playbook Context${target ? ` [Target: ${target}]` : ''}`);
packer.emitHeader();

// 1. Core Canon Context (Where established facts live)
const canonCandidates = [
  path.join(cwd, 'stages', '02_planning', 'output', 'canon.md'),
  path.join(cwd, 'canon.md')
];

let canonLoaded = false;
for (const cp of canonCandidates) {
  if (fs.existsSync(cp)) {
    const raw = fs.readFileSync(cp, 'utf8');
    packer.emitSection('Established Story Canon', raw);
    canonLoaded = true;
    break;
  }
}
if (!canonLoaded) {
  packer.emitSection('Established Story Canon', 'No canon.md found. Starting with clean slate.');
}

// 2. Target Atomic Resolution (if target specified)
if (target) {
  let targetFound = false;

  // Check if target is a scene ID (e.g. sc-0001)
  const sceneMatch = target.match(/\bsc-\d{4}\b/i);
  if (sceneMatch) {
    const scId = sceneMatch[0].toLowerCase();
    const sceneCandidates = [
      path.join(cwd, 'manuscript', 'scenes', `${scId}.md`),
      path.join(cwd, 'stages', '02_planning', 'output', 'scenes', `${scId}.md`)
    ];
    for (const scp of sceneCandidates) {
      if (fs.existsSync(scp)) {
        packer.emitSection(`Target Scene (${scId})`, fs.readFileSync(scp, 'utf8'));
        targetFound = true;
        break;
      }
    }
  }

  // Check character dossiers
  const charDirs = [
    path.join(cwd, 'stages', '01_onboarding', 'output', 'bible', 'characters'),
    path.join(cwd, 'stages', '02_planning', 'output', 'characters')
  ];

  for (const cdir of charDirs) {
    if (fs.existsSync(cdir)) {
      const files = fs.readdirSync(cdir);
      for (const f of files) {
        if (f.toLowerCase().includes(target.toLowerCase()) && f.endsWith('.md')) {
          packer.emitSection(`Target Character Dossier (${f})`, fs.readFileSync(path.join(cdir, f), 'utf8'));
          targetFound = true;
          break;
        }
      }
    }
  }

  // Check world / location dossiers
  const worldDirs = [
    path.join(cwd, 'world'),
    path.join(cwd, 'stages', '01_onboarding', 'output', 'bible')
  ];
  for (const wdir of worldDirs) {
    if (fs.existsSync(wdir)) {
      function findTargetFile(dir, depth = 0) {
        if (depth > 2) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          if (e.isDirectory()) {
            findTargetFile(path.join(dir, e.name), depth + 1);
          } else if (e.name.toLowerCase().includes(target.toLowerCase()) && e.name.endsWith('.md')) {
            packer.emitSection(`Target World/Location Dossier (${e.name})`, fs.readFileSync(path.join(dir, e.name), 'utf8'));
            targetFound = true;
            return;
          }
        }
      }
      findTargetFile(wdir);
    }
  }

  if (!targetFound) {
    packer.emitSection('Target Resolution Note', `Target "${target}" named by author. No existing file matches; explore target as an unformed/emerging story element.`);
  }
}

// 3. Playbook #24 Contract
const playbookContract = path.join(cwd, '_config', 'templates', 'dig_playbook.template.md');
if (fs.existsSync(playbookContract)) {
  packer.emitSection('Playbook #24 Contract (Socratic Discovery)', fs.readFileSync(playbookContract, 'utf8'));
}

packer.emitSummary();
