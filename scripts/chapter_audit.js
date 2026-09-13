/**
 * Soundingboard 2.0 - Chapter-Scoped Audit Engine (SB2-P2-02)
 * Zero runtime dependencies; built-in Node only.
 *
 * Mandate:
 * - Cadence and rhythm analysis must evaluate multi-scene variance across chapter.
 *   Monotony is a pattern across a stretch; per-scene analysis misses that four scenes share one rhythm.
 * - Break efficacy audit compares chapter ending against authored break_rationale.
 * - Honest coverage reporting on every pass.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse, strip } from './frontmatter.js';
import { findScenePath } from './hash_staleness.js';
import { calculateCoverage, formatCoverageMarkdown, formatCoverageConsole } from './coverage_reporter.js';

const REPORT_DIR = path.join('stages', '04_diagnostics_edits', 'output', 'reports');
const VERDICTS_DIR = path.join('stages', '04_diagnostics_edits', 'output', 'verdicts');

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
 * Calculates mean, standard deviation, and coefficient of variation.
 * @param {number[]} nums
 * @returns {{ mean: number, sd: number, cv: number }}
 */
function stats(nums) {
  if (nums.length === 0) return { mean: 0, sd: 0, cv: 0 };
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
  const sd = Math.sqrt(variance);
  return { mean, sd, cv: mean > 0 ? sd / mean : 0 };
}

/**
 * Evaluates cadence and rhythm variance across scenes in a chapter.
 * @param {Array<{ id: string, words: number, body: string }>} sceneList
 * @returns {{
 *   totalWords: number,
 *   overallStats: { mean: number, sd: number, cv: number },
 *   perSceneStats: Array<{ id: string, words: number, sentenceCount: number, mean: number, sd: number, cv: number }>,
 *   interSceneVariance: number,
 *   isMonotonous: boolean,
 *   flags: string[]
 * }}
 */
export function evaluateChapterCadence(sceneList) {
  const perSceneStats = [];
  const allSentenceLens = [];
  const sceneMeanLens = [];

  for (const sc of sceneList) {
    const sents = splitSentences(sc.body);
    const lens = sents.map(s => (s.match(/[\w'’-]+/g) || []).length).filter(n => n > 0);
    allSentenceLens.push(...lens);

    const st = stats(lens);
    perSceneStats.push({
      id: sc.id,
      words: sc.words,
      sentenceCount: lens.length,
      mean: parseFloat(st.mean.toFixed(1)),
      sd: parseFloat(st.sd.toFixed(1)),
      cv: parseFloat(st.cv.toFixed(2))
    });

    if (lens.length > 0) {
      sceneMeanLens.push(st.mean);
    }
  }

  const overall = stats(allSentenceLens);
  // Inter-scene variance: standard deviation of average sentence lengths between scenes
  const interScene = stats(sceneMeanLens);

  const flags = [];
  // Intra-chapter rhythm stagnation: if all scenes have very similar sentence means and low overall CV
  let isMonotonous = false;
  if (perSceneStats.length >= 2 && interScene.sd < 1.5 && overall.cv < 0.45) {
    isMonotonous = true;
    flags.push('Inter-scene rhythmic stagnation: all scenes in chapter share uniform sentence pacing (low CV and flat mean variance across scene breaks).');
  } else if (overall.cv < 0.40) {
    isMonotonous = true;
    flags.push('Low chapter cadence variance: sentence length distribution across chapter lacks rhythmic contrast.');
  }

  return {
    totalWords: allSentenceLens.reduce((a, b) => a + b, 0),
    overallStats: {
      mean: parseFloat(overall.mean.toFixed(1)),
      sd: parseFloat(overall.sd.toFixed(1)),
      cv: parseFloat(overall.cv.toFixed(2))
    },
    perSceneStats,
    interSceneVariance: parseFloat(interScene.sd.toFixed(2)),
    isMonotonous,
    flags
  };
}

/**
 * Break efficacy keywords & signals.
 */
const BREAK_SIGNALS = {
  question: /\?|wonder(?:ed)?|why|how|if|whether|doubt/i,
  cliffhanger: /sudden(?:ly)?|door (?:flew|swung)|sound|gun|step|gasp|turn(?:ed)?|stop(?:ped)?|freeze|frozen|knife|scream|shatter/i,
  revelation: /knew|realiz(?:ed|ing)|saw|truth|secret|never|now|finally|letter|message|confess/i,
  pause: /silence|quiet|breath|night|darkness|wait(?:ed)?|stare|empty|sky|sleep|alone/i,
  dialogue_hook: /["“][^"”]{2,}\?["”]|["“][^"”]{2,}!["”]|["“][^"”]{2,}—["”]/
};

/**
 * Evaluates whether the trailing text of the last scene delivers the authored break_rationale.
 * @param {string} lastSceneBody
 * @param {string} breakRationale
 * @returns {{
 *   verdict: 'PASS' | 'WARN' | 'FAIL',
 *   evidence: string,
 *   details: { rationaleWords: number, trailingMatch: string|null, detectedSignals: string[] }
 * }}
 */
export function evaluateBreakEfficacy(lastSceneBody, breakRationale) {
  if (!breakRationale || !breakRationale.trim()) {
    return {
      verdict: 'FAIL',
      evidence: 'Missing human-authored break_rationale. Stage 02 requires explicit craft justification for chapter cut.',
      details: { rationaleWords: 0, trailingMatch: null, detectedSignals: [] }
    };
  }

  const rationaleClean = breakRationale.trim();
  const rationaleWords = (rationaleClean.match(/[\w'’-]+/g) || []).length;

  if (rationaleWords < 4) {
    return {
      verdict: 'FAIL',
      evidence: 'Chapter break_rationale is too terse (< 4 words). Must articulate hook, POV pivot, reveal withholding, or dramatic pause.',
      details: { rationaleWords, trailingMatch: null, detectedSignals: [] }
    };
  }

  // Look at trailing ~300 words of final scene
  const words = (lastSceneBody.match(/[\w'’-]+/g) || []);
  const trailingWords = words.slice(-300);
  const trailingText = trailingWords.join(' ');

  const detectedSignals = [];
  for (const [sig, re] of Object.entries(BREAK_SIGNALS)) {
    if (re.test(trailingText)) {
      detectedSignals.push(sig);
    }
  }

  // Cross-reference rationale intent with trailing signals
  const rationaleLower = rationaleClean.toLowerCase();
  let intentMatched = false;
  let rationaleCategory = 'general hook';

  if (/hook|cliff|danger|attack|threat|suspense/i.test(rationaleLower)) {
    rationaleCategory = 'cliffhanger / high suspense';
    intentMatched = detectedSignals.includes('cliffhanger') || detectedSignals.includes('dialogue_hook');
  } else if (/question|mystery|wonder|uncertain|doubt/i.test(rationaleLower)) {
    rationaleCategory = 'dramatic question';
    intentMatched = detectedSignals.includes('question') || trailingText.includes('?');
  } else if (/reveal|secret|truth|realiz|discover/i.test(rationaleLower)) {
    rationaleCategory = 'revelation withholding';
    intentMatched = detectedSignals.includes('revelation');
  } else if (/pause|reflect|breath|quiet|relief|end of day|transition/i.test(rationaleLower)) {
    rationaleCategory = 'dramatic pause / tonal breath';
    intentMatched = detectedSignals.includes('pause');
  } else if (/pov|perspective|shift|pivot/i.test(rationaleLower)) {
    rationaleCategory = 'POV pivot';
    intentMatched = true; // Natural structural cut
  } else {
    intentMatched = detectedSignals.length > 0;
  }

  if (intentMatched) {
    return {
      verdict: 'PASS',
      evidence: `Chapter ending successfully delivers declared rationale (${rationaleCategory}). Signals detected: ${detectedSignals.join(', ') || 'valid closure'}.`,
      details: {
        rationaleWords,
        trailingMatch: rationaleCategory,
        detectedSignals
      }
    };
  }

  return {
    verdict: 'WARN',
    evidence: `Chapter break rationale declares "${rationaleCategory}", but trailing text lacks clear tonal markers. Review ending beats to ensure reader payoff.`,
    details: {
      rationaleWords,
      trailingMatch: null,
      detectedSignals
    }
  };
}

/**
 * Runs a complete chapter audit for a specified chapter ID or all chapters.
 * @param {string} [chapterId] - e.g. 'ch-01'
 * @param {string} [rootDir=process.cwd()]
 * @returns {any}
 */
export function runChapterAudit(chapterId = null, rootDir = process.cwd()) {
  const manuscriptDir = path.join(rootDir, 'manuscript');
  if (!fs.existsSync(manuscriptDir)) {
    console.error('manuscript/ directory not found. Please migrate or initialize scenes first.');
    process.exitCode = 1;
    return null;
  }

  const chapterDirs = fs.readdirSync(manuscriptDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^ch-/i.test(d.name))
    .map(d => d.name)
    .filter(name => !chapterId || name.toLowerCase() === chapterId.toLowerCase());

  if (chapterDirs.length === 0) {
    console.error(`No matching chapter directory found for "${chapterId || 'all'}" in manuscript/.`);
    process.exitCode = 1;
    return null;
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.mkdirSync(VERDICTS_DIR, { recursive: true });

  const chapterReports = [];

  for (const chName of chapterDirs) {
    const chDirPath = path.join(manuscriptDir, chName);
    const chMdPath = path.join(chDirPath, 'chapter.md');

    if (!fs.existsSync(chMdPath)) {
      console.warn(`Warning: ${chName}/chapter.md missing. Skipping.`);
      continue;
    }

    const chMeta = parse(fs.readFileSync(chMdPath, 'utf8'), chMdPath);
    const sceneIds = chMeta.scenes || [];

    const sceneList = [];
    for (const scId of sceneIds) {
      const scPath = path.join(chDirPath, `${scId}.md`);
      if (fs.existsSync(scPath)) {
        const scRaw = fs.readFileSync(scPath, 'utf8');
        const scBody = strip(scRaw).trim();
        const words = (scBody.match(/[\w'’-]+/g) || []).length;
        sceneList.push({ id: scId, words, body: scBody });
      }
    }

    // 1. Evaluate multi-scene cadence
    const cadence = evaluateChapterCadence(sceneList);

    // 2. Evaluate break efficacy
    const lastScene = sceneList[sceneList.length - 1];
    const breakResult = evaluateBreakEfficacy(lastScene ? lastScene.body : '', chMeta.break_rationale);

    // 3. Honest coverage reporting
    const coverage = calculateCoverage(sceneList.map(s => s.id), { chapterId: chName, rootDir });

    // Format report
    const lines = [];
    lines.push(`# Chapter Audit — ${chName.toUpperCase()} (${chMeta.title || 'Untitled'})`);
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}  |  Engine: scripts/chapter_audit.js (Chapter-Scoped)`);
    lines.push(`**Scenes Assembled:** ${sceneIds.join(', ')}  |  **Total Words:** ${cadence.totalWords}`);
    lines.push('');

    lines.push('## 1. Cadence & Rhythm Variance (Inter-Scene)');
    lines.push(`Sentence Length Mean: **${cadence.overallStats.mean}** | Std Dev: **${cadence.overallStats.sd}** | CV: **${cadence.overallStats.cv}**`);
    lines.push(`Inter-Scene Mean Variance (SD): **${cadence.interSceneVariance}**`);
    lines.push('');
    lines.push('| Scene ID | Words | Sentences | Mean Length | Std Dev | CV |');
    lines.push('|---|---|---|---|---|---|');
    cadence.perSceneStats.forEach(s => {
      lines.push(`| ${s.id} | ${s.words} | ${s.sentenceCount} | ${s.mean} | ${s.sd} | ${s.cv} |`);
    });
    lines.push('');
    if (cadence.flags.length > 0) {
      lines.push('### ⚠️ Rhythm Flags');
      cadence.flags.forEach(f => lines.push(`- ${f}`));
      lines.push('');
    } else {
      lines.push('✔ **Rhythm Healthy:** Healthy sentence length contrast observed across scenes.');
      lines.push('');
    }

    lines.push('## 2. Chapter Break Efficacy');
    lines.push(`**Authored Rationale:** ${chMeta.break_rationale ? chMeta.break_rationale.trim() : '*(none)*'}`);
    lines.push(`**Verdict:** ${breakResult.verdict === 'PASS' ? '✅ PASS' : breakResult.verdict === 'WARN' ? '⚠️ REVIEW' : '❌ FAIL'}`);
    lines.push(`**Evidence:** ${breakResult.evidence}`);
    lines.push('');

    lines.push(formatCoverageMarkdown(coverage));

    const targetReportsDir = path.join(rootDir, 'stages', '04_diagnostics_edits', 'output', 'reports');
    const targetVerdictsDir = path.join(rootDir, 'stages', '04_diagnostics_edits', 'output', 'verdicts');
    fs.mkdirSync(targetReportsDir, { recursive: true });
    fs.mkdirSync(targetVerdictsDir, { recursive: true });

    const reportPath = path.join(targetReportsDir, `chapter_audit_${chName}.md`);
    fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');

    // Save machine-checkable break verdict
    const chNum = chMeta.number || parseInt((chName.match(/\d+/) || ['1'])[0], 10);
    const vDir = path.join(targetVerdictsDir, `ch${String(chNum).padStart(2, '0')}`);
    fs.mkdirSync(vDir, { recursive: true });
    const breakVerdict = {
      check: 'break_efficacy',
      chapter: chNum,
      verdict: breakResult.verdict,
      evidence: breakResult.evidence,
      details: breakResult.details,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(path.join(vDir, 'break_efficacy.json'), JSON.stringify(breakVerdict, null, 2), 'utf8');

    const badge = breakResult.verdict === 'FAIL' || cadence.isMonotonous ? '\x1b[31mFAIL\x1b[0m' :
                  breakResult.verdict === 'WARN' ? '\x1b[33mREVIEW\x1b[0m' : '\x1b[32mPASS\x1b[0m';
    console.log(`${badge}  ${chName} (${cadence.totalWords} words, ${sceneList.length} scene(s)) → ${reportPath}`);
    if (cadence.flags.length > 0) {
      cadence.flags.forEach(f => console.log(`   \x1b[33m•\x1b[0m ${f}`));
    }
    console.log(`   Break Delivery: ${breakResult.evidence}`);
    console.log(`   ${formatCoverageConsole(coverage)}\n`);

    chapterReports.push({
      chapter: chName,
      words: cadence.totalWords,
      scenes: sceneList.length,
      cadence,
      breakResult,
      coverage,
      reportPath
    });
  }

  return chapterReports;
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith('chapter_audit.js')) {
  runChapterAudit(process.argv[2]);
}
