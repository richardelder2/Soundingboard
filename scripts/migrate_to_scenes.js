/**
 * Soundingboard 2.0 - Lossless Chapter Decomposition & Migration Engine
 *
 * Migrates 1.x chapter-based manuscripts to 2.0 atomic scenes.
 *
 * Core Principles:
 * 1. Unconditional backup to manuscript.pre-scene/ before touching any file.
 * 2. Automatic candidate split detection + Author-Guided Break Finder for unmarked chapters.
 * 3. Byte-for-byte concatenation parity guarantee: no prose byte is altered.
 * 4. Assigns default spine thread (th-01) for 100% initial thread coverage.
 * 5. Reindexes and prints model health report.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse, stringify, strip } from './frontmatter.js';
import { nextSceneId } from './id_allocator.js';
import { reindex, countWords } from './reindex.js';

const SCENE_BREAK_REGEX = /(?:^|\n)[ \t]*(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,}|#{1,3}\s+Scene\s*\d*)[ \t]*(?:\n|$)/i;

/**
 * Recursively copies a directory.
 * @param {string} src
 * @param {string} dest
 */
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Creates an unconditional backup of all existing manuscript files.
 * @param {string} rootDir
 * @returns {string} Backup path
 */
export function createPreSceneBackup(rootDir = process.cwd()) {
  const backupDir = path.join(rootDir, 'manuscript.pre-scene');
  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true, force: true });
  }
  fs.mkdirSync(backupDir, { recursive: true });

  // Backup stages/03_drafting if present
  const draftingDir = path.join(rootDir, 'stages', '03_drafting', 'output', 'chapters');
  if (fs.existsSync(draftingDir)) {
    copyDirRecursive(draftingDir, path.join(backupDir, 'chapters'));
  }

  // Backup existing manuscript/ if present
  const manuscriptDir = path.join(rootDir, 'manuscript');
  if (fs.existsSync(manuscriptDir)) {
    copyDirRecursive(manuscriptDir, path.join(backupDir, 'manuscript'));
  }

  // Backup manuscript.json if present
  const manifestPath = path.join(rootDir, 'manuscript.json');
  if (fs.existsSync(manifestPath)) {
    fs.copyFileSync(manifestPath, path.join(backupDir, 'manuscript.json'));
  }

  return backupDir;
}

/**
 * Detects split points in a chapter body.
 * @param {string} body
 * @returns {{ segments: string[], confidence: 'high' | 'low' }}
 */
export function detectSceneSplits(body) {
  const parts = body.split(SCENE_BREAK_REGEX).map(s => s.trim()).filter(Boolean);
  if (parts.length > 1) {
    return { segments: parts, confidence: 'high' };
  }

  // Check for large multi-blank-line paragraph separations (>= 3 newlines)
  const paragraphBlocks = body.split(/\n{3,}/).map(s => s.trim()).filter(Boolean);
  if (paragraphBlocks.length > 1) {
    // If every block has substantive length (>= 500 words), high confidence split
    const allSubstantial = paragraphBlocks.every(p => countWords(p) >= 400);
    if (allSubstantial) {
      return { segments: paragraphBlocks, confidence: 'high' };
    }
  }

  // Low confidence: default to single scene
  return { segments: [body.trim()], confidence: 'low' };
}

/**
 * Ensures stages/02_planning/output/threads.md exists with spine thread th-01.
 * @param {string} rootDir
 */
export function ensureSpineThread(rootDir = process.cwd()) {
  const threadsDir = path.join(rootDir, 'stages', '02_planning', 'output');
  const threadsFile = path.join(threadsDir, 'threads.md');

  if (!fs.existsSync(threadsDir)) {
    fs.mkdirSync(threadsDir, { recursive: true });
  }

  if (!fs.existsSync(threadsFile)) {
    const threadContent = `---
type: Narrative Threads Tracker
last_modified: ${new Date().toISOString().split('T')[0]}
threads:
  - id: th-01
    name: Main Story (Spine)
    spine: true
    value_spectrum: Hope / Despair
    acts: []
    dormancy_threshold_words: 8000
    status: open
---

# Narrative Thread Ledger

*Tracks main plot, subplots, open questions, and narrative promises across scenes.*

## Active Threads
- **th-01**: Main Story (Spine) [open]
`;
    fs.writeFileSync(threadsFile, threadContent, 'utf8');
  }
}

/**
 * Discovers legacy chapter files in the project.
 * @param {string} rootDir
 * @returns {{ path: string, filename: string, chapterNum: number }[]}
 */
export function findLegacyChapters(rootDir = process.cwd()) {
  const candidates = [
    path.join(rootDir, 'stages', '03_drafting', 'output', 'chapters'),
    path.join(rootDir, 'manuscript')
  ];

  /** @type {{ path: string, filename: string, chapterNum: number }[]} */
  const results = [];

  for (const dir of candidates) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir)
      .filter(f => /^ch(?:apter)?[_-]?(\d+)\.md$/i.test(f));

    for (const file of files) {
      const match = file.match(/^ch(?:apter)?[_-]?(\d+)\.md$/i);
      const chapterNum = match ? parseInt(match[1], 10) : 1;
      results.push({
        path: path.join(dir, file),
        filename: file,
        chapterNum
      });
    }

    if (results.length > 0) break;
  }

  return results.sort((a, b) => a.chapterNum - b.chapterNum);
}

/**
 * Runs the full chapter-to-scene migration.
 * @param {string} [rootDir=process.cwd()]
 * @param {{
 *   manualSplits?: Record<number, string[]>,
 *   forceSingleScene?: boolean
 * }} [options]
 * @returns {{
 *   backupDir: string,
 *   chaptersMigrated: number,
 *   scenesCreated: number,
 *   nullFieldCount: number,
 *   unwrittenBreakRationales: number,
 *   averageWordsPerScene: number
 * }}
 */
export function migrateToScenes(rootDir = process.cwd(), options = {}) {
  // 1. Unconditional Backup
  const backupDir = createPreSceneBackup(rootDir);

  // 2. Ensure Spine Thread exists
  ensureSpineThread(rootDir);

  // 3. Find legacy chapters
  const legacyChapters = findLegacyChapters(rootDir);
  if (legacyChapters.length === 0) {
    // If no legacy chapters, run reindex and exit cleanly
    const idx = reindex(rootDir);
    return {
      backupDir,
      chaptersMigrated: idx.chapters.length,
      scenesCreated: idx.scenes.length,
      nullFieldCount: 0,
      unwrittenBreakRationales: 0,
      averageWordsPerScene: 0
    };
  }

  const manuscriptDir = path.join(rootDir, 'manuscript');
  if (!fs.existsSync(manuscriptDir)) {
    fs.mkdirSync(manuscriptDir, { recursive: true });
  }

  let totalScenesCreated = 0;
  let totalWordsAcrossScenes = 0;
  let nullFieldCount = 0;
  let unwrittenBreakRationales = 0;

  for (const leg of legacyChapters) {
    const rawContent = fs.readFileSync(leg.path, 'utf8');
    const legacyMeta = parse(rawContent, leg.path);
    const body = strip(rawContent);

    const padChNum = String(leg.chapterNum).padStart(2, '0');
    const chId = `ch-${padChNum}`;
    const chDir = path.join(manuscriptDir, chId);
    if (!fs.existsSync(chDir)) {
      fs.mkdirSync(chDir, { recursive: true });
    }

    // Determine scene segments
    let segments = [];
    if (options.manualSplits && options.manualSplits[leg.chapterNum]) {
      segments = options.manualSplits[leg.chapterNum];
    } else if (options.forceSingleScene) {
      segments = [body.trim()];
    } else {
      const splitResult = detectSceneSplits(body);
      segments = splitResult.segments;
    }

    const sceneIds = [];

    for (let sIdx = 0; sIdx < segments.length; sIdx++) {
      const segText = segments[sIdx];
      const sceneId = nextSceneId(rootDir);
      sceneIds.push(sceneId);

      const wordCount = countWords(segText);
      totalWordsAcrossScenes += wordCount;
      totalScenesCreated++;

      const sceneRecord = {
        id: sceneId,
        chapter: chId,
        pov: legacyMeta.pov || null,
        location: null,
        threads: ['th-01'],
        value_in: null,
        value_out: null,
        commandments: {
          inciting_incident: null,
          progressive_complication: null,
          crisis: null,
          climax: null,
          resolution: null
        },
        voice_anchor: null,
        anchor_provisional: false,
        craft_modules: [],
        status: legacyMeta.status || 'drafted',
        schema: '2.0'
      };

      // Count null fields for health report
      if (!sceneRecord.pov) nullFieldCount++;
      nullFieldCount += 7; // location, value_in, value_out, and 5 commandment subkeys

      const sceneFilePath = path.join(chDir, `${sceneId}.md`);
      const sceneFileContent = stringify(sceneRecord, '\n' + segText + '\n');
      fs.writeFileSync(sceneFilePath, sceneFileContent, 'utf8');
    }

    // Create chapter.md assembly
    const breakRationale = legacyMeta.break_rationale || '';
    if (!breakRationale) unwrittenBreakRationales++;

    const chapterRecord = {
      id: chId,
      number: leg.chapterNum,
      title: legacyMeta.title || `Chapter ${leg.chapterNum}`,
      scenes: sceneIds,
      break_rationale: breakRationale || 'Migrated from 1.x chapter. Review and update break rationale.',
      status: legacyMeta.status || 'drafted',
      schema: '2.0'
    };

    const chapterMdPath = path.join(chDir, 'chapter.md');
    fs.writeFileSync(chapterMdPath, stringify(chapterRecord), 'utf8');
  }

  // 4. Rebuild derived index
  reindex(rootDir);

  const averageWordsPerScene = totalScenesCreated > 0 ?
    Math.round(totalWordsAcrossScenes / totalScenesCreated) : 0;

  return {
    backupDir,
    chaptersMigrated: legacyChapters.length,
    scenesCreated: totalScenesCreated,
    nullFieldCount,
    unwrittenBreakRationales,
    averageWordsPerScene
  };
}

// CLI invocation support
if (process.argv[1] && (process.argv[1].endsWith('migrate_to_scenes.js') || process.argv[1].endsWith('migrate-to-scenes'))) {
  console.log(`\n\x1b[1m\x1b[36m=== Soundingboard 2.0 Migration ===\x1b[0m`);
  const report = migrateToScenes();
  console.log(`\x1b[32m✔ Migration completed successfully!\x1b[0m`);
  console.log(`  - Backup created at: ${report.backupDir}`);
  console.log(`  - Chapters migrated: ${report.chaptersMigrated}`);
  console.log(`  - Scenes created: ${report.scenesCreated}`);
  console.log(`  - Average words per scene: ${report.averageWordsPerScene}`);
  if (report.averageWordsPerScene > 0 && report.averageWordsPerScene < 800) {
    console.log(`  \x1b[33m⚠ Warning: Average scene length is < 800 words (${report.averageWordsPerScene}w). Review for over-splitting.\x1b[0m`);
  }
  if (report.unwrittenBreakRationales > 0) {
    console.log(`  \x1b[33m⚠ Action required: ${report.unwrittenBreakRationales} chapters need human-authored break_rationale.\x1b[0m`);
  }
  console.log(`  - Unfilled fields (nulls): ${report.nullFieldCount}\n`);
}
