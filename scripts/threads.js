/**
 * Soundingboard 2.0 - Thread Diagnostics Suite (SB2-P2-05)
 * Zero runtime dependencies; built-in Node only.
 *
 * Core Mandates (PRD §16.3, §16.4, §16.5):
 * 1. Does the line turn? (Polarity Turn Detection):
 *    Warns if a thread's value polarity never shifts across scenes.
 * 2. Dormancy Sentry (Word-Count-Based):
 *    Flags subplots silent for > N words (default: 5,000w or per-thread threshold).
 * 3. Orphan Guard:
 *    Hard validation error on any scene bound to zero threads.
 * 4. Precondition & Coverage Principle:
 *    Surfaces scenes with null value shifts to prevent false confidence.
 * 5. ASCII Thread Lane View:
 *    Terminal ASCII visualization of thread trajectories and braid points.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse, strip } from './frontmatter.js';
import { calculateCoverage, formatCoverageMarkdown, formatCoverageConsole } from './coverage_reporter.js';

const REPORT_DIR = path.join('stages', '04_diagnostics_edits', 'output', 'reports');
const VERDICTS_DIR = path.join('stages', '04_diagnostics_edits', 'output', 'verdicts');

export const DEFAULT_DORMANCY_THRESHOLD = 5000;

/**
 * Parses value polarity from a string.
 * Returns: 1 (positive), -1 (negative), 0 (neutral/complex), or null (unspecified).
 * @param {string|null} val
 * @returns {number|null}
 */
export function parsePolarity(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (/\+\+|\+/.test(s) && !/-/.test(s)) return 1;
  if (/--|-/.test(s) && !/\+/.test(s)) return -1;
  if (/\+\/-|-\/\+/.test(s)) return 0;

  const POS_KEYWORDS = /\b(hope|trust|love|truth|safety|revelat|discover|triumph|freedom|honor|connect|courage|strength|peace|intimacy|loyalty|alive|clarity|innocence|justice)\b/i;
  const NEG_KEYWORDS = /\b(despair|suspicion|betray|decept|peril|ignorance|defeat|isolation|fear|weakness|shame|death|danger|loss|estrange|ruin|guilt|corruption)\b/i;

  const hasPos = POS_KEYWORDS.test(s);
  const hasNeg = NEG_KEYWORDS.test(s);
  if (hasPos && !hasNeg) return 1;
  if (hasNeg && !hasPos) return -1;
  return 0;
}

/**
 * Loads the thread tracker definition from Stage 02 planning.
 * @param {string} rootDir
 * @returns {{
 *   dormancyThresholdWords: number,
 *   threads: Array<{
 *     id: string,
 *     name: string,
 *     type: string,
 *     spine: boolean,
 *     valueSpectrum: string,
 *     dormancyThreshold: number|null,
 *     status: string
 *   }>,
 *   sourceFile: string|null
 * }}
 */
export function loadThreadTracker(rootDir = process.cwd()) {
  const candidates = [
    path.join(rootDir, 'stages', '02_planning', 'output', 'trackers', 'threads.md'),
    path.join(rootDir, 'stages', '02_planning', 'output', 'threads.md'),
    path.join(rootDir, '_config', 'templates', 'threads.template.md')
  ];

  let sourceFile = null;
  let raw = '';
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      sourceFile = c;
      raw = fs.readFileSync(c, 'utf8');
      break;
    }
  }

  let globalThreshold = DEFAULT_DORMANCY_THRESHOLD;
  const threads = [];

  if (sourceFile) {
    let meta = {};
    try {
      meta = parse(raw, sourceFile);
      if (meta.dormancy_threshold_words) {
        globalThreshold = parseInt(String(meta.dormancy_threshold_words), 10) || DEFAULT_DORMANCY_THRESHOLD;
      }
    } catch (_) {}

    if (!meta.dormancy_threshold_words) {
      const dtMatch = raw.match(/dormancy_threshold_words:\s*(\d+)/);
      if (dtMatch) {
        globalThreshold = parseInt(dtMatch[1], 10) || DEFAULT_DORMANCY_THRESHOLD;
      }
    }

    // Check frontmatter threads array
    if (Array.isArray(meta.threads)) {
      meta.threads.forEach(t => {
        if (typeof t === 'object' && t.id) {
          threads.push({
            id: String(t.id).trim(),
            name: t.name || t.description || 'Main Story',
            type: t.spine ? 'main' : (t.type || 'subplot'),
            spine: Boolean(t.spine || /spine|main/i.test(t.type || '')),
            valueSpectrum: t.value_spectrum || t.valueSpectrum || 'Unspecified',
            dormancyThreshold: t.dormancy_threshold_words ? parseInt(String(t.dormancy_threshold_words), 10) : null,
            status: t.status || 'open'
          });
        }
      });
    }

    // If no threads found in frontmatter, check for YAML block sequence
    if (threads.length === 0) {
      const blockMatch = raw.match(/threads:\s*\r?\n((?:[ \t]+-[ \t]+[^\r\n]*\r?\n?(?:[ \t]+[^-][^\r\n]*\r?\n?)*)+)/);
      if (blockMatch) {
        const itemChunks = blockMatch[1].split(/(?:^|\r?\n)[ \t]+-[ \t]+/);
        for (const chunk of itemChunks) {
          if (!chunk.trim()) continue;
          const idMatch = chunk.match(/(?:^|\n)[ \t]*id:[ \t]*([^\r\n]+)/);
          if (idMatch) {
            const id = idMatch[1].trim().replace(/^['"]|['"]$/g, '');
            const nameMatch = chunk.match(/(?:^|\n)[ \t]*name:[ \t]*([^\r\n]+)/);
            const spineMatch = chunk.match(/(?:^|\n)[ \t]*spine:[ \t]*([^\r\n]+)/);
            const valMatch = chunk.match(/(?:^|\n)[ \t]*value_spectrum:[ \t]*([^\r\n]+)/);
            const statMatch = chunk.match(/(?:^|\n)[ \t]*status:[ \t]*([^\r\n]+)/);
            const threshMatch = chunk.match(/(?:^|\n)[ \t]*dormancy_threshold_words:[ \t]*([^\r\n]+)/);

            const isSpine = spineMatch ? /true|yes/i.test(spineMatch[1]) : false;
            threads.push({
              id,
              name: nameMatch ? nameMatch[1].trim().replace(/^['"]|['"]$/g, '') : 'Tracked Thread',
              type: isSpine ? 'main' : 'subplot',
              spine: isSpine,
              valueSpectrum: valMatch ? valMatch[1].trim().replace(/^['"]|['"]$/g, '') : 'Unspecified',
              dormancyThreshold: threshMatch ? parseInt(threshMatch[1].trim(), 10) : null,
              status: statMatch ? statMatch[1].trim().replace(/^['"]|['"]$/g, '') : 'open'
            });
          }
        }
      }
    }

    // If still no threads found, parse markdown table or bullet list
    if (threads.length === 0) {
      const lines = raw.split(/\r?\n/);
      for (const line of lines) {
        if (line.trim().startsWith('|') && !line.includes('---') && !line.toLowerCase().includes('| thread id |')) {
          const cells = line.split('|').map(c => c.trim()).filter(Boolean);
          if (cells.length >= 4) {
            const id = cells[0];
            const name = cells[1];
            const type = cells[2] || 'subplot';
            const isSpine = /yes|true|spine|main/i.test(cells[3] || '') || /main/i.test(type);
            const valueSpectrum = cells.length >= 5 ? cells[4] : 'Unspecified';
            const status = cells.length >= 8 ? cells[7] : (cells.length >= 6 ? cells[cells.length - 1] : 'open');
            threads.push({
              id,
              name,
              type,
              spine: isSpine,
              valueSpectrum,
              dormancyThreshold: null,
              status
            });
          }
        } else {
          const bMatch = line.match(/^-\s+\*\*([a-zA-Z0-9_-]+)\*\*:\s*(.*?)(\[(.*?)\])?$/);
          if (bMatch) {
            threads.push({
              id: bMatch[1],
              name: bMatch[2].trim() || 'Tracked Thread',
              type: /spine|main/i.test(bMatch[2]) ? 'main' : 'subplot',
              spine: /spine|main/i.test(bMatch[2]),
              valueSpectrum: 'Unspecified',
              dormancyThreshold: null,
              status: bMatch[4] ? bMatch[4].trim() : 'open'
            });
          }
        }
      }
    }
  }

  // Guarantee at least th-01 fallback if nothing defined
  if (threads.length === 0) {
    threads.push({
      id: 'th-01',
      name: 'Main Story (Spine)',
      type: 'main',
      spine: true,
      valueSpectrum: 'Hope / Despair',
      dormancyThreshold: globalThreshold,
      status: 'open'
    });
  }

  return {
    dormancyThresholdWords: globalThreshold,
    threads,
    sourceFile
  };
}

/**
 * Loads all scenes in narrative order from manuscript/.
 * @param {string} rootDir
 * @returns {Array<{
 *   id: string,
 *   chapter: string,
 *   path: string,
 *   threads: string[],
 *   value_in: string|null,
 *   value_out: string|null,
 *   wordCount: number,
 *   cumStart: number,
 *   cumEnd: number,
 *   status: string
 * }>}
 */
export function loadOrderedScenes(rootDir = process.cwd()) {
  const manuscriptDir = path.join(rootDir, 'manuscript');
  const orderedScenes = [];

  if (!fs.existsSync(manuscriptDir)) {
    return orderedScenes;
  }

  const chDirs = fs.readdirSync(manuscriptDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^ch-/i.test(d.name))
    .map(d => d.name)
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '') || '0', 10);
      const numB = parseInt(b.replace(/\D/g, '') || '0', 10);
      return numA - numB;
    });

  let cumulativeWords = 0;

  for (const chName of chDirs) {
    const chPath = path.join(manuscriptDir, chName);
    const chMdPath = path.join(chPath, 'chapter.md');
    let sceneOrder = [];

    if (fs.existsSync(chMdPath)) {
      try {
        const chMeta = parse(fs.readFileSync(chMdPath, 'utf8'), chMdPath);
        if (Array.isArray(chMeta.scenes) && chMeta.scenes.length > 0) {
          sceneOrder = chMeta.scenes;
        }
      } catch (_) {}
    }

    // Fallback: list all sc-*.md files
    if (sceneOrder.length === 0) {
      sceneOrder = fs.readdirSync(chPath)
        .filter(f => /^sc-\d+\.md$/i.test(f))
        .sort()
        .map(f => path.basename(f, '.md'));
    }

    for (const scId of sceneOrder) {
      const scFile = path.join(chPath, `${scId}.md`);
      if (fs.existsSync(scFile)) {
        const raw = fs.readFileSync(scFile, 'utf8');
        const meta = parse(raw, scFile);
        const body = strip(raw).trim();
        const words = (body.match(/[\w'’-]+/g) || []).length;

        // Parse threads array from frontmatter
        let threads = [];
        if (Array.isArray(meta.threads)) {
          threads = meta.threads.map(t => String(t).trim()).filter(Boolean);
        } else if (typeof meta.threads === 'string' && meta.threads.trim()) {
          threads = meta.threads.split(',').map(t => t.trim()).filter(Boolean);
        }

        const cumStart = cumulativeWords;
        const cumEnd = cumulativeWords + words;
        cumulativeWords = cumEnd;

        orderedScenes.push({
          id: scId,
          chapter: chName,
          path: scFile,
          threads,
          value_in: meta.value_in || null,
          value_out: meta.value_out || null,
          wordCount: words,
          cumStart,
          cumEnd,
          status: meta.status || 'drafted'
        });
      }
    }
  }

  return orderedScenes;
}

/**
 * Evaluates orphan scenes (scenes bound to zero threads).
 * @param {Array<any>} scenes
 * @returns {{
 *   passed: boolean,
 *   orphans: Array<{ id: string, chapter: string, path: string, wordCount: number }>
 * }}
 */
export function evaluateOrphanScenes(scenes) {
  const orphans = [];
  for (const sc of scenes) {
    if (!sc.threads || !Array.isArray(sc.threads) || sc.threads.length === 0) {
      orphans.push({
        id: sc.id,
        chapter: sc.chapter,
        path: sc.path,
        wordCount: sc.wordCount
      });
    }
  }
  return {
    passed: orphans.length === 0,
    orphans
  };
}

/**
 * Evaluates dormancy for a specific thread across the ordered scenes.
 * @param {any} thread
 * @param {Array<any>} scenes
 * @param {number} thresholdWords
 * @returns {{
 *   threadId: string,
 *   totalAppearances: number,
 *   maxDormancyGapWords: number,
 *   worstGapRange: { fromScene: string, toScene: string, words: number } | null,
 *   isDormant: boolean,
 *   gaps: Array<{ fromScene: string, toScene: string, words: number, exceedsThreshold: boolean }>
 * }}
 */
export function evaluateThreadDormancy(thread, scenes, thresholdWords) {
  const appearances = [];
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    if (sc.threads && sc.threads.includes(thread.id)) {
      appearances.push({ index: i, scene: sc });
    }
  }

  const limit = thread.dormancyThreshold || thresholdWords;
  const gaps = [];
  let maxGap = 0;
  let worstGap = null;

  if (appearances.length >= 2) {
    for (let i = 0; i < appearances.length - 1; i++) {
      const current = appearances[i].scene;
      const next = appearances[i + 1].scene;
      const gapWords = Math.max(0, next.cumStart - current.cumEnd);

      const exceeds = gapWords > limit;
      gaps.push({
        fromScene: current.id,
        toScene: next.id,
        words: gapWords,
        exceedsThreshold: exceeds
      });

      if (gapWords > maxGap) {
        maxGap = gapWords;
        worstGap = {
          fromScene: current.id,
          toScene: next.id,
          words: gapWords
        };
      }
    }
  }

  // Check tail dormancy if thread is still marked open
  if (appearances.length > 0 && thread.status !== 'resolved' && scenes.length > 0) {
    const lastApp = appearances[appearances.length - 1].scene;
    const finalScene = scenes[scenes.length - 1];
    const tailGap = Math.max(0, finalScene.cumEnd - lastApp.cumEnd);
    if (tailGap > limit && lastApp.id !== finalScene.id) {
      gaps.push({
        fromScene: lastApp.id,
        toScene: `[End of Manuscript: ${finalScene.id}]`,
        words: tailGap,
        exceedsThreshold: true
      });
      if (tailGap > maxGap) {
        maxGap = tailGap;
        worstGap = {
          fromScene: lastApp.id,
          toScene: finalScene.id,
          words: tailGap
        };
      }
    }
  }

  const isDormant = gaps.some(g => g.exceedsThreshold);

  return {
    threadId: thread.id,
    totalAppearances: appearances.length,
    maxDormancyGapWords: maxGap,
    worstGapRange: worstGap,
    isDormant,
    gaps
  };
}

/**
 * Evaluates polarity turns for a thread.
 * @param {any} thread
 * @param {Array<any>} scenes
 * @returns {{
 *   threadId: string,
 *   totalAppearances: number,
 *   polarities: Array<{ sceneId: string, value_in: string|null, value_out: string|null, turn: number|null }>,
 *   positiveTurns: number,
 *   negativeTurns: number,
 *   neutralTurns: number,
 *   hasTurn: boolean,
 *   isMonopolar: boolean,
 *   note: string
 * }}
 */
export function evaluatePolarityTurns(thread, scenes) {
  const polarities = [];
  let pos = 0;
  let neg = 0;
  let neutral = 0;

  for (const sc of scenes) {
    if (sc.threads && sc.threads.includes(thread.id)) {
      const pIn = parsePolarity(sc.value_in);
      const pOut = parsePolarity(sc.value_out);

      let turn = null;
      if (pOut !== null) {
        turn = pOut;
      } else if (pIn !== null) {
        turn = pIn;
      }

      if (turn === 1) pos++;
      else if (turn === -1) neg++;
      else if (turn === 0) neutral++;

      polarities.push({
        sceneId: sc.id,
        value_in: sc.value_in,
        value_out: sc.value_out,
        turn
      });
    }
  }

  const total = polarities.length;
  // A thread has turned if it contains both positive and negative moments
  const hasTurn = pos > 0 && neg > 0;
  const isMonopolar = total >= 2 && !hasTurn && (pos === 0 || neg === 0);

  let note = 'Healthy dynamic polarity progression.';
  if (total < 2) {
    note = 'Thread has fewer than 2 appearances; polarity progression nascent.';
  } else if (isMonopolar) {
    note = `Thread never shifts polarity across ${total} scenes (all ${pos > 0 ? 'positive' : 'negative'}). Dramatic arcs require value conflict.`;
  }

  return {
    threadId: thread.id,
    totalAppearances: total,
    polarities,
    positiveTurns: pos,
    negativeTurns: neg,
    neutralTurns: neutral,
    hasTurn,
    isMonopolar,
    note
  };
}

/**
 * Generates an ASCII Thread Lane visualization.
 * @param {Array<any>} threads
 * @param {Array<any>} scenes
 * @param {number} cols
 * @returns {string}
 */
export function formatThreadAsciiLanes(threads, scenes, cols = 35) {
  if (scenes.length === 0 || threads.length === 0) {
    return '  (No scenes or threads available to render lanes)\n';
  }

  const totalWords = scenes[scenes.length - 1].cumEnd;
  const bucketSize = Math.max(1, Math.ceil(totalWords / cols));

  const lines = [];
  lines.push('  Legend: [▲] Positive Turn   [▼] Negative Turn   [*] Braid Point (Multiple Threads)   [·] Silence');
  lines.push('');

  for (const th of threads) {
    const laneChars = new Array(cols).fill('·');
    const appearances = scenes.filter(s => s.threads && s.threads.includes(th.id));

    for (const app of appearances) {
      const midWord = Math.floor((app.cumStart + app.cumEnd) / 2);
      const colIdx = Math.min(cols - 1, Math.floor(midWord / bucketSize));

      const isBraid = app.threads.length >= 2;
      const pol = parsePolarity(app.value_out);

      let mark = isBraid ? '*' : (pol === 1 ? '▲' : pol === -1 ? '▼' : 'o');
      laneChars[colIdx] = mark;
    }

    const label = `  ${th.id.padEnd(8)} (${th.name.slice(0, 20).padEnd(20)})`;
    lines.push(`${label} | ${laneChars.join(' ')} |`);
  }

  lines.push('');
  lines.push(`  Words:   0 ${''.padEnd(cols * 2 - 12)}${totalWords.toLocaleString()}w`);
  return lines.join('\n');
}

/**
 * Runs the complete Thread Diagnostics Suite.
 * @param {object} [options]
 * @param {string} [options.rootDir]
 * @param {number} [options.threshold]
 * @param {boolean} [options.strict]
 * @param {boolean} [options.json]
 * @returns {any}
 */
export function runThreadDiagnostics(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const tracker = loadThreadTracker(rootDir);
  const threshold = options.threshold || tracker.dormancyThresholdWords;
  const scenes = loadOrderedScenes(rootDir);

  // 1. Evaluate Orphan Scenes (Hard guard)
  const orphanResult = evaluateOrphanScenes(scenes);

  // 2. Evaluate Thread Dormancy and Polarity Turns
  const threadResults = [];
  for (const th of tracker.threads) {
    const dormancy = evaluateThreadDormancy(th, scenes, threshold);
    const polarity = evaluatePolarityTurns(th, scenes);
    threadResults.push({
      thread: th,
      dormancy,
      polarity
    });
  }

  // 3. Evaluate Coverage (Null Value Shifts)
  const nullValueShifts = scenes.filter(s => !s.value_in || !s.value_out);
  const coverage = calculateCoverage(scenes.map(s => s.id), { rootDir });

  // 4. Overall status
  const hasOrphans = !orphanResult.passed;
  const hasDormant = threadResults.some(t => t.dormancy.isDormant);
  const hasMonopolar = threadResults.some(t => t.polarity.isMonopolar);

  const overallPassed = !hasOrphans && (!options.strict || (!hasDormant && !hasMonopolar));

  const result = {
    passed: overallPassed,
    scenesCount: scenes.length,
    totalWords: scenes.length > 0 ? scenes[scenes.length - 1].cumEnd : 0,
    thresholdWords: threshold,
    orphanGuard: orphanResult,
    threadDiagnostics: threadResults,
    nullValueShiftsCount: nullValueShifts.length,
    coverage,
    timestamp: new Date().toISOString()
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return result;
  }

  // Print Console Report
  console.log('\n========================================');
  console.log('   Narrative Thread & Subplot Ledger (SB2-P2-05)');
  console.log('========================================\n');
  console.log(`Tracked Threads: ${tracker.threads.length} | Open: ${tracker.threads.filter(t => t.status === 'open').length} | Resolved: ${tracker.threads.filter(t => t.status === 'resolved').length}\n`);

  // A. Orphan Guard Section
  if (hasOrphans) {
    console.log(`  \x1b[31m❌ ORPHAN GUARD FAILURE: ${orphanResult.orphans.length} scene(s) bound to ZERO threads!\x1b[0m`);
    orphanResult.orphans.forEach(o => {
      console.log(`     • ${o.id} (${o.chapter}): missing thread linkage in frontmatter`);
    });
    console.log('     \x1b[33m↳ Fix: Assign threads: [th-01] to frontmatter in orphaned scenes.\x1b[0m\n');
  } else {
    console.log(`  \x1b[32m✔ Orphan Guard: All ${scenes.length} scene(s) bound to narrative threads.\x1b[0m`);
  }

  // B. Precondition / Coverage Notice
  if (nullValueShifts.length > 0) {
    console.log(`  \x1b[33m⚠ Coverage Precondition Notice: ${nullValueShifts.length} scene(s) have null value shifts.\x1b[0m`);
    console.log('    Polarity turn analysis requires populated value_in / value_out fields.\n');
  }

  // C. Thread Telemetry Table
  console.log('| Thread ID | Spine | Name | Scenes | Max Gap (Words) | Polarity Turn? | Status |');
  console.log('|---|---|---|---|---|---|---|');
  threadResults.forEach(r => {
    const t = r.thread;
    const d = r.dormancy;
    const p = r.polarity;
    const gapStr = d.maxDormancyGapWords > 0 ? `${d.maxDormancyGapWords.toLocaleString()}w` : '-';
    const turnStr = p.hasTurn ? '✔ Turning' : (p.isMonopolar ? '⚠ Flat / Monopolar' : 'Nascent');
    const badge = d.isDormant ? '\x1b[31mDORMANT\x1b[0m' : (p.isMonopolar ? '\x1b[33mREVIEW\x1b[0m' : '\x1b[32mHEALTHY\x1b[0m');
    console.log(`| **${t.id}** | ${t.spine ? 'Yes' : 'No'} | ${t.name.slice(0, 20)} | ${d.totalAppearances} | ${gapStr} | ${turnStr} | ${badge} |`);
  });
  console.log('');

  // D. Dormancy Sentry Findings
  const dormantThreads = threadResults.filter(r => r.dormancy.isDormant);
  if (dormantThreads.length > 0) {
    console.log('  \x1b[33m⚠️ Dormancy Sentry Alerts (> ' + threshold.toLocaleString() + ' words):\x1b[0m');
    dormantThreads.forEach(r => {
      const g = r.dormancy.worstGapRange;
      if (g) {
        console.log(`    • [${r.thread.id}] "${r.thread.name}": silent for ${g.words.toLocaleString()} words between ${g.fromScene} and ${g.toScene}`);
      }
    });
    console.log('');
  }

  // E. ASCII Thread Lanes
  console.log('## Thread Lane Visualizer (Terminal View)\n');
  console.log(formatThreadAsciiLanes(tracker.threads, scenes));
  console.log('');

  // F. Save Report and Verdict Artifacts
  const reportsDir = path.join(rootDir, 'stages', '04_diagnostics_edits', 'output', 'reports');
  const verdictsDir = path.join(rootDir, 'stages', '04_diagnostics_edits', 'output', 'verdicts');
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.mkdirSync(verdictsDir, { recursive: true });

  const reportPath = path.join(reportsDir, 'threads_diagnostic_report.md');
  const markdownLines = [];
  markdownLines.push('# Narrative Thread Diagnostic Report');
  markdownLines.push('');
  markdownLines.push(`Generated: ${new Date().toISOString()}  |  Threshold: ${threshold.toLocaleString()} words`);
  markdownLines.push(`**Scenes Scanned:** ${scenes.length}  |  **Total Words:** ${result.totalWords.toLocaleString()}  |  **Orphan Scenes:** ${orphanResult.orphans.length}`);
  markdownLines.push('');

  markdownLines.push('## 1. Orphan Guard Verification');
  if (hasOrphans) {
    markdownLines.push(`❌ **FAILED:** ${orphanResult.orphans.length} scene(s) placed in manuscript but bound to NO threads.`);
    orphanResult.orphans.forEach(o => markdownLines.push(`- \`${o.id}\` (${o.chapter})`));
  } else {
    markdownLines.push(`✔ **PASSED:** All ${scenes.length} scenes bound to at least one narrative thread.`);
  }
  markdownLines.push('');

  markdownLines.push('## 2. Thread Telemetry & Polarity Progression');
  markdownLines.push('| Thread ID | Type | Spine | Appearances | Max Gap | Polarity Turn? | Status |');
  markdownLines.push('|---|---|---|---|---|---|---|');
  threadResults.forEach(r => {
    const t = r.thread;
    const d = r.dormancy;
    const p = r.polarity;
    markdownLines.push(`| ${t.id} | ${t.type} | ${t.spine ? 'Yes' : 'No'} | ${d.totalAppearances} | ${d.maxDormancyGapWords.toLocaleString()}w | ${p.hasTurn ? 'Yes (+/-)' : (p.isMonopolar ? 'Flat' : 'Nascent')} | ${d.isDormant ? 'Dormant' : 'Active'} |`);
  });
  markdownLines.push('');

  if (dormantThreads.length > 0) {
    markdownLines.push('### ⚠️ Dormant Subplot Alerts');
    dormantThreads.forEach(r => {
      const g = r.dormancy.worstGapRange;
      if (g) {
        markdownLines.push(`- **${r.thread.id} (${r.thread.name}):** silent for ${g.words.toLocaleString()} words between ${g.fromScene} and ${g.toScene}.`);
      }
    });
    markdownLines.push('');
  }

  markdownLines.push('## 3. Thread Lane Visualization');
  markdownLines.push('```text');
  markdownLines.push(formatThreadAsciiLanes(tracker.threads, scenes));
  markdownLines.push('```');
  markdownLines.push('');

  markdownLines.push(formatCoverageMarkdown(coverage));

  fs.writeFileSync(reportPath, markdownLines.join('\n'), 'utf8');

  // Save verdict artifact
  const verdictPath = path.join(verdictsDir, 'threads.json');
  fs.writeFileSync(verdictPath, JSON.stringify(result, null, 2), 'utf8');

  console.log(`Report saved: ${reportPath}\n`);

  if (options.isCli && (hasOrphans || (options.strict && (hasDormant || hasMonopolar)))) {
    process.exitCode = 1;
  }

  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith('threads.js')) {
  const args = process.argv.slice(2);
  const thresholdArg = args.find(a => a.startsWith('--threshold='));
  const threshold = thresholdArg ? parseInt(thresholdArg.split('=')[1], 10) : undefined;
  const strict = args.includes('--strict');
  const json = args.includes('--json');
  runThreadDiagnostics({ threshold, strict, json, isCli: true });
}
