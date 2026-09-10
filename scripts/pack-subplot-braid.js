#!/usr/bin/env node

/**
 * Deterministic Context Packer for Subplot Braiding & Thread Freshening Playbook
 * Pure mechanical file assembly & thread dormancy calculation — zero LLM calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { getBeatsDir, getChapterFiles } from './path_helper.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`Usage: node scripts/pack-subplot-braid.js <chapter_number>`);
  console.log(`Calculates thread dormancy, checks scene beats, and packs context for weaving subplots.`);
  process.exit(0);
}

const chNum = parseInt(args[0], 10);
const pad = String(chNum).padStart(2, '0');
const prevChNum = chNum > 1 ? chNum - 1 : null;
const prevPad = prevChNum ? String(prevChNum).padStart(2, '0') : null;

const packer = new ContextPacker(`Subplot Braiding Context (Chapter ${chNum})`);
packer.emitHeader();

// 1. Thread Ledger & Dormancy Calculation
const threadsPath = ContextPacker.findFirstExisting([
  path.join(cwd, 'stages', '02_planning', 'output', 'trackers', 'threads.md'),
  path.join(cwd, 'stages', '02_planning', 'output', 'threads.md'),
  path.join(cwd, 'threads.md'),
  path.join(cwd, '_config', 'templates', 'threads.template.md')
]);

if (threadsPath) {
  const content = fs.readFileSync(threadsPath, 'utf8');
  packer.emitSection(`Active Threads Ledger (${path.basename(threadsPath)})`, content);

  // Parse lines to calculate dormancy
  const lines = content.split(/\r?\n/);
  const activeThreads = [];
  lines.forEach(line => {
    if (line.trim().startsWith('|') && !line.includes('---') && !line.toLowerCase().includes('| thread id |')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 6) {
        const status = cells[6] || 'open';
        if (status.toLowerCase() !== 'resolved') {
          const latestStr = cells[4] || '';
          const match = latestStr.match(/\d+/);
          const latestCh = match ? parseInt(match[0], 10) : 0;
          const dormancy = latestCh > 0 ? chNum - latestCh : chNum;
          activeThreads.push({
            id: cells[0],
            desc: cells[1],
            type: cells[2],
            latestCh,
            dormancy
          });
        }
      }
    }
  });

  if (activeThreads.length > 0) {
    let report = `Thread Freshness Audit relative to Chapter ${chNum}:\n\n`;
    report += `| Thread ID | Type | Description | Latest Ch | Dormancy | Urgency |\n`;
    report += `|---|---|---|---|---|---|\n`;
    activeThreads.forEach(t => {
      let urgency = '🟢 Fresh';
      if (t.dormancy >= 4) {
        urgency = '🔴 CRITICAL (Dormant $\\ge$ 4 chapters)';
      } else if (t.dormancy >= 2) {
        urgency = '🟡 Due for Braiding (Dormant $\\ge$ 2 chapters)';
      }
      report += `| **${t.id}** | ${t.type} | ${t.desc.slice(0, 30)} | Ch ${t.latestCh || '?'} | ${t.dormancy} chs | ${urgency} |\n`;
    });
    report += `\n*Recommendation: Threads with dormancy $\\ge$ 2 should receive a background touch, dialogue undercurrent, or tactical obstacle in Chapter ${chNum}.*`;
    packer.emitSection('Thread Dormancy & Starvation Analysis', report);
  }
}

// 2. Active Chapter Beats
const beatsDir = getBeatsDir(cwd);
const candidateBeats = [
  path.join(beatsDir, `ch${pad}.md`),
  path.join(beatsDir, `ch${chNum}.md`),
  path.join(beatsDir, `chapter_${pad}_beats.md`),
  path.join(beatsDir, `chapter_${chNum}_beats.md`)
];
const beatPath = ContextPacker.findFirstExisting(candidateBeats);
if (beatPath) {
  packer.emitSection(`Target Chapter Beats (${path.basename(beatPath)})`, ContextPacker.readTextSafe(beatPath));
}

// 3. Preceding Chapter Tail Excerpt
if (prevChNum) {
  const allChapters = getChapterFiles();
  const prevFile = allChapters.find(f => path.basename(f).includes(`chapter_${prevPad}`) || path.basename(f).includes(`ch_${prevPad}`) || path.basename(f).includes(`ch${prevPad}`));
  if (prevFile && fs.existsSync(prevFile)) {
    const lines = fs.readFileSync(prevFile, 'utf8').split('\n').slice(-40).join('\n');
    packer.emitSection(`Preceding Chapter Excerpt (Ch ${prevChNum})`, lines);
  }
}

packer.emitSummary();
