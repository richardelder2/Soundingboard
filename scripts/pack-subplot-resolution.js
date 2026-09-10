#!/usr/bin/env node

/**
 * Deterministic Context Packer for Subplot Resolution Variety & Loose-End Audit Playbook
 * Pure mechanical file assembly & resolution distribution audit — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/pack-subplot-resolution.js [act_or_chapter]`);
  console.log(`Audits thread resolution timing, flags resolution clumping, and packs loose-end context.`);
  process.exit(0);
}

const targetScope = args[0] || 'Whole Manuscript';
const packer = new ContextPacker(`Subplot Resolution Variety Audit (${targetScope})`);
packer.emitHeader();

// 1. Threads Ledger & Clumping Scan
const threadsPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'trackers', 'threads.md'),
  path.join(cwd, 'stages', '02_planning', 'output', 'threads.md'),
  path.join(cwd, 'threads.md'),
  path.join(cwd, '_config', 'templates', 'threads.template.md')
]);

if (threadsPath) {
  const content = fs.readFileSync(threadsPath, 'utf8');
  packer.emitSection(`Narrative Thread Ledger (${path.basename(threadsPath)})`, content);

  // Scan target resolution distribution
  const lines = content.split(/\r?\n/);
  const resolutionTargets = {};
  lines.forEach(line => {
    if (line.trim().startsWith('|') && !line.includes('---') && !line.toLowerCase().includes('| thread id |')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 6) {
        const targetRes = cells[5] || 'Unassigned';
        resolutionTargets[targetRes] = (resolutionTargets[targetRes] || 0) + 1;
      }
    }
  });

  let clumpingReport = 'Target Resolution Distribution Across Chapters:\n\n';
  clumpingReport += '| Target Chapter | Scheduled Thread Resolutions | Clumping Status |\n';
  clumpingReport += '|---|---|---|\n';
  for (const [target, count] of Object.entries(resolutionTargets)) {
    const isClumped = count >= 3;
    const badge = isClumped ? '🔴 CLUMPED ($\\ge$ 3 threads)' : '🟢 Balanced';
    clumpingReport += `| ${target} | ${count} | ${badge} |\n`;
  }
  clumpingReport += '\n*Authenticity Rule: Dismantle clumping. Stagger secondary resolutions prior to the climax.*';
  packer.emitSection('Resolution Timing & Clumping Audit', clumpingReport);
}

// 2. Structure Plan Resolution Variety & Loose-End Ledger
const structurePath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'structure_plan.md'),
  path.join(cwd, 'structure_plan.md'),
  path.join(cwd, '_config', 'templates', 'structure_plan.template.md')
]);
if (structurePath) {
  const text = fs.readFileSync(structurePath, 'utf8');
  const resolutionSection = text.match(/(?:### Resolution variety|### Loose-end ledger|## Layer 1)[\s\S]*?(?=\n### |\n## |$)/i);
  if (resolutionSection) {
    packer.emitSection('Structure Plan Resolution Variety & Loose Ends', resolutionSection[0]);
  } else {
    packer.emitSection('Structure Plan Overview', ContextPacker.readTextSafe(structurePath, 4000));
  }
}

// 3. Manuscript Production Ledger (Chapter Count & Status)
const manifestPath = path.join(cwd, 'manuscript.json');
if (fs.existsSync(manifestPath)) {
  packer.emitSection('Manuscript State', ContextPacker.readTextSafe(manifestPath, 3000));
}

packer.emitSummary();
