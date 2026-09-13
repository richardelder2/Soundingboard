#!/usr/bin/env node
// Mechanical continuity assist (Stage 04).
// Scans all chapters for proper-noun issues the judgment audit easily misses:
//   1. Near-duplicate names (Elara/Elera — likely a misspelled character)
//   2. Single-chapter names (possible renamed/orphaned characters)
//   3. A name-first-appearance index (for canon.md cross-checking)
// Judgment-level continuity (facts, timeline, knowledge state) stays with the
// canon check in stages/04_diagnostics_edits/CONTEXT.md — this is only the countable part.
//
// Usage: node scripts/continuity_scan.js [chapters-dir]
// Report: stages/04_diagnostics_edits/output/reports/continuity_names.md

import * as fs from 'fs';
import * as path from 'path';
import { parse, strip } from './frontmatter.js';
import { findScenePath } from './hash_staleness.js';
import { calculateCoverage, formatCoverageMarkdown, formatCoverageConsole } from './coverage_reporter.js';

const DEFAULT_INPUT = path.join('stages', '03_drafting', 'output', 'chapters');
const REPORT_DIR = path.join('stages', '04_diagnostics_edits', 'output', 'reports');

// Common capitalized non-names to ignore (sentence starters slip through the mid-sentence filter occasionally)
const STOPWORDS = new Set(['The', 'She', 'He', 'They', 'It', 'And', 'But', 'Then', 'When', 'What', 'That', 'This', 'There', 'Her', 'His', 'You', 'Not', 'Now', 'Once', 'After', 'Before', 'Inside', 'Outside', 'Chapter', 'God', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'North', 'South', 'East', 'West', 'Earth', 'Everyone', 'Everything', 'Nobody', 'Nothing', 'Someone', 'Something', 'Maybe', 'Yes', 'No', 'Okay', 'Fine', 'Right', 'Well', 'Look', 'Wait', 'Stop', 'Please', 'Thanks', 'Sorry', 'Jesus', 'Christ', 'Mom', 'Dad', 'Mother', 'Father', 'Doctor', 'Captain', 'Sergeant', 'Commander', 'Chief', 'Professor', 'Mister', 'Miss']);

// Extract capitalized tokens with positional evidence. Names in prose usually OPEN
// sentences, so a pure mid-sentence filter misses them; instead we count every
// occurrence and track two "definitely a name" signals per token:
//   mid  — appeared mid-sentence at least once
//   poss — appeared with a possessive ('s) at least once
function extractTokens(text) {
  const tokens = new Map(); // word → { total, mid, poss }
  const re = /(^|[\s"“”'‘(—-])([A-Z][a-z]{2,})(['’]s)?\b/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    const word = m[2];
    if (STOPWORDS.has(word)) continue;
    const entry = tokens.get(word) || { total: 0, mid: 0, poss: 0 };
    entry.total++;
    // mid-sentence: the char before the separator isn't a sentence terminator/line start
    const before = text.slice(Math.max(0, m.index - 1), m.index);
    if (m[1] && before && !/[.!?\n]/.test(before) && !/[\n]/.test(m[1])) entry.mid++;
    if (m[3]) entry.poss++;
    tokens.set(word, entry);
  }
  return tokens;
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

function collectContinuityFiles(targets) {
  const files = [];
  const targetList = targets && targets.length ? targets : [DEFAULT_INPUT];

  for (const t of targetList) {
    let candidatePath = t;
    if (/^sc-\d+$/i.test(t)) {
      const found = findScenePath(t.toLowerCase());
      if (found) candidatePath = found;
    }

    if (!fs.existsSync(candidatePath)) {
      const found = findScenePath(t.toLowerCase());
      if (found) {
        candidatePath = found;
      } else {
        console.error(`Skipping missing path: ${t}`);
        continue;
      }
    }

    const stat = fs.statSync(candidatePath);
    if (stat.isDirectory()) {
      const entries = fs.readdirSync(candidatePath, { withFileTypes: true });
      for (const entry of entries) {
        const subPath = path.join(candidatePath, entry.name);
        if (entry.isDirectory() && /^ch-/i.test(entry.name)) {
          fs.readdirSync(subPath)
            .filter(f => /^sc-\d+\.md$/i.test(f) || /\.(md|txt|markdown)$/i.test(f))
            .filter(f => f !== 'chapter.md')
            .forEach(f => files.push(path.join(subPath, f)));
        } else if (entry.isFile() && /\.(md|txt|markdown)$/i.test(entry.name)) {
          if (entry.name !== 'chapter.md') {
            files.push(subPath);
          }
        }
      }
    } else {
      files.push(candidatePath);
    }
  }
  return files;
}

function loadCanonEntities(rootDir = process.cwd()) {
  const canonEntities = new Map(); // entityName -> { tier, fact, status }
  const canonSources = [];
  const bookCanon = path.join(rootDir, 'stages', '02_planning', 'output', 'canon.md');
  if (fs.existsSync(bookCanon)) canonSources.push({ level: 'Book Local', path: bookCanon });
  const seriesCandidates = [
    path.join(rootDir, '..', 'series', 'series_canon.md'),
    path.join(rootDir, '..', 'series_canon.md'),
    path.join(rootDir, 'series', 'series_canon.md')
  ];
  const seriesCanon = seriesCandidates.find(c => fs.existsSync(c));
  if (seriesCanon) canonSources.push({ level: 'Series', path: seriesCanon });
  const worldCandidates = [
    path.join(rootDir, '..', '..', 'world', 'world_canon.md'),
    path.join(rootDir, '..', 'world', 'world_canon.md'),
    path.join(rootDir, 'world', 'world_canon.md')
  ];
  const worldCanon = worldCandidates.find(c => fs.existsSync(c));
  if (worldCanon) canonSources.push({ level: 'World Universe', path: worldCanon });

  for (const source of canonSources) {
    const raw = fs.readFileSync(source.path, 'utf8').replace(/^\uFEFF/, '');
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      if (line.trim().startsWith('|') && !line.includes('---') && !line.toLowerCase().includes('| entity |')) {
        const cells = line.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length >= 2) {
          const entityName = cells[0].replace(/[\[\]]/g, '').trim();
          if (entityName.length >= 2 && !STOPWORDS.has(entityName)) {
            canonEntities.set(entityName.toLowerCase(), {
              name: entityName,
              tier: source.level,
              fact: cells[1] || '',
              status: cells[2] || ''
            });
          }
        }
      }
    }
  }

  return { canonEntities, canonSources };
}

export function runContinuityScan(targets, options = {}) {
  const files = collectContinuityFiles(targets);
  if (files.length === 0) {
    console.error(`No files found to scan for continuity.`);
    process.exitCode = 1;
    return;
  }

  // Derive rootDir from first file if options.rootDir not set
  let detectedRoot = options.rootDir || process.cwd();
  if (!options.rootDir && files.length > 0) {
    const candidatePath = path.resolve(files[0]);
    const stagesIdx = candidatePath.indexOf('stages');
    const manuscriptIdx = candidatePath.indexOf('manuscript');
    if (stagesIdx !== -1) {
      detectedRoot = candidatePath.slice(0, stagesIdx - 1);
    } else if (manuscriptIdx !== -1) {
      detectedRoot = candidatePath.slice(0, manuscriptIdx - 1);
    }
  }

  const { canonEntities, canonSources } = loadCanonEntities(detectedRoot);

  // word → { total, mid, poss, chapters: Map(file → count), first: file }
  const registry = new Map();
  const examinedSceneIds = [];

  for (const file of files) {
    const rawContent = fs.readFileSync(file, 'utf8');
    let sceneMeta = null;
    try {
      sceneMeta = parse(rawContent, file);
    } catch (e) {
      sceneMeta = null;
    }
    const sceneId = sceneMeta?.id || (path.basename(file).startsWith('sc-') ? path.basename(file, '.md') : null);
    if (sceneId) examinedSceneIds.push(sceneId);

    const text = strip(rawContent);
    const label = sceneId || path.basename(file);

    for (const [word, t] of extractTokens(text)) {
      if (!registry.has(word)) registry.set(word, { total: 0, mid: 0, poss: 0, chapters: new Map(), first: label });
      const entry = registry.get(word);
      entry.total += t.total;
      entry.mid += t.mid;
      entry.poss += t.poss;
      entry.chapters.set(label, (entry.chapters.get(label) || 0) + t.total);
    }
  }

  // Confirmed names:
  // For single-scene scans: >= 1 occurrence with mid-sentence or possessive signal
  // For multi-scene scans: >= 2 occurrences with at least one signal
  const isSingleScene = files.length === 1;
  const minOccurrences = isSingleScene ? 1 : 2;

  const names = [...registry.entries()]
    .filter(([, e]) => e.total >= minOccurrences && (e.mid >= 1 || e.poss >= 1))
    .sort((a, b) => b[1].total - a[1].total);

  // 1. Near-duplicates:
  // A) Compare confirmed names against allTokens in the scanned prose
  // B) Compare allTokens against established canonEntities (catches typo like "Cathryn" against canon "Kathryn")
  const nearDupes = [];
  const seenPair = new Set();
  const allTokens = [...registry.entries()];

  for (const [a, ea] of names) {
    for (const [b, eb] of allTokens) {
      if (a === b) continue;
      const minLen = Math.min(a.length, b.length);
      if (minLen < 4) continue;
      const maxD = minLen >= 6 ? 2 : 1;
      const d = levenshtein(a.toLowerCase(), b.toLowerCase());
      if (d > 0 && d <= maxD) {
        const key = [a, b].sort().join('|');
        if (seenPair.has(key)) continue;
        seenPair.add(key);
        nearDupes.push({ a, b, aCount: ea.total, bCount: eb.total, type: 'prose' });
      }
    }
  }

  // Cross-check all extracted prose tokens against canon entities
  for (const [token, et] of allTokens) {
    for (const [canonKey, canonItem] of canonEntities) {
      if (token.toLowerCase() === canonKey) continue;
      const minLen = Math.min(token.length, canonItem.name.length);
      if (minLen < 4) continue;
      const maxD = minLen >= 6 ? 2 : 1;
      const d = levenshtein(token.toLowerCase(), canonKey);
      if (d > 0 && d <= maxD) {
        const key = [token, canonItem.name].sort().join('|');
        if (seenPair.has(key)) continue;
        seenPair.add(key);
        nearDupes.push({
          a: token,
          b: `${canonItem.name} [Canon: ${canonItem.tier}]`,
          aCount: et.total,
          bCount: 'Canon',
          type: 'canon'
        });
      }
    }
  }

  // 2. Single-chapter names with meaningful frequency
  const singles = isSingleScene ? [] : names.filter(([, e]) => e.chapters.size === 1 && e.total >= 3);

  const coverage = calculateCoverage(examinedSceneIds);

  const lines = [];
  const scopeTitle = isSingleScene && examinedSceneIds[0] ? `Scene ${examinedSceneIds[0]}` : `${files.length} chapters/scenes`;
  lines.push(`# Continuity Scan — Proper Nouns (${scopeTitle})`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}  |  Scanned: ${files.length} file(s)`);
  lines.push(`Active Canon Tiers: ${canonSources.length > 0 ? canonSources.map(s => s.level).join(' ➔ ') : 'Local only (no multi-tier series/world active)'}`);
  lines.push('');
  lines.push('## ⚠️ Near-duplicate names (possible misspellings — verify against canon.md)');
  if (nearDupes.length === 0) lines.push('- none found');
  nearDupes.forEach(d => {
    lines.push(`- **${d.a}** (×${d.aCount}) vs **${d.b}** (×${d.bCount}) — verify spelling consistency against canon`);
  });
  lines.push('');
  if (!isSingleScene) {
    lines.push('## ℹ️ Names appearing in only one unit (≥3 mentions — renamed character? dropped thread?)');
    if (singles.length === 0) lines.push('- none found');
    singles.forEach(([name, e]) => lines.push(`- **${name}** ×${e.total}, only in ${e.first}`));
    lines.push('');
  }
  lines.push('## Name index (first appearance — cross-check canon.md)');
  lines.push('| Name | Total | Occurrences / Units | First seen |');
  lines.push('|---|---|---|---|');
  names.slice(0, 60).forEach(([name, e]) => lines.push(`| ${name} | ${e.total} | ${e.chapters.size} | ${e.first} |`));
  lines.push('');
  lines.push(formatCoverageMarkdown(coverage));
  lines.push('');
  lines.push('> Heuristic scan: mid-sentence capitalized tokens. Judgment continuity (facts, timeline, knowledge state) is the canon check in Stage 04 — this list only feeds it.');

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportFileName = isSingleScene && examinedSceneIds[0] ? `continuity_${examinedSceneIds[0]}.md` : 'continuity_names.md';
  const reportPath = path.join(REPORT_DIR, reportFileName);
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');

  console.log(`Scanned ${files.length} file(s): ${names.length} recurring names, ${nearDupes.length} near-duplicate pair(s).`);
  nearDupes.forEach(d => console.log(`  \x1b[33m⚠\x1b[0m ${d.a} / ${d.b}`));
  console.log(`${formatCoverageConsole(coverage)}`);
  console.log(`Report: ${reportPath}`);
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith('continuity_scan.js')) {
  runContinuityScan(process.argv.slice(2));
}
