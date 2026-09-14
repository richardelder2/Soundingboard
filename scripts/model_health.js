/**
 * Soundingboard 2.0 - Model Health Console & Evaluation Engine (SB2-P3-04)
 * Zero runtime dependencies; built-in Node only.
 *
 * Core Mandate (PRD §7, §13):
 * "The production console changes job. It stops reporting progress through stages
 * and starts reporting model health: scenes undrafted, scenes with null value shifts,
 * chapters missing break rationale, findings stale against edited prose, scenes drafted
 * against provisional anchors."
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse, strip } from './frontmatter.js';
import { countWords } from './reindex.js';
import { checkStaleness, getSceneHash } from './hash_staleness.js';
import { loadThreadTracker, parsePolarity, DEFAULT_DORMANCY_THRESHOLD } from './threads.js';

/**
 * Assesses complete model health of a Soundingboard workspace.
 * @param {string} [rootDir=process.cwd()]
 * @returns {object}
 */
export function assessModelHealth(rootDir = process.cwd()) {
  const manuscriptDir = path.join(rootDir, 'manuscript');
  const manifestPath = path.join(rootDir, 'manuscript.json');

  let manifest = null;
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (_) {}
  }

  const hasManuscriptDir = fs.existsSync(manuscriptDir);
  const hasManifest = Boolean(manifest);

  // 1. Schema Determination
  let schema = 'uninitialized';
  if (hasManuscriptDir || (manifest && (manifest.schema === '2.0' || manifest.schema === 2.0))) {
    schema = '2.0';
  } else if (hasManifest) {
    schema = '1.x';
  }

  // 2. Chapter and Scene Inventory
  const chapters = [];
  const scenes = [];
  const missingBreakRationales = [];
  const nullValueShifts = [];
  const provisionalAnchors = [];
  const commandmentGaps = [];

  if (hasManuscriptDir) {
    const chEntries = fs.readdirSync(manuscriptDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && /^ch-/i.test(d.name))
      .map(d => d.name)
      .sort((a, b) => {
        const numA = parseInt((a.match(/\d+/) || ['0'])[0], 10);
        const numB = parseInt((b.match(/\d+/) || ['0'])[0], 10);
        return numA - numB;
      });

    for (const chName of chEntries) {
      const chDirPath = path.join(manuscriptDir, chName);
      const chapterMdPath = path.join(chDirPath, 'chapter.md');
      let chapterMeta = {};

      if (fs.existsSync(chapterMdPath)) {
        try {
          chapterMeta = parse(fs.readFileSync(chapterMdPath, 'utf8'), chapterMdPath);
        } catch (_) {}
      }

      const chapterId = chapterMeta.id || chName;
      const rationale = typeof chapterMeta.break_rationale === 'string' ? chapterMeta.break_rationale.trim() : null;

      if (!rationale) {
        missingBreakRationales.push({
          chapterId,
          file: path.relative(rootDir, chapterMdPath)
        });
      }

      chapters.push({
        id: chapterId,
        number: chapterMeta.number !== undefined ? chapterMeta.number : parseInt((chName.match(/\d+/) || ['1'])[0], 10),
        title: chapterMeta.title || chName,
        scenes: Array.isArray(chapterMeta.scenes) ? chapterMeta.scenes : [],
        break_rationale: rationale,
        status: chapterMeta.status || 'planned'
      });

      // Scan scenes in chapter
      const scFiles = fs.readdirSync(chDirPath, { withFileTypes: true })
        .filter(f => f.isFile() && /^sc-.*\.md$/i.test(f.name))
        .map(f => f.name)
        .sort();

      for (const scFile of scFiles) {
        const scFilePath = path.join(chDirPath, scFile);
        const rawContent = fs.readFileSync(scFilePath, 'utf8');
        let scMeta = {};
        try {
          scMeta = parse(rawContent, scFilePath);
        } catch (_) {}

        const sceneId = scMeta.id || scFile.replace(/\.md$/, '');
        const prose = strip(rawContent).trim();
        const words = countWords(prose);
        const isDrafted = words > 0;

        // Check value shifts
        const valIn = scMeta.value_in !== undefined && scMeta.value_in !== null ? String(scMeta.value_in).trim() : '';
        const valOut = scMeta.value_out !== undefined && scMeta.value_out !== null ? String(scMeta.value_out).trim() : '';
        const missingVals = [];
        if (!valIn) missingVals.push('value_in');
        if (!valOut) missingVals.push('value_out');

        if (missingVals.length > 0) {
          nullValueShifts.push({
            sceneId,
            chapterId,
            missing: missingVals,
            file: path.relative(rootDir, scFilePath)
          });
        }

        // Check provisional voice anchor
        if (scMeta.anchor_provisional === true) {
          provisionalAnchors.push({
            sceneId,
            chapterId,
            voiceAnchor: scMeta.voice_anchor || null,
            file: path.relative(rootDir, scFilePath)
          });
        }

        // Check commandments (optional in draft, but flagged if entirely null)
        const cmd = scMeta.commandments;
        const requiredCmds = ['inciting_incident', 'progressive_complication', 'crisis', 'climax', 'resolution'];
        if (!cmd || typeof cmd !== 'object') {
          commandmentGaps.push({ sceneId, chapterId, missing: requiredCmds });
        } else {
          const missingC = requiredCmds.filter(c => !cmd[c] || !String(cmd[c]).trim());
          if (missingC.length > 0) {
            commandmentGaps.push({ sceneId, chapterId, missing: missingC });
          }
        }

        scenes.push({
          id: sceneId,
          chapter: chapterId,
          pov: scMeta.pov || null,
          words,
          isDrafted,
          value_in: valIn || null,
          value_out: valOut || null,
          anchor_provisional: Boolean(scMeta.anchor_provisional),
          voice_anchor: scMeta.voice_anchor || null,
          threads: Array.isArray(scMeta.threads) ? scMeta.threads : []
        });
      }
    }
  } else if (manifest && Array.isArray(manifest.chapters)) {
    // 1.x fallback inspection
    manifest.chapters.forEach(ch => {
      chapters.push({
        id: ch.id,
        number: ch.number || ch.id,
        title: ch.title || '',
        scenes: [],
        break_rationale: null,
        status: ch.status || 'planned'
      });
      missingBreakRationales.push({ chapterId: String(ch.id), file: 'manuscript.json' });
    });
  }

  // 3. Diagnostic Staleness Check (computed_against verification)
  const staleFindings = [];
  let evaluatedFindingsCount = 0;
  let freshFindingsCount = 0;

  const verdictsDir = path.join(rootDir, 'stages', '04_diagnostics_edits', 'output', 'verdicts');
  if (fs.existsSync(verdictsDir)) {
    function scanVerdicts(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanVerdicts(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          try {
            const raw = fs.readFileSync(fullPath, 'utf8');
            const data = JSON.parse(raw);
            
            if (data.computed_against && typeof data.computed_against === 'object') {
              evaluatedFindingsCount++;
              const check = checkStaleness(data, rootDir);
              if (check.isStale) {
                staleFindings.push({
                  file: path.relative(rootDir, fullPath),
                  changedScenes: check.changedScenes,
                  missingScenes: check.missingScenes
                });
              } else {
                freshFindingsCount++;
              }
            }

            if (Array.isArray(data.findings)) {
              for (const f of data.findings) {
                if (f && f.computed_against && typeof f.computed_against === 'object') {
                  evaluatedFindingsCount++;
                  const check = checkStaleness(f, rootDir);
                  if (check.isStale) {
                    staleFindings.push({
                      file: path.relative(rootDir, fullPath),
                      sceneId: f.scene_id || f.sceneId,
                      changedScenes: check.changedScenes,
                      missingScenes: check.missingScenes
                    });
                  } else {
                    freshFindingsCount++;
                  }
                }
              }
            }
          } catch (_) {}
        }
      }
    }
    scanVerdicts(verdictsDir);
  }

  // 4. Thread Diagnostics & Dormancy Check
  let threadTracker = null;
  const orphanedScenes = [];
  const dormantThreads = [];

  try {
    threadTracker = loadThreadTracker(rootDir);
  } catch (_) {}

  if (scenes.length > 0) {
    for (const sc of scenes) {
      if (!sc.threads || sc.threads.length === 0) {
        orphanedScenes.push(sc.id);
      }
    }

    if (threadTracker && threadTracker.threads && threadTracker.threads.length > 0) {
      let cumulativeWords = 0;
      const threadWordPositions = {};
      threadTracker.threads.forEach(t => { threadWordPositions[t.id] = []; });

      scenes.forEach(sc => {
        const scWords = sc.words || 0;
        cumulativeWords += scWords;
        (sc.threads || []).forEach(thId => {
          if (!threadWordPositions[thId]) threadWordPositions[thId] = [];
          threadWordPositions[thId].push(cumulativeWords);
        });
      });

      threadTracker.threads.forEach(t => {
        const positions = threadWordPositions[t.id] || [];
        const threshold = t.dormancyThreshold || threadTracker.dormancyThresholdWords || DEFAULT_DORMANCY_THRESHOLD;
        let maxGap = 0;

        if (positions.length === 0) {
          maxGap = cumulativeWords;
        } else {
          maxGap = Math.max(maxGap, positions[0]);
          for (let i = 1; i < positions.length; i++) {
            maxGap = Math.max(maxGap, positions[i] - positions[i - 1]);
          }
          maxGap = Math.max(maxGap, cumulativeWords - positions[positions.length - 1]);
        }

        if (maxGap > threshold && (t.status || 'open').toLowerCase() === 'open') {
          dormantThreads.push({
            id: t.id,
            name: t.name,
            maxGapWords: maxGap,
            threshold
          });
        }
      });
    }
  }

  // 5. Canon Integrity Check
  const canonPath = path.join(rootDir, 'stages', '02_planning', 'output', 'canon.md');
  const unverifiedCanon = [];
  if (fs.existsSync(canonPath)) {
    const rawCanon = fs.readFileSync(canonPath, 'utf8');
    const lines = rawCanon.split(/\r?\n/);
    lines.forEach((l, idx) => {
      if (/\[unverified\s+ch\d+\]/i.test(l)) {
        unverifiedCanon.push({ line: idx + 1, text: l.trim() });
      }
    });
  }

  // 6. Overall Health Status Calculation
  const totalScenes = scenes.length;
  const draftedScenes = scenes.filter(s => s.isDrafted).length;
  const undraftedScenes = totalScenes - draftedScenes;

  let healthStatus = 'HEALTHY';
  let healthSummary = 'Story model is synchronized and healthy.';

  if (orphanedScenes.length > 0 || schema === '1.x') {
    healthStatus = 'DEGRADED';
    healthSummary = schema === '1.x'
      ? 'Legacy 1.x project detected. Run migration (node scripts/soundingboard.js migrate) to upgrade to 2.0.'
      : `${orphanedScenes.length} scene(s) bound to ZERO threads (Orphan Guard violation).`;
  } else if (
    nullValueShifts.length > 0 ||
    missingBreakRationales.length > 0 ||
    staleFindings.length > 0 ||
    provisionalAnchors.length > 0 ||
    dormantThreads.length > 0 ||
    unverifiedCanon.length > 0
  ) {
    healthStatus = 'ATTENTION_REQUIRED';
    const issues = [];
    if (nullValueShifts.length > 0) issues.push(`${nullValueShifts.length} null value shift(s)`);
    if (missingBreakRationales.length > 0) issues.push(`${missingBreakRationales.length} chapter(s) missing break rationale`);
    if (staleFindings.length > 0) issues.push(`${staleFindings.length} stale diagnostic finding(s)`);
    if (provisionalAnchors.length > 0) issues.push(`${provisionalAnchors.length} provisional voice anchor(s)`);
    if (dormantThreads.length > 0) issues.push(`${dormantThreads.length} dormant thread(s)`);
    if (unverifiedCanon.length > 0) issues.push(`${unverifiedCanon.length} unverified canon fact(s)`);
    healthSummary = `Action recommended: ${issues.join(', ')}.`;
  }

  return {
    schema,
    is20: schema === '2.0',
    manuscriptPresent: hasManuscriptDir || hasManifest,
    chapters: {
      total: chapters.length,
      missingRationale: missingBreakRationales.map(r => r.chapterId),
      missingRationaleDetails: missingBreakRationales,
      list: chapters
    },
    scenes: {
      total: totalScenes,
      drafted: draftedScenes,
      undrafted: undraftedScenes,
      nullValueShifts: nullValueShifts.map(s => s.sceneId),
      nullValueShiftDetails: nullValueShifts,
      provisionalAnchors: provisionalAnchors.map(s => s.sceneId),
      provisionalAnchorDetails: provisionalAnchors,
      commandmentGaps: commandmentGaps.map(s => s.sceneId),
      list: scenes
    },
    findings: {
      totalEvaluated: evaluatedFindingsCount,
      fresh: freshFindingsCount,
      stale: staleFindings
    },
    threads: {
      tracked: threadTracker ? threadTracker.threads.length : 0,
      open: threadTracker ? threadTracker.threads.filter(t => (t.status || 'open').toLowerCase() === 'open').length : 0,
      orphanedScenes,
      dormantThreads
    },
    canon: {
      unverifiedCount: unverifiedCanon.length,
      unverifiedEntries: unverifiedCanon
    },
    summary: {
      status: healthStatus,
      message: healthSummary
    }
  };
}

/**
 * Formats model health into terminal output with ANSI colors.
 * @param {object} health
 * @returns {string}
 */
export function formatModelHealthTerminal(health) {
  const lines = [];
  const statusColor = health.summary.status === 'HEALTHY'
    ? '\x1b[32m'
    : health.summary.status === 'ATTENTION_REQUIRED'
      ? '\x1b[33m'
      : '\x1b[31m';

  lines.push('\x1b[1m========================================\x1b[0m');
  lines.push(`   \x1b[1mSoundingboard 2.0 Model Health Console\x1b[0m`);
  lines.push('\x1b[1m========================================\x1b[0m');
  lines.push(`Overall Status: ${statusColor}\x1b[1m${health.summary.status}\x1b[0m  (${health.summary.message})`);
  lines.push(`Schema: \x1b[36m${health.schema}\x1b[0m ${health.is20 ? '(Atomic Scenes & Derived Index)' : '(Legacy Chapter Schema)'}\n`);

  if (!health.manuscriptPresent) {
    lines.push('  \x1b[90mNo active manuscript found. Initialize or run Stage 01/02.\x1b[0m\n');
    return lines.join('\n');
  }

  // Chapters & Scenes
  const chMissing = health.chapters.missingRationale.length;
  const chIcon = chMissing === 0 ? '\x1b[32m✔\x1b[0m' : '\x1b[33m⚠\x1b[0m';
  lines.push(`  ${chIcon} \x1b[1mChapters:\x1b[0m ${health.chapters.total} total`);
  if (chMissing > 0) {
    lines.push(`     \x1b[33m↳ ${chMissing} chapter(s) missing break rationale:\x1b[0m ${health.chapters.missingRationale.slice(0, 5).join(', ')}${chMissing > 5 ? '...' : ''}`);
  } else {
    lines.push(`     \x1b[90m↳ 100% of chapters carry authored break rationales.\x1b[0m`);
  }

  const scTotal = health.scenes.total;
  const scDrafted = health.scenes.drafted;
  const scUndrafted = health.scenes.undrafted;
  lines.push(`  ✔ \x1b[1mScenes:\x1b[0m ${scTotal} total (\x1b[32m${scDrafted} drafted\x1b[0m, \x1b[90m${scUndrafted} planned/undrafted\x1b[0m)`);

  // Value Shifts
  const nullShifts = health.scenes.nullValueShifts.length;
  const valIcon = nullShifts === 0 ? '\x1b[32m✔\x1b[0m' : '\x1b[33m⚠\x1b[0m';
  if (nullShifts === 0) {
    lines.push(`  ${valIcon} \x1b[1mValue Shift Integrity:\x1b[0m All ${scTotal} scenes have populated value shifts.`);
  } else {
    lines.push(`  ${valIcon} \x1b[1mValue Shift Integrity:\x1b[0m \x1b[33m${nullShifts} scene(s) have null or missing value shifts!\x1b[0m`);
    lines.push(`     \x1b[90m↳ Affects: ${health.scenes.nullValueShifts.slice(0, 5).join(', ')}${nullShifts > 5 ? '...' : ''}\x1b[0m`);
  }

  // Voice Anchors
  const provAnchors = health.scenes.provisionalAnchors.length;
  const ancIcon = provAnchors === 0 ? '\x1b[32m✔\x1b[0m' : '\x1b[33m▲\x1b[0m';
  if (provAnchors === 0) {
    lines.push(`  ${ancIcon} \x1b[1mVoice Anchors:\x1b[0m All drafted scenes have resolved stable same-POV anchors.`);
  } else {
    lines.push(`  ${ancIcon} \x1b[1mVoice Anchors:\x1b[0m \x1b[33m${provAnchors} scene(s) use provisional anchors (flagged for voice re-read)\x1b[0m`);
    lines.push(`     \x1b[90m↳ Scenes: ${health.scenes.provisionalAnchors.slice(0, 5).join(', ')}${provAnchors > 5 ? '...' : ''}\x1b[0m`);
  }

  // Diagnostic Freshness (SHA-256 Staleness)
  const staleCount = health.findings.stale.length;
  const staleIcon = staleCount === 0 ? '\x1b[32m✔\x1b[0m' : '\x1b[33m⚠\x1b[0m';
  if (health.findings.totalEvaluated === 0) {
    lines.push(`  \x1b[90m○\x1b[0m \x1b[1mDiagnostic Staleness:\x1b[0m No stored verdicts evaluated.`);
  } else if (staleCount === 0) {
    lines.push(`  ${staleIcon} \x1b[1mDiagnostic Staleness:\x1b[0m All ${health.findings.fresh} finding(s) are fresh against current scene prose.`);
  } else {
    lines.push(`  ${staleIcon} \x1b[1mDiagnostic Staleness:\x1b[0m \x1b[33m${staleCount} finding(s) stale against modified scene prose\x1b[0m`);
    lines.push(`     \x1b[90m↳ Re-audit recommended for modified scenes.\x1b[0m`);
  }

  // Threads & Subplots
  const orphans = health.threads.orphanedScenes.length;
  const dormant = health.threads.dormantThreads.length;
  const threadIcon = (orphans === 0 && dormant === 0) ? '\x1b[32m✔\x1b[0m' : (orphans > 0 ? '\x1b[31m❌\x1b[0m' : '\x1b[33m⚠\x1b[0m');
  lines.push(`  ${threadIcon} \x1b[1mThread Diagnostics:\x1b[0m ${health.threads.tracked} tracked (${health.threads.open} open)`);
  if (orphans > 0) {
    lines.push(`     \x1b[31m❌ Hard Orphan Guard Error: ${orphans} scene(s) bound to ZERO threads!\x1b[0m`);
    lines.push(`        \x1b[90m↳ ${health.threads.orphanedScenes.slice(0, 5).join(', ')}${orphans > 5 ? '...' : ''}\x1b[0m`);
  }
  if (dormant > 0) {
    lines.push(`     \x1b[33m▲ Dormancy Warning: ${dormant} subplot(s) silent beyond threshold\x1b[0m`);
    health.threads.dormantThreads.forEach(d => {
      lines.push(`        • ${d.id} ("${d.name}"): silent for ${d.maxGapWords.toLocaleString()}w (threshold: ${d.threshold.toLocaleString()}w)`);
    });
  }

  // Canon Integrity
  const unverified = health.canon.unverifiedCount;
  const canonIcon = unverified === 0 ? '\x1b[32m✔\x1b[0m' : '\x1b[33m▲\x1b[0m';
  if (unverified === 0) {
    lines.push(`  ${canonIcon} \x1b[1mCanon Integrity:\x1b[0m All established canon facts verified.`);
  } else {
    lines.push(`  ${canonIcon} \x1b[1mCanon Integrity:\x1b[0m \x1b[33m${unverified} unverified canon fact(s) awaiting gate clearance\x1b[0m`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Formats model health into markdown.
 * @param {object} health
 * @returns {string}
 */
export function formatModelHealthMarkdown(health) {
  const lines = [];
  lines.push('## Soundingboard 2.0 Model Health Summary\n');
  lines.push(`**Overall Status:** \`${health.summary.status}\` — ${health.summary.message}\n`);
  lines.push('| Metric | Status | Details |');
  lines.push('|---|---|---|');
  lines.push(`| **Schema** | \`${health.schema}\` | ${health.is20 ? 'Atomic Scenes & Derived Index' : 'Legacy Chapter Model'} |`);
  lines.push(`| **Chapters** | ${health.chapters.missingRationale.length === 0 ? '✔ OK' : '⚠ Missing Rationales'} | ${health.chapters.total} chapters (${health.chapters.missingRationale.length} missing rationale) |`);
  lines.push(`| **Scenes** | ✔ OK | ${health.scenes.total} total (${health.scenes.drafted} drafted, ${health.scenes.undrafted} undrafted) |`);
  lines.push(`| **Value Shifts** | ${health.scenes.nullValueShifts.length === 0 ? '✔ OK' : '⚠ Incomplete'} | ${health.scenes.nullValueShifts.length} scene(s) with null value shifts |`);
  lines.push(`| **Voice Anchors** | ${health.scenes.provisionalAnchors.length === 0 ? '✔ OK' : '▲ Provisional'} | ${health.scenes.provisionalAnchors.length} provisional anchor(s) |`);
  lines.push(`| **Staleness** | ${health.findings.stale.length === 0 ? '✔ Fresh' : '⚠ Stale'} | ${health.findings.stale.length} stale finding(s) |`);
  lines.push(`| **Thread Sentry** | ${health.threads.orphanedScenes.length === 0 ? '✔ OK' : '❌ Orphan Error'} | ${health.threads.tracked} threads, ${health.threads.orphanedScenes.length} orphan(s), ${health.threads.dormantThreads.length} dormant |`);
  lines.push(`| **Canon Integrity** | ${health.canon.unverifiedCount === 0 ? '✔ Verified' : '▲ Unverified'} | ${health.canon.unverifiedCount} unverified fact(s) |`);
  lines.push('');
  return lines.join('\n');
}
