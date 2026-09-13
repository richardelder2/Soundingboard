/**
 * Soundingboard 2.0 - Honest Coverage Reporter Module (SB2-P2-04 / §6 Stage 04)
 * Zero runtime dependencies; built-in Node only.
 *
 * Mandate:
 * "Each diagnostic reports what it could not examine: scenes skipped, null value shifts,
 * undrafted scenes in a chapter under review. A clean result that silently skipped six scenes
 * manufactures trust it hasn't earned, and a writer can't arbitrate what they weren't told
 * went unexamined." (PRD §6 Stage 04 & Brief SB2-P2-04)
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse, strip } from './frontmatter.js';

/**
 * @typedef {Object} CoverageStats
 * @property {number} scenesExamined
 * @property {number} scenesSkipped
 * @property {number} undraftedScenes
 * @property {number} nullValueShifts
 * @property {string[]} examinedList - scene IDs
 * @property {string[]} skippedList - scene IDs or paths with reasons
 * @property {string[]} undraftedList - scene IDs
 * @property {string[]} nullValueShiftList - scene IDs
 * @property {number} totalWords
 */

/**
 * Builds a coverage report given examined files/scenes against the overall scope (chapter or manuscript).
 * @param {string[]} examinedSceneIds - list of scene IDs actually examined in this pass
 * @param {Object} [options]
 * @param {string} [options.chapterId] - if scoped to a specific chapter (e.g. 'ch-01')
 * @param {string} [options.rootDir=process.cwd()] - project root
 * @param {Array<{target: string, reason: string}>} [options.explicitSkipped] - specifically skipped items
 * @returns {CoverageStats}
 */
export function calculateCoverage(examinedSceneIds, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const chapterScope = options.chapterId || null;
  const explicitSkipped = options.explicitSkipped || [];

  const examinedSet = new Set(examinedSceneIds.map(s => s.toLowerCase().trim()));

  const stats = {
    scenesExamined: examinedSet.size,
    scenesSkipped: 0,
    undraftedScenes: 0,
    nullValueShifts: 0,
    examinedList: Array.from(examinedSet),
    skippedList: explicitSkipped.map(s => `${s.target}: ${s.reason}`),
    undraftedList: [],
    nullValueShiftList: [],
    totalWords: 0
  };

  // Inspect manuscript/ directory
  const manuscriptDir = path.join(rootDir, 'manuscript');
  if (!fs.existsSync(manuscriptDir)) {
    stats.scenesSkipped = stats.skippedList.length;
    return stats;
  }

  const chapterDirs = fs.readdirSync(manuscriptDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^ch-/i.test(d.name))
    .map(d => d.name)
    .filter(name => !chapterScope || name.toLowerCase() === chapterScope.toLowerCase());

  for (const chName of chapterDirs) {
    const chDirPath = path.join(manuscriptDir, chName);
    const sceneFiles = fs.readdirSync(chDirPath)
      .filter(f => /^sc-\d+\.md$/i.test(f));

    for (const scFile of sceneFiles) {
      const scPath = path.join(chDirPath, scFile);
      const scRaw = fs.readFileSync(scPath, 'utf8');
      const scMeta = parse(scRaw, scPath);
      const scId = (scMeta.id || path.basename(scFile, '.md')).toLowerCase().trim();
      const scBody = strip(scRaw).trim();
      const wordCount = (scBody.match(/[\w'’-]+/g) || []).length;

      const isExamined = examinedSet.has(scId);

      if (isExamined) {
        stats.totalWords += wordCount;
      }

      // Check if undrafted: status === 'planned', or empty prose body (< 20 words)
      const isUndrafted = scMeta.status === 'planned' || wordCount < 20;
      if (isUndrafted) {
        stats.undraftedScenes++;
        stats.undraftedList.push(scMeta.id || scId);
      }

      // Check null value shifts
      const hasNullValueIn = scMeta.value_in === null || scMeta.value_in === undefined || String(scMeta.value_in).trim() === '';
      const hasNullValueOut = scMeta.value_out === null || scMeta.value_out === undefined || String(scMeta.value_out).trim() === '';
      if (hasNullValueIn || hasNullValueOut) {
        stats.nullValueShifts++;
        stats.nullValueShiftList.push(scMeta.id || scId);
      }

      // If in scope but not examined
      if (!isExamined) {
        const reason = isUndrafted ? 'undrafted scene' : 'out of scan target scope';
        stats.skippedList.push(`${scMeta.id || scId} (${reason})`);
      }
    }
  }

  stats.scenesSkipped = stats.skippedList.length;
  return stats;
}

/**
 * Formats coverage stats into Markdown lines for diagnostic report artifacts.
 * @param {CoverageStats} stats
 * @returns {string}
 */
export function formatCoverageMarkdown(stats) {
  const lines = [];
  lines.push('## 🛡️ Honest Coverage Report');
  lines.push('Every diagnostic pass explicitly reports unexamined scenes, null value shifts, and undrafted gaps to protect narrative integrity.');
  lines.push('');
  lines.push('| Metric | Count | Status | Notes |');
  lines.push('|---|---|---|---|');

  const examinedBadge = stats.scenesExamined > 0 ? `✅ ${stats.scenesExamined}` : '0';
  lines.push(`| **Scenes Examined** | ${examinedBadge} | Scanned | ${stats.examinedList.join(', ') || 'none'} |`);

  const skippedBadge = stats.scenesSkipped === 0 ? '0' : `⚠️ ${stats.scenesSkipped}`;
  lines.push(`| **Scenes Skipped** | ${skippedBadge} | ${stats.scenesSkipped > 0 ? 'Review Needed' : 'Complete'} | ${stats.scenesSkipped > 0 ? stats.skippedList.slice(0, 10).join('; ') : 'None skipped'} |`);

  const undraftedBadge = stats.undraftedScenes === 0 ? '0' : `⏳ ${stats.undraftedScenes}`;
  lines.push(`| **Undrafted Scenes** | ${undraftedBadge} | ${stats.undraftedScenes > 0 ? 'Pending Drafting' : 'All Drafted'} | ${stats.undraftedList.join(', ') || 'None'} |`);

  const nullBadge = stats.nullValueShifts === 0 ? '0' : `⚠️ ${stats.nullValueShifts}`;
  lines.push(`| **Null Value Shifts** | ${nullBadge} | ${stats.nullValueShifts > 0 ? 'Incomplete Cards' : 'Fully Populated'} | ${stats.nullValueShiftList.join(', ') || 'None'} |`);

  lines.push('');
  if (stats.scenesSkipped > 0 || stats.undraftedScenes > 0 || stats.nullValueShifts > 0) {
    lines.push('> ⚠️ **Coverage Notice:** Passing status only applies to examined scenes. Do not certify gate completion while undrafted scenes or null value shifts remain.');
  } else {
    lines.push('> ✔ **Full Coverage:** 100% of target scenes in scope have been examined with populated value shifts.');
  }

  return lines.join('\n');
}

/**
 * Formats coverage stats into a concise CLI console string.
 * @param {CoverageStats} stats
 * @returns {string}
 */
export function formatCoverageConsole(stats) {
  const parts = [];
  parts.push(`Examined: ${stats.scenesExamined}`);
  if (stats.scenesSkipped > 0) {
    parts.push(`\x1b[33mSkipped: ${stats.scenesSkipped}\x1b[0m`);
  } else {
    parts.push('Skipped: 0');
  }
  if (stats.undraftedScenes > 0) {
    parts.push(`\x1b[36mUndrafted: ${stats.undraftedScenes}\x1b[0m`);
  } else {
    parts.push('Undrafted: 0');
  }
  if (stats.nullValueShifts > 0) {
    parts.push(`\x1b[33mNull Value Shifts: ${stats.nullValueShifts}\x1b[0m`);
  } else {
    parts.push('Null Value Shifts: 0');
  }

  return `[Coverage] ${parts.join(' | ')}`;
}
