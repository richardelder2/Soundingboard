/**
 * Soundingboard 2.0 - Derived Index Rebuilder
 * Scans manuscript/ and regenerates manuscript.json purely from file records.
 *
 * Ground truth principle:
 * The markdown files are the record. manuscript.json is a derived cache.
 * Deleting manuscript.json and running reindex restores it losslessly.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse, strip } from './frontmatter.js';

/**
 * Counts words in prose body.
 * @param {string} text
 * @returns {number}
 */
export function countWords(text) {
  const matches = text.match(/[\w'’-]+/g);
  return matches ? matches.length : 0;
}

/**
 * Reindexes the manuscript tree and rebuilds manuscript.json.
 * @param {string} [rootDir=process.cwd()]
 * @returns {import('./types.js').ManuscriptIndex}
 */
export function reindex(rootDir = process.cwd()) {
  const manuscriptDir = path.join(rootDir, 'manuscript');
  const manifestPath = path.join(rootDir, 'manuscript.json');

  // Read existing manifest for baseline metadata if present
  /** @type {Record<string, any>} */
  let existing = {};
  if (fs.existsSync(manifestPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (_) {}
  }

  // Check root preferences.md first (Soundingboard 2.0+), then stages/01_onboarding/output/preferences.json
  const rootPrefPath = path.join(rootDir, 'preferences.md');
  const prefsJsonPath = path.join(rootDir, 'stages', '01_onboarding', 'output', 'preferences.json');
  /** @type {Record<string, any>} */
  let prefs = {};

  if (fs.existsSync(rootPrefPath)) {
    try {
      prefs = parse(fs.readFileSync(rootPrefPath, 'utf8'), rootPrefPath);
    } catch (_) {}
  } else if (fs.existsSync(prefsJsonPath)) {
    try {
      prefs = JSON.parse(fs.readFileSync(prefsJsonPath, 'utf8'));
    } catch (_) {}
  }

  const title = existing.title || prefs.title || '[working title]';
  const author = existing.author || prefs.author_name || prefs.author || '[author or pen name]';
  const form = existing.form || prefs.form || 'novel';
  const targetWords = existing.target_words || prefs.target_words || 90000;

  /** @type {import('./types.js').ChapterRecord[]} */
  const chapters = [];
  /** @type {any[]} */
  const scenes = [];
  /** @type {Set<string>} */
  const assignedSceneIds = new Set();
  let totalWords = 0;

  if (fs.existsSync(manuscriptDir)) {
    // 1. Scan flat scene pool: manuscript/scenes/sc-XXXX.md if present
    const scenesPoolDir = path.join(manuscriptDir, 'scenes');
    if (fs.existsSync(scenesPoolDir)) {
      const poolFiles = fs.readdirSync(scenesPoolDir, { withFileTypes: true })
        .filter(f => f.isFile() && /^sc-.*\.md$/i.test(f.name))
        .map(f => f.name)
        .sort();

      for (const scFileName of poolFiles) {
        const scFilePath = path.join(scenesPoolDir, scFileName);
        const rawContent = fs.readFileSync(scFilePath, 'utf8');
        const scMeta = parse(rawContent, scFilePath);
        const scBody = strip(rawContent);
        const scWords = countWords(scBody);
        totalWords += scWords;

        const sceneId = scMeta.id || path.basename(scFileName, '.md');
        const relPath = path.relative(rootDir, scFilePath).replace(/\\/g, '/');

        scenes.push({
          id: sceneId,
          chapter: scMeta.chapter || null,
          file: relPath,
          pov: scMeta.pov !== undefined ? scMeta.pov : null,
          location: scMeta.location !== undefined ? scMeta.location : null,
          threads: scMeta.threads || ['th-01'],
          value_in: scMeta.value_in !== undefined ? scMeta.value_in : null,
          value_out: scMeta.value_out !== undefined ? scMeta.value_out : null,
          commandments: scMeta.commandments || null,
          voice_anchor: scMeta.voice_anchor !== undefined ? scMeta.voice_anchor : null,
          anchor_provisional: Boolean(scMeta.anchor_provisional),
          craft_modules: scMeta.craft_modules || [],
          status: scMeta.status || 'drafted',
          word_count: scWords,
          schema: scMeta.schema || '2.0'
        });
      }
    }

    // 2. Scan chapter assembly playlists in manuscript/chapters/ or legacy ch-XX/
    const chaptersPoolDir = path.join(manuscriptDir, 'chapters');
    /** @type {Array<{ isPlaylistFile: boolean, filePath?: string, dirPath?: string, id: string }>} */
    const chapterSources = [];

    if (fs.existsSync(chaptersPoolDir)) {
      const chFiles = fs.readdirSync(chaptersPoolDir, { withFileTypes: true })
        .filter(f => f.isFile() && /^ch-.*\.md$/i.test(f.name))
        .map(f => f.name)
        .sort((a, b) => {
          const numA = parseInt((a.match(/\d+/) || ['0'])[0], 10);
          const numB = parseInt((b.match(/\d+/) || ['0'])[0], 10);
          return numA - numB;
        });

      for (const chFile of chFiles) {
        chapterSources.push({
          isPlaylistFile: true,
          filePath: path.join(chaptersPoolDir, chFile),
          id: chFile.replace(/\.md$/, '')
        });
      }
    }

    // Also scan legacy chapter directories: manuscript/ch-01, ch-02, ...
    const legacyDirs = fs.readdirSync(manuscriptDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && /^ch-\d+/i.test(d.name))
      .map(d => d.name)
      .sort((a, b) => {
        const numA = parseInt((a.match(/\d+/) || ['0'])[0], 10);
        const numB = parseInt((b.match(/\d+/) || ['0'])[0], 10);
        return numA - numB;
      });

    for (const chDirName of legacyDirs) {
      chapterSources.push({
        isPlaylistFile: false,
        dirPath: path.join(manuscriptDir, chDirName),
        id: chDirName
      });
    }

    for (const source of chapterSources) {
      /** @type {Record<string, any>} */
      let chapterMeta = {};
      /** @type {string[]} */
      let orderedScenes = [];
      let chapterNumber = 1;
      let chapterId = source.id;

      if (source.isPlaylistFile && source.filePath) {
        chapterMeta = parse(fs.readFileSync(source.filePath, 'utf8'), source.filePath);
        chapterId = chapterMeta.id || source.id;
        chapterNumber = chapterMeta.number !== undefined ?
          chapterMeta.number :
          parseInt((source.id.match(/\d+/) || ['1'])[0], 10);
        orderedScenes = Array.isArray(chapterMeta.scenes) ? chapterMeta.scenes : [];
        for (const scId of orderedScenes) {
          assignedSceneIds.add(scId);
          const scObj = scenes.find(s => s.id === scId);
          if (scObj && !scObj.chapter) {
            scObj.chapter = chapterId;
          }
        }
      } else if (source.dirPath) {
        const chDirPath = source.dirPath;
        const chapterMdPath = path.join(chDirPath, 'chapter.md');
        if (fs.existsSync(chapterMdPath)) {
          chapterMeta = parse(fs.readFileSync(chapterMdPath, 'utf8'), chapterMdPath);
        }
        chapterId = chapterMeta.id || source.id;
        chapterNumber = chapterMeta.number !== undefined ?
          chapterMeta.number :
          parseInt((source.id.match(/\d+/) || ['1'])[0], 10);

        // Find scenes in this legacy chapter directory
        const sceneFiles = fs.readdirSync(chDirPath, { withFileTypes: true })
          .filter(f => f.isFile() && /^sc-.*\.md$/i.test(f.name))
          .map(f => f.name)
          .sort();

        const chapterSceneIds = [];
        for (const scFileName of sceneFiles) {
          const scFilePath = path.join(chDirPath, scFileName);
          const rawContent = fs.readFileSync(scFilePath, 'utf8');
          const scMeta = parse(rawContent, scFilePath);
          const scBody = strip(rawContent);
          const scWords = countWords(scBody);
          totalWords += scWords;

          const sceneId = scMeta.id || path.basename(scFileName, '.md');
          chapterSceneIds.push(sceneId);
          assignedSceneIds.add(sceneId);

          const relPath = path.relative(rootDir, scFilePath).replace(/\\/g, '/');
          scenes.push({
            id: sceneId,
            chapter: scMeta.chapter || chapterId,
            file: relPath,
            pov: scMeta.pov !== undefined ? scMeta.pov : null,
            location: scMeta.location !== undefined ? scMeta.location : null,
            threads: scMeta.threads || ['th-01'],
            value_in: scMeta.value_in !== undefined ? scMeta.value_in : null,
            value_out: scMeta.value_out !== undefined ? scMeta.value_out : null,
            commandments: scMeta.commandments || null,
            voice_anchor: scMeta.voice_anchor !== undefined ? scMeta.voice_anchor : null,
            anchor_provisional: Boolean(scMeta.anchor_provisional),
            craft_modules: scMeta.craft_modules || [],
            status: scMeta.status || 'drafted',
            word_count: scWords,
            schema: scMeta.schema || '2.0'
          });
        }
        orderedScenes = Array.isArray(chapterMeta.scenes) && chapterMeta.scenes.length > 0 ?
          chapterMeta.scenes : chapterSceneIds;
      }

      const rawRationale = typeof chapterMeta.break_rationale === 'string' ? chapterMeta.break_rationale.trim() : '';
      const hasBreakRationale = rawRationale.length > 0;

      chapters.push({
        id: chapterId,
        number: chapterNumber,
        title: chapterMeta.title || `Chapter ${chapterNumber}`,
        scenes: orderedScenes,
        break_rationale: rawRationale,
        break_rationale_missing: !hasBreakRationale,
        status: !hasBreakRationale ? 'incomplete' : (chapterMeta.status || 'drafted'),
        schema: chapterMeta.schema || '2.0'
      });
    }
  }

  // Compute unassigned (floating) scenes
  const unassignedScenes = scenes
    .filter(s => !assignedSceneIds.has(s.id))
    .map(s => s.id);

  // Load threads if present
  const threadsPath = path.join(rootDir, 'stages', '02_planning', 'output', 'threads.md');
  const threads = [];
  if (fs.existsSync(threadsPath)) {
    try {
      const thMeta = parse(fs.readFileSync(threadsPath, 'utf8'), threadsPath);
      if (Array.isArray(thMeta.threads)) {
        threads.push(...thMeta.threads);
      }
    } catch (_) {}
  }

  /** @type {any} */
  const index = {
    schema_version: '2.0.0',
    unit_type: 'scene',
    title,
    author,
    form,
    target_words: targetWords,
    chapters,
    scenes,
    unassigned_scenes: unassignedScenes,
    threads,
    total_words: totalWords
  };

  fs.writeFileSync(manifestPath, JSON.stringify(index, null, 2) + '\n', 'utf8');
  return index;
}

/**
 * Validates that all chapters in the manuscript tree have a non-empty break_rationale.
 * Stage 02 completeness failure if missing or empty.
 * @param {string} [rootDir=process.cwd()]
 * @returns {{ valid: boolean, incompleteChapters: string[], errors: string[] }}
 */
export function validateBreakRationales(rootDir = process.cwd()) {
  const manifestPath = path.join(rootDir, 'manuscript.json');
  /** @type {string[]} */
  const incompleteChapters = [];
  /** @type {string[]} */
  const errors = [];

  let manifest = null;
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (_) {}
  }

  if (!manifest || manifest.unit_type !== 'scene' || !Array.isArray(manifest.chapters)) {
    return { valid: true, incompleteChapters: [], errors: [] };
  }

  for (const ch of manifest.chapters) {
    if (!ch.break_rationale || ch.break_rationale.trim() === '' || ch.break_rationale_missing || ch.status === 'incomplete') {
      incompleteChapters.push(ch.id);
      errors.push(`Chapter ${ch.id} is missing mandatory human-authored break_rationale (Stage 02 completeness failure).`);
    }
  }

  return {
    valid: incompleteChapters.length === 0,
    incompleteChapters,
    errors
  };
}

// CLI invocation support
if (process.argv[1] && (process.argv[1].endsWith('reindex.js') || process.argv[1].endsWith('reindex'))) {
  const result = reindex();
  console.log(`\x1b[32m✔ Reindexed manuscript:\x1b[0m ${result.chapters.length} chapters, ${result.scenes.length} scenes, ${result.total_words} words.`);
  const validation = validateBreakRationales();
  if (!validation.valid) {
    console.error(`\x1b[31m✗ Stage 02 Completeness Failure:\x1b[0m ${validation.incompleteChapters.length} chapter(s) missing break_rationale: ${validation.incompleteChapters.join(', ')}`);
  }
}
