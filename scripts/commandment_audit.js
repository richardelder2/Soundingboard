/**
 * Soundingboard 2.0 - Commandment Advisory Audit Engine (SB2-P2-03)
 * Zero runtime dependencies; built-in Node only.
 *
 * Evaluates Shawn Coyne's 5 Commandments of the Micro-Scene:
 * 1. Inciting Incident (Upsets status quo; causal or coincidental stimulus)
 * 2. Progressive Complication (Escalating resistance and obstacles)
 * 3. Crisis Question (Strict binary dilemma: Best Bad Choice or Irreconcilable Goods)
 * 4. Climax (Externalized, irrevocable physical action or decision under pressure)
 * 5. Resolution (Aftermath, new equilibrium, life-value shift realized)
 *
 * Core Mandate:
 * - Findings are PURELY ADVISORY in the Revision Playbook.
 * - Divergence is a creative choice (discovery writing vs. structural drift),
 *   presenting author options rather than failing machine gates.
 * - Honest coverage reporting on every pass.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse, strip } from './frontmatter.js';
import { findScenePath } from './hash_staleness.js';
import { calculateCoverage, formatCoverageMarkdown, formatCoverageConsole } from './coverage_reporter.js';

const REPORT_DIR = path.join('stages', '04_diagnostics_edits', 'output', 'reports');
const VERDICTS_DIR = path.join('stages', '04_diagnostics_edits', 'output', 'verdicts');

export const COMMANDMENT_KEYS = [
  'inciting_incident',
  'progressive_complication',
  'crisis',
  'climax',
  'resolution'
];

export const COMMANDMENT_LABELS = {
  inciting_incident: '1. Inciting Incident',
  progressive_complication: '2. Progressive Complication',
  crisis: '3. Crisis (Binary Dilemma)',
  climax: '4. Climax (Irrevocable Action)',
  resolution: '5. Resolution & Shift'
};

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'his', 'her', 'their', 'its', 'was', 'were', 'is', 'are',
  'been', 'has', 'have', 'had', 'it', 'that', 'this', 'he', 'she', 'they', 'them',
  'into', 'out', 'up', 'down', 'then', 'as', 'over', 'after', 'before', 'be'
]);

/**
 * Splits text into sentences.
 * @param {string} text
 * @returns {string[]}
 */
export function splitSentences(text) {
  const clean = text.replace(/\r\n/g, '\n');
  return clean
    .split(/(?<=[.!?…])\s+(?=["“‘'A-Z])|\n{2,}/)
    .map(s => s.trim())
    .filter(s => s.split(/\s+/).length >= 1 && /\w/.test(s));
}

/**
 * Tokenizes text into lowercase non-stopword stems/words for keyword matching.
 * @param {string} text
 * @returns {string[]}
 */
function extractKeywords(text) {
  if (!text) return [];
  return (text.toLowerCase().match(/[\w'’-]+/g) || [])
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * Detects structural signals for Shawn Coyne's 5 Commandments.
 */
const CUES = {
  inciting_incident: /sudden(?:ly)?|knock(?:ed)?|burst|message|alarm|scream|froz(?:e|en)|arriv(?:ed|al)|enter(?:ed)?|news|signal|warn(?:ing|ed)|spotted|notic(?:ed|ing)|saw|caught sight|stepped|appear(?:ed)?|interrupt(?:ed)?|explod(?:ed)?|struck|broke|fell|discover(?:ed)?|whisper(?:ed)?/i,
  progressive_complication: /refus(?:ed|ing)|block(?:ed|ing)|jam(?:med)?|fail(?:ed|ing)|worse|push(?:ed)?|demand(?:ed)?|threaten(?:ed)?|shout(?:ed)?|struggl(?:ed|ing)|locked|trapp(?:ed)?|closed in|cut off|lost|instead of|nowhere|counter(?:ed)?|struck back|strain(?:ed)?|hesitat(?:ed)?|couldn't|impossible|tumbler|will not budge|without|fight/i,
  crisis: /if\s+(?:he|she|they|we|i)\b.*?\b(?:then|but|or)|either\b.*?\bor\b|choos(?:e|ing)|choice|decision|cost|sacrifice|forfeit|risk|trade|no\s+(?:good\s+)?option|whether\s+to|could\s+not\s+(?:do\s+)?both|between|at\s+the\s+expense|dilemma|impossible\s+choice|damned|lose|give\s+up|surrender|expose|hide|\?/i,
  climax: /fir(?:ed|ing)|leap(?:ed|t)|grab(?:bed)?|tor(?:e|n)|struck|pull(?:ed)?\s+the\s+trigger|stepp(?:ed)?\s+between|drove|threw|bolt(?:ed)?|slam(?:med)?|sever(?:ed)?|shatter(?:ed)?|stepp(?:ed)?\s+into|sign(?:ed)?|spoke\s+the\s+words|cut(?:s)?|gave\s+the\s+order|press(?:ed)?|lung(?:ed)?|turned\s+and\s+ran|swung|plung(?:ed)?/i,
  resolution: /settl(?:ed)?|silence|dust|stood|breath(?:e|ed)?|cold|empty|dawn|over|alone|lying|walked\s+away|remain(?:ed)?|now\s+(?:he|she|they|we)\s+knew|everything\s+had\s+changed|no\s+longer|relief|ruin|seal|reveals|left\s+(?:him|her|them)|quiet/i
};

/**
 * Evaluates commandments for a single scene draft.
 * @param {string} sceneProse
 * @param {Record<string, string|null>|null} plannedCommandments
 * @returns {{
 *   commandments: Record<string, {
 *     label: string,
 *     planned: string|null,
 *     proseDetected: string|null,
 *     status: 'ALIGNED' | 'DIVERGED' | 'UNFULFILLED' | 'DISCOVERY_BEAT' | 'UNPLANNED_GAP',
 *     advisoryNote: string,
 *     playbookOptions: Array<{ label: string, action: string }>
 *   }>,
 *   summary: {
 *     aligned: number,
 *     diverged: number,
 *     unfulfilled: number,
 *     discovery: number,
 *     gap: number
 *   },
 *   overallStatus: 'ALIGNED' | 'ADVISORY_REVIEW'
 * }}
 */
export function evaluateSceneCommandments(sceneProse, plannedCommandments = {}) {
  const sents = splitSentences(sceneProse || '');
  const totalSents = sents.length;
  const planned = plannedCommandments || {};

  // Define structural zones by sentence index ranges
  const zones = {
    inciting_incident: { start: 0, end: Math.max(1, Math.ceil(totalSents * 0.40)) },
    progressive_complication: { start: Math.floor(totalSents * 0.15), end: Math.max(2, Math.ceil(totalSents * 0.75)) },
    crisis: { start: Math.floor(totalSents * 0.40), end: Math.max(2, Math.ceil(totalSents * 0.85)) },
    climax: { start: Math.floor(totalSents * 0.55), end: Math.max(2, Math.ceil(totalSents * 0.95)) },
    resolution: { start: Math.floor(totalSents * 0.70), end: totalSents }
  };

  const results = {};
  let alignedCount = 0;
  let divergedCount = 0;
  let unfulfilledCount = 0;
  let discoveryCount = 0;
  let gapCount = 0;

  for (const key of COMMANDMENT_KEYS) {
    const label = COMMANDMENT_LABELS[key];
    const plannedVal = planned[key] ? String(planned[key]).trim() : null;
    const isPlannedAuthor = Boolean(plannedVal && plannedVal.length > 0);

    const zoneDef = zones[key];
    const candidateSents = sents.slice(zoneDef.start, zoneDef.end);
    const cueRegex = CUES[key];

    // Find best candidate sentence in zone matching cue
    let bestSent = null;
    let maxKeywordScore = 0;
    const plannedKeywords = isPlannedAuthor ? extractKeywords(plannedVal) : [];

    for (const sent of candidateSents) {
      const hasCue = cueRegex ? cueRegex.test(sent) : false;
      const sentLower = sent.toLowerCase();

      // Check keyword overlap with planned beat
      let keywordHits = 0;
      if (plannedKeywords.length > 0) {
        for (const kw of plannedKeywords) {
          if (sentLower.includes(kw)) keywordHits++;
        }
      }

      const score = (hasCue ? 2 : 0) + keywordHits * 3;
      if (score > maxKeywordScore) {
        maxKeywordScore = score;
        bestSent = sent;
      }
    }

    // If no cue match found, take the most salient sentence in the zone as prose excerpt
    if (!bestSent && candidateSents.length > 0) {
      bestSent = candidateSents[Math.floor(candidateSents.length / 2)] || candidateSents[0];
    }

    const proseExcerpt = bestSent ? (bestSent.length > 180 ? bestSent.slice(0, 177) + '...' : bestSent) : null;

    let status = 'ALIGNED';
    let advisoryNote = '';
    const playbookOptions = [];

    if (!isPlannedAuthor) {
      if (bestSent && (cueRegex.test(bestSent) || totalSents > 0)) {
        status = 'DISCOVERY_BEAT';
        discoveryCount++;
        advisoryNote = `Draft prose establishes an unscripted ${label.toLowerCase()} beat on the page.`;
        playbookOptions.push({
          label: 'Option A (Lock In Discovery)',
          action: `Backfill Stage 02 frontmatter scene card with discovered beat: "${proseExcerpt}".`
        });
        playbookOptions.push({
          label: 'Option B (Leave Unset)',
          action: 'Keep commandment unscripted if this scene functions as a partial transitional beat.'
        });
      } else {
        status = 'UNPLANNED_GAP';
        gapCount++;
        advisoryNote = `No planned intent authored, and draft prose lacks clear ${label.toLowerCase()} structural cues.`;
        playbookOptions.push({
          label: 'Option A (Stage Structural Beat)',
          action: `Add a decisive ${label.toLowerCase()} moment to sharpen scene kinetic drive.`
        });
        playbookOptions.push({
          label: 'Option B (Intentional Understatement)',
          action: 'Leave implicit if following an adjacent scene that carried high dramatic load.'
        });
      }
    } else {
      // Planned intent exists
      const plannedKeywordsCount = plannedKeywords.length;

      // Check whole zone text for keywords as well
      const zoneText = candidateSents.join(' ').toLowerCase();
      let zoneMatchedKwCount = 0;
      for (const kw of plannedKeywords) {
        if (zoneText.includes(kw)) zoneMatchedKwCount++;
      }

      if (zoneMatchedKwCount > 0 || maxKeywordScore >= 3) {
        status = 'ALIGNED';
        alignedCount++;
        advisoryNote = `Draft prose successfully delivers the planned ${label.toLowerCase()} beat.`;
      } else if (candidateSents.length > 0 && totalSents >= 3) {
        status = 'DIVERGED';
        divergedCount++;
        advisoryNote = `Draft prose pivoted from planned intent ("${plannedVal}"). Detected movement: "${proseExcerpt}".`;
        playbookOptions.push({
          label: 'Option A (Embrace Discovery)',
          action: `Update scene card frontmatter to reflect discovery writing: "${proseExcerpt}".`
        });
        playbookOptions.push({
          label: 'Option B (Align to Plan)',
          action: `Revise scene section to explicitly execute planned beat: "${plannedVal}".`
        });
        playbookOptions.push({
          label: 'Option C (Hybrid / Synthesize)',
          action: `Retain discovered prose action while weaving in planned stakes: "${plannedVal}".`
        });
      } else {
        status = 'UNFULFILLED';
        unfulfilledCount++;
        advisoryNote = `Planned ${label.toLowerCase()} beat ("${plannedVal}") has weak or missing realization in the draft text.`;
        playbookOptions.push({
          label: 'Option A (Fulfill Plan)',
          action: `Draft explicit ${label.toLowerCase()} moment into scene text.`
        });
        playbookOptions.push({
          label: 'Option B (Defer / Reassign)',
          action: 'Move this commandment beat to an adjacent scene if pacing requires.'
        });
      }
    }

    results[key] = {
      label,
      planned: plannedVal,
      proseDetected: proseExcerpt,
      status,
      advisoryNote,
      playbookOptions
    };
  }

  const overallStatus = (divergedCount > 0 || unfulfilledCount > 0 || gapCount > 0)
    ? 'ADVISORY_REVIEW'
    : 'ALIGNED';

  return {
    commandments: results,
    summary: {
      aligned: alignedCount,
      diverged: divergedCount,
      unfulfilled: unfulfilledCount,
      discovery: discoveryCount,
      gap: gapCount
    },
    overallStatus
  };
}

/**
 * Runs commandment audit on a target scene, chapter, or whole manuscript.
 * @param {string} [target] - e.g. 'sc-0001', 'ch-01', or file path
 * @param {string} [rootDir=process.cwd()]
 * @returns {Array<any>}
 */
export function runCommandmentAudit(target = null, rootDir = process.cwd()) {
  const manuscriptDir = path.join(rootDir, 'manuscript');
  if (!fs.existsSync(manuscriptDir)) {
    console.error('manuscript/ directory not found. Please migrate or initialize scenes first.');
    process.exitCode = 1;
    return [];
  }

  // Find target scenes
  const scenesToAudit = [];

  if (target && /^sc-\d+/i.test(path.basename(target, '.md'))) {
    const scId = path.basename(target, '.md');
    const scPath = findScenePath(scId, rootDir);
    if (scPath && fs.existsSync(scPath)) {
      scenesToAudit.push({ id: scId, path: scPath });
    } else {
      console.error(`Scene ${scId} not found in manuscript/.`);
      process.exitCode = 1;
      return [];
    }
  } else if (target && /^ch-\d+/i.test(target)) {
    const chDir = path.join(manuscriptDir, target);
    if (fs.existsSync(chDir)) {
      const files = fs.readdirSync(chDir).filter(f => /^sc-\d+\.md$/i.test(f)).sort();
      for (const f of files) {
        scenesToAudit.push({ id: path.basename(f, '.md'), path: path.join(chDir, f) });
      }
    } else {
      console.error(`Chapter directory ${target} not found in manuscript/.`);
      process.exitCode = 1;
      return [];
    }
  } else if (target && fs.existsSync(target) && fs.statSync(target).isFile()) {
    const base = path.basename(target, '.md');
    scenesToAudit.push({ id: base, path: target });
  } else {
    // Scan all chapters and scenes
    const chDirs = fs.readdirSync(manuscriptDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && /^ch-/i.test(d.name))
      .map(d => d.name)
      .sort();

    for (const ch of chDirs) {
      const chPath = path.join(manuscriptDir, ch);
      const files = fs.readdirSync(chPath).filter(f => /^sc-\d+\.md$/i.test(f)).sort();
      for (const f of files) {
        scenesToAudit.push({ id: path.basename(f, '.md'), path: path.join(chPath, f) });
      }
    }
  }

  if (scenesToAudit.length === 0) {
    console.log('No scene drafts found to evaluate commandments.\n');
    return [];
  }

  const reportsDir = path.join(rootDir, 'stages', '04_diagnostics_edits', 'output', 'reports');
  const verdictsDir = path.join(rootDir, 'stages', '04_diagnostics_edits', 'output', 'verdicts');
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.mkdirSync(verdictsDir, { recursive: true });

  const auditResults = [];

  for (const item of scenesToAudit) {
    const raw = fs.readFileSync(item.path, 'utf8');
    const meta = parse(raw, item.path);
    const body = strip(raw).trim();

    const evaluation = evaluateSceneCommandments(body, meta.commandments || null);

    // Format Markdown Report
    const lines = [];
    lines.push(`# Commandment Advisory Audit — [${item.id}]`);
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}  |  Engine: Shawn Coyne Five Commandments (Advisory)`);
    lines.push(`**File:** \`${item.path}\`  |  **POV:** ${meta.pov || 'Unset'}  |  **Status:** ${evaluation.overallStatus}`);
    lines.push('');
    lines.push('> [!NOTE]');
    lines.push('> **Advisory Audit Rule:** Commandment findings are creative choices for the author.');
    lines.push('> Divergence between Stage 02 planning and draft prose represents discovery writing or structural drift.');
    lines.push('> These findings **never fail machine gates** and serve to populate the Human-in-the-Loop Revision Playbook.');
    lines.push('');

    lines.push('## 1. Planned Intent vs. Prose Delivery (Side-by-Side)');
    lines.push('');
    lines.push('| Commandment | Stage 02 Planned Intent | Draft Prose Realization | Status |');
    lines.push('|---|---|---|---|');

    for (const key of COMMANDMENT_KEYS) {
      const c = evaluation.commandments[key];
      const planStr = c.planned ? `"${c.planned}"` : '*(unauthored / null)*';
      const proseStr = c.proseDetected ? `"${c.proseDetected.replace(/\|/g, '\\|')}"` : '*(no cue detected)*';
      const badge = c.status === 'ALIGNED' ? '✅ ALIGNED' :
                    c.status === 'DISCOVERY_BEAT' ? '💡 DISCOVERY' :
                    c.status === 'DIVERGED' ? '🔀 DIVERGED' :
                    c.status === 'UNFULFILLED' ? '⚠️ UNFULFILLED' : '❓ UNPLANNED GAP';
      lines.push(`| **${c.label}** | ${planStr} | ${proseStr} | ${badge} |`);
    }
    lines.push('');

    // Summary counts
    lines.push('## 2. Structural Analysis Summary');
    lines.push(`- **Aligned with Plan:** ${evaluation.summary.aligned} / 5`);
    lines.push(`- **Discovery Beats (Unscripted on Page):** ${evaluation.summary.discovery} / 5`);
    lines.push(`- **Diverged from Plan (Creative Shifts):** ${evaluation.summary.diverged} / 5`);
    lines.push(`- **Unfulfilled (Planned but Absent):** ${evaluation.summary.unfulfilled} / 5`);
    lines.push(`- **Unplanned Gaps (Null in Plan & Prose):** ${evaluation.summary.gap} / 5`);
    lines.push('');

    // Revision Playbook Interventions
    lines.push('## 3. Human-in-the-Loop (HITL) Revision Playbook Options');
    let hasInterventions = false;
    for (const key of COMMANDMENT_KEYS) {
      const c = evaluation.commandments[key];
      if (c.playbookOptions && c.playbookOptions.length > 0) {
        hasInterventions = true;
        lines.push(`### ${c.label} — ${c.status}`);
        lines.push(`*Advisory Note:* ${c.advisoryNote}`);
        c.playbookOptions.forEach(opt => {
          lines.push(`- **${opt.label}:** ${opt.action}`);
        });
        lines.push('');
      }
    }

    if (!hasInterventions) {
      lines.push('✔ **Scene Structurally Sound:** All 5 Coyne commandments are fulfilled and aligned with authored intent.');
      lines.push('');
    }

    // Honest Coverage Section
    const coverage = calculateCoverage([item.id], { rootDir });
    lines.push(formatCoverageMarkdown(coverage));

    const reportPath = path.join(reportsDir, `commandment_audit_${item.id}.md`);
    fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');

    // Save machine-checkable verdict artifact (ADVISORY: PASS)
    const chName = meta.chapter || 'ch-01';
    const chNum = parseInt(String(chName).replace(/\D/g, '') || '1', 10);
    const chVerdictsDir = path.join(verdictsDir, `ch${String(chNum).padStart(2, '0')}`);
    fs.mkdirSync(chVerdictsDir, { recursive: true });

    const verdictPayload = {
      check: 'commandment_audit',
      scene_id: item.id,
      chapter: chNum,
      verdict: 'PASS', // Advisory diagnostic NEVER fails machine gate
      overallStatus: evaluation.overallStatus,
      summary: evaluation.summary,
      evidence: `Commandment audit complete for ${item.id}: ${evaluation.summary.aligned} aligned, ${evaluation.summary.diverged} diverged, ${evaluation.summary.discovery} discovery beats.`,
      details: {
        commandments: evaluation.commandments,
        coverage
      },
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(path.join(chVerdictsDir, `commandments_${item.id}.json`), JSON.stringify(verdictPayload, null, 2), 'utf8');

    const badge = evaluation.overallStatus === 'ALIGNED' ? '\x1b[32mPASS (ALIGNED)\x1b[0m' : '\x1b[36mADVISORY (REVIEW)\x1b[0m';
    console.log(`${badge}  ${item.id} (${evaluation.summary.aligned} aligned, ${evaluation.summary.diverged} diverged, ${evaluation.summary.discovery} discovery) → ${reportPath}`);
    if (evaluation.summary.diverged > 0) {
      console.log(`   \x1b[33m•\x1b[0m ${evaluation.summary.diverged} commandment(s) diverged from Stage 02 intent (options in Revision Playbook)`);
    }
    if (evaluation.summary.gap > 0) {
      console.log(`   \x1b[90m• ${evaluation.summary.gap} commandment(s) unauthored in scene card\x1b[0m`);
    }

    auditResults.push({
      id: item.id,
      path: item.path,
      evaluation,
      reportPath,
      coverage
    });
  }

  return auditResults;
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith('commandment_audit.js')) {
  runCommandmentAudit(process.argv[2]);
}
