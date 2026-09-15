#!/usr/bin/env node

/**
 * Soundingboard 2.0 - Deterministic Context Packer for Frontmatter Assistance & Graduation (Playbook #19)
 * Assembles draft prose, canon entities, active threads, and in-world options.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { parse, strip } from './frontmatter.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log('Usage: node scripts/pack-frontmatter.js <draft_path_or_scene>');
  console.log('Example: node scripts/pack-frontmatter.js writers_room/drafts/tavern.md');
  console.log('Assembles draft prose, active threads, and canon facts to assist in frontmatter drafting & graduation.');
  process.exit(0);
}

const fileArg = args[0].trim();
let filePath = null;

if (fs.existsSync(path.resolve(cwd, fileArg))) {
  filePath = path.resolve(cwd, fileArg);
} else {
  // Search common locations
  const candidates = [
    path.join(cwd, 'writers_room', 'drafts', fileArg),
    path.join(cwd, 'writers_room', 'drafts', `${fileArg}.md`),
    path.join(cwd, 'manuscript', 'scenes', `${fileArg}.md`),
    path.join(cwd, 'inputs', 'drafts', fileArg)
  ];
  filePath = candidates.find(c => fs.existsSync(c));
}

if (!filePath || !fs.existsSync(filePath)) {
  console.error(`\x1b[31mError: File "${fileArg}" not found.\x1b[0m`);
  process.exit(1);
}

const packer = new ContextPacker(`Frontmatter & Graduation Context (${path.basename(filePath)})`);
packer.emitHeader();

// 1. Read Draft Prose
const raw = fs.readFileSync(filePath, 'utf8');
let meta = {};
let body = '';
try {
  meta = parse(raw, filePath);
  body = strip(raw).trim();
} catch (_) {
  body = raw.trim();
}

packer.emitSection(`Draft Prose (${path.basename(filePath)})`, body || raw);

if (Object.keys(meta).length > 0) {
  packer.emitSection('Existing Frontmatter (If Present)', JSON.stringify(meta, null, 2));
}

// 2. Active Narrative Threads
const threadsPath = path.join(cwd, 'stages', '02_planning', 'output', 'threads.md');
if (fs.existsSync(threadsPath)) {
  packer.emitSection('Active Story Threads (threads.md)', fs.readFileSync(threadsPath, 'utf8'));
}

// 3. Canon Entities & World Context
const canonPath = path.join(cwd, 'stages', '02_planning', 'output', 'canon.md');
if (fs.existsSync(canonPath)) {
  const canonRaw = fs.readFileSync(canonPath, 'utf8');
  packer.emitSection('Canon Entities & Lore (canon.md)', canonRaw.slice(0, 4000));
}

// 4. Playbook 19 Guide
const guide = `
### Playbook #19 Mandate:
1. **Analyze Draft Prose:** Extract focalizing POV, physical staging location, emotional/value shift, 5 commandments, and touched threads.
2. **Surface for Author Approval:** Propose the YAML frontmatter cleanly in chat. NEVER guess silently.
3. **If Graduating:** On author sign-off, assign canonical sc-XXXX ID and move to manuscript/scenes/sc-XXXX.md.
`;
packer.emitSection('Frontmatter Assistance Protocol', guide.trim());

packer.emitSummary();
