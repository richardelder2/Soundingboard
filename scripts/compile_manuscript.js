#!/usr/bin/env node
/**
 * Soundingboard 2.0 - Multi-Tier Manuscript Compiler (SB2-P3-01)
 * Stage 05 Publishing Engine.
 * Zero external runtime dependencies; built-in Node only.
 *
 * Compiles atomic units:
 *   scenes -> chapters -> typeset HTML (+ EPUB/DOCX via pandoc)
 *
 * Key Capabilities:
 * 1. Multi-Tier Resolution:
 *    - 2.0 Atomic Scene Model: manuscript/ch-XX/chapter.md + sc-YYYY.md
 *    - 1.x Legacy Chapter Model: stages/03_drafting/output/chapters/chXX.md
 * 2. Configurable Scene Break Glyphs:
 *    --break="***" (default) | --break="blank" | --break="none" | --break="###" | --break="<custom>"
 * 3. Fail-Loud Verification:
 *    Halts compilation immediately if any scene in a chapter is missing, unwritten, or corrupted,
 *    unless --force or --ignore-missing is explicitly provided.
 * 4. Machine-Checkable Stage 04 Gate Enforcement:
 *    Unless --all is passed, chapters must be 'passed' with valid gate verdicts
 *    ('scan', 'canon_check', 'rubric', 'ledger_delivery').
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { parse, strip } from './frontmatter.js';
import { findScenePath } from './hash_staleness.js';

const CHAPTERS_DIR = path.join('stages', '03_drafting', 'output', 'chapters');
const MANUSCRIPT_DIR = 'manuscript';
const OUT_DIR = path.join('stages', '05_publishing', 'output');
const MANIFEST = 'manuscript.json';

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Resolves the HTML representation for scene break dividers.
 * @param {string} breakStyle
 * @returns {string}
 */
export function resolveSceneBreakHtml(breakStyle = '***') {
  const normalized = breakStyle.toLowerCase().trim();
  if (normalized === 'none') {
    return '';
  }
  if (normalized === 'blank' || normalized === 'space') {
    return '<div class="scene-break scene-break-blank"></div>';
  }
  if (normalized === '***' || normalized === 'asterisks') {
    return '<hr class="scene-break scene-break-asterisks">';
  }
  if (normalized === '---' || normalized === 'line') {
    return '<hr class="scene-break scene-break-line">';
  }
  // Custom glyph
  return `<div class="scene-break scene-break-custom"><span class="scene-break-glyph">${escapeHtml(breakStyle)}</span></div>`;
}

/**
 * Minimal prose-oriented markdown -> HTML converter.
 * Converts headings, hr, em/strong, and paragraphs.
 * @param {string} md
 * @param {string} breakStyle
 * @returns {string}
 */
export function mdToHtml(md, breakStyle = '***') {
  const blocks = md.replace(/\r\n/g, '\n').split(/\n{2,}/);
  const breakHtml = resolveSceneBreakHtml(breakStyle);

  return blocks.map(block => {
    const b = block.trim();
    if (!b) return '';
    const h = b.match(/^(#{1,3})\s+(.*)$/);
    if (h) return `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`;
    if (/^(---+|\*\s*\*\s*\*|#)$/.test(b)) {
      return breakHtml;
    }
    return `<p>${b.split('\n').map(inline).join('<br>')}</p>`;
  }).filter(Boolean).join('\n');

  function inline(s) {
    return escapeHtml(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }
}

/**
 * Loads manuscript.json if present.
 * @param {string} [rootDir=process.cwd()]
 * @returns {any}
 */
export function loadManifest(rootDir = process.cwd()) {
  const manifestPath = path.join(rootDir, MANIFEST);
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    console.error(`Warning: could not parse ${MANIFEST}: ${e.message}`);
    return null;
  }
}

/**
 * Checks if a chapter passes the Stage 04 gate verdicts.
 * @param {string|number} chapterId
 * @param {string} [rootDir=process.cwd()]
 * @returns {{ passed: boolean, issues: string[] }}
 */
export function checkChapterGate(chapterId, rootDir = process.cwd()) {
  const num = typeof chapterId === 'number' ? chapterId : parseInt(String(chapterId).replace(/\D/g, '') || '1', 10);
  const pad = String(num).padStart(2, '0');
  const vDir = path.join(rootDir, 'stages', '04_diagnostics_edits', 'output', 'verdicts', `ch${pad}`);
  const requiredChecks = ['scan', 'canon_check', 'rubric', 'ledger_delivery'];
  const issues = [];

  for (const req of requiredChecks) {
    const vFile = path.join(vDir, `${req}.json`);
    if (!fs.existsSync(vFile)) {
      issues.push(`missing ${req}`);
    } else {
      try {
        const vData = JSON.parse(fs.readFileSync(vFile, 'utf8'));
        if (vData.verdict !== 'PASS' && vData.verdict !== 'SKIP') {
          issues.push(`failed ${req}`);
        }
      } catch (e) {
        issues.push(`corrupted ${req}`);
      }
    }
  }

  return {
    passed: issues.length === 0,
    issues
  };
}

/**
 * Resolves scenes for a chapter from manuscript/ch-XX/chapter.md.
 * Halts loud if any scene is missing unless ignoreMissing is set.
 * @param {string} chDirName
 * @param {string} rootDir
 * @param {boolean} ignoreMissing
 * @returns {{ title: string, sceneFiles: string[] }}
 */
export function resolveChapterScenes(chDirName, rootDir = process.cwd(), ignoreMissing = false) {
  const chDirPath = path.join(rootDir, MANUSCRIPT_DIR, chDirName);
  const chapterMdPath = path.join(chDirPath, 'chapter.md');
  let chapterTitle = chDirName;
  let declaredScenes = [];

  if (fs.existsSync(chapterMdPath)) {
    try {
      const meta = parse(fs.readFileSync(chapterMdPath, 'utf8'), chapterMdPath);
      if (meta.title) chapterTitle = meta.title;
      if (Array.isArray(meta.scenes) && meta.scenes.length > 0) {
        declaredScenes = meta.scenes;
      }
    } catch (e) {
      console.error(`Warning: could not parse ${chapterMdPath}: ${e.message}`);
    }
  }

  // If no declared scenes in chapter.md, scan sc-*.md in directory
  if (declaredScenes.length === 0 && fs.existsSync(chDirPath)) {
    declaredScenes = fs.readdirSync(chDirPath)
      .filter(f => /^sc-\d+\.md$/i.test(f))
      .sort()
      .map(f => path.basename(f, '.md'));
  }

  const missingScenes = [];
  const resolvedFiles = [];

  for (const scId of declaredScenes) {
    let scPath = path.join(chDirPath, `${scId}.md`);
    if (!fs.existsSync(scPath)) {
      const alt = findScenePath(scId, rootDir);
      if (alt && fs.existsSync(alt)) {
        scPath = alt;
      } else {
        missingScenes.push(scId);
        continue;
      }
    }
    resolvedFiles.push(scPath);
  }

  if (missingScenes.length > 0 && !ignoreMissing) {
    const errMsg = `Compilation halted: Chapter ${chDirName} specifies scene(s) [${missingScenes.join(', ')}] which do NOT exist or are undrafted.`;
    throw new Error(errMsg);
  }

  return {
    title: chapterTitle,
    sceneFiles: resolvedFiles
  };
}

/**
 * Main compilation entry point.
 * @param {string[]} [args=[]]
 * @param {object} [options={}]
 * @param {string} [options.rootDir]
 */
export function compileManuscript(args = [], options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const includeAll = args.includes('--all');
  const ignoreMissing = args.includes('--force') || args.includes('--ignore-missing');

  // Scene break glyph configuration:
  // e.g. --break="***" | --break=blank | --break=none | --break="~ ~ ~"
  let breakStyle = '***';
  const breakArg = args.find(a => a.startsWith('--break=') || a.startsWith('--break-glyph=') || a.startsWith('--scene-break='));
  if (breakArg) {
    breakStyle = breakArg.split('=')[1].replace(/^["']|["']$/g, '');
  }

  const manifest = loadManifest(rootDir);
  const manuscriptRoot = path.join(rootDir, MANUSCRIPT_DIR);
  const isV2Workspace = fs.existsSync(manuscriptRoot);

  /** @type {Array<{ title: string, scenes: Array<{ file: string, body: string, id: string }> }>} */
  const compiledChapters = [];
  const skipped = [];

  if (isV2Workspace) {
    // 2.0 Atomic Scene Model
    let chapterEntries = [];

    if (manifest && Array.isArray(manifest.chapters) && manifest.chapters.length) {
      chapterEntries = manifest.chapters.map(c => ({
        id: c.id,
        dirName: typeof c.id === 'number' ? `ch-${String(c.id).padStart(2, '0')}` : String(c.id),
        title: c.title || `Chapter ${c.id}`,
        status: c.status
      }));
    } else {
      const dirs = fs.readdirSync(manuscriptRoot, { withFileTypes: true })
        .filter(d => d.isDirectory() && /^ch-\d+/i.test(d.name))
        .map(d => d.name)
        .sort((a, b) => {
          const numA = parseInt((a.match(/\d+/) || ['0'])[0], 10);
          const numB = parseInt((b.match(/\d+/) || ['0'])[0], 10);
          return numA - numB;
        });

      chapterEntries = dirs.map(d => ({
        id: parseInt((d.match(/\d+/) || ['1'])[0], 10),
        dirName: d,
        title: `Chapter ${parseInt((d.match(/\d+/) || ['1'])[0], 10)}`,
        status: 'drafted'
      }));
    }

    for (const ch of chapterEntries) {
      const chDirPath = path.join(manuscriptRoot, ch.dirName);
      if (!fs.existsSync(chDirPath)) {
        skipped.push(`ch ${ch.id} (directory missing: ${ch.dirName})`);
        continue;
      }

      // Check gate if not --all
      if (!includeAll) {
        if (ch.status !== 'passed') {
          skipped.push(`ch ${ch.id} (status: ${ch.status})`);
          continue;
        }
        const gate = checkChapterGate(ch.id, rootDir);
        if (!gate.passed) {
          skipped.push(`ch ${ch.id} (unverified Stage 04 gate: ${gate.issues.join(', ')})`);
          continue;
        }
      }

      // Resolve chapter scenes (Fail loud on missing scene)
      try {
        const { title: resolvedTitle, sceneFiles } = resolveChapterScenes(ch.dirName, rootDir, ignoreMissing);
        if (sceneFiles.length === 0) {
          skipped.push(`ch ${ch.id} (no scenes in ${ch.dirName})`);
          continue;
        }

        const scenes = [];
        for (const sf of sceneFiles) {
          const raw = fs.readFileSync(sf, 'utf8');
          const body = strip(raw).trim();
          const scId = path.basename(sf, '.md');
          scenes.push({ file: sf, body, id: scId });
        }

        compiledChapters.push({
          title: resolvedTitle || ch.title,
          scenes
        });
      } catch (err) {
        console.error(`\x1b[31mError during compilation of chapter ${ch.id}:\x1b[0m ${err.message}`);
        process.exitCode = 1;
        throw err;
      }
    }
  } else {
    // 1.x Legacy Chapter Model
    if (manifest && Array.isArray(manifest.chapters) && manifest.chapters.length) {
      for (const ch of manifest.chapters) {
        const p = (ch.draft_file || '').replace(/\//g, path.sep);
        const fullP = path.join(rootDir, p);
        if (!p || !fs.existsSync(fullP)) {
          skipped.push(`ch ${ch.id} (no draft file)`);
          continue;
        }

        if (!includeAll) {
          if (ch.status !== 'passed') {
            skipped.push(`ch ${ch.id} (status: ${ch.status})`);
            continue;
          }
          const gate = checkChapterGate(ch.id, rootDir);
          if (!gate.passed) {
            skipped.push(`ch ${ch.id} (unverified Stage 04 gate: ${gate.issues.join(', ')})`);
            continue;
          }
        }

        const raw = fs.readFileSync(fullP, 'utf8');
        const body = strip(raw).trim();
        compiledChapters.push({
          title: ch.title || `Chapter ${ch.id}`,
          scenes: [{ file: fullP, body, id: `ch${ch.id}` }]
        });
      }
    } else {
      const fullChaptersDir = path.join(rootDir, CHAPTERS_DIR);
      if (!fs.existsSync(fullChaptersDir)) {
        console.error(`No ${MANIFEST} and no chapters at ${CHAPTERS_DIR}.`);
        process.exitCode = 1;
        return;
      }
      const files = fs.readdirSync(fullChaptersDir)
        .filter(f => /\.(md|markdown|txt)$/i.test(f)).sort();

      for (const f of files) {
        const fullP = path.join(fullChaptersDir, f);
        const raw = fs.readFileSync(fullP, 'utf8');
        const body = strip(raw).trim();
        compiledChapters.push({
          title: f.replace(/\.(md|markdown|txt)$/i, '').replace(/[_-]+/g, ' '),
          scenes: [{ file: fullP, body, id: f }]
        });
      }
    }
  }

  if (skipped.length) {
    console.log(`Skipped ${skipped.length} chapter(s): ${skipped.join(', ')}`);
    if (!includeAll) console.log('Use --all to compile regardless of the Stage 04 gate.');
  }

  if (compiledChapters.length === 0) {
    console.error('Nothing to compile — no eligible chapters.');
    process.exitCode = 1;
    return;
  }

  const title = manifest?.title && !manifest.title.startsWith('[') ? manifest.title : 'Untitled Manuscript';
  const author = manifest?.author && !manifest.author.startsWith('[') ? manifest.author : '';
  let totalWords = 0;
  let totalScenes = 0;

  const breakHtml = resolveSceneBreakHtml(breakStyle);

  const bodyHtml = compiledChapters.map((ch, i) => {
    totalScenes += ch.scenes.length;

    // Join scene bodies within chapter using scene break glyph
    const sceneParts = ch.scenes.map(sc => {
      const words = (sc.body.match(/[\w'’-]+/g) || []).length;
      totalWords += words;
      // Drop leading H1 if it repeats chapter title
      const cleaned = sc.body.replace(/^#\s+.*\n+/, '');
      return mdToHtml(cleaned, breakStyle);
    });

    const chapterBody = sceneParts.filter(Boolean).join(breakHtml ? `\n${breakHtml}\n` : '\n\n');
    return `<section class="chapter">\n<h2 class="chapter-title">${escapeHtml(ch.title)}</h2>\n${chapterBody}\n</section>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #1a1a1a; margin: 0; }
  main { max-width: 34em; margin: 0 auto; padding: 3rem 1.5rem; }
  .title-page { text-align: center; padding: 30vh 0 10vh; page-break-after: always; }
  .title-page h1 { font-size: 2.2em; letter-spacing: .02em; margin: 0 0 .5em; }
  .title-page .author { font-variant: small-caps; font-size: 1.1em; }
  .chapter { page-break-before: always; }
  .chapter-title { text-align: center; font-variant: small-caps; margin: 4rem 0 2.5rem; font-weight: normal; font-size: 1.3em; }
  p { margin: 0; text-indent: 1.4em; text-align: justify; }
  .chapter p:first-of-type, hr.scene-break + p, div.scene-break + p { text-indent: 0; }
  hr.scene-break { border: none; text-align: center; margin: 1.8em 0; }
  hr.scene-break-asterisks::after { content: "* * *"; color: #444; letter-spacing: 0.4em; }
  hr.scene-break-line { border-top: 1px solid #ccc; width: 30%; margin: 1.8em auto; }
  div.scene-break-blank { height: 1.8em; }
  div.scene-break-custom { text-align: center; margin: 1.8em 0; font-family: serif; color: #444; }
</style>
</head>
<body>
<main>
<div class="title-page"><h1>${escapeHtml(title)}</h1>${author ? `<div class="author">${escapeHtml(author)}</div>` : ''}</div>
${bodyHtml}
</main>
</body>
</html>
`;

  const outDir = path.join(rootDir, OUT_DIR);
  fs.mkdirSync(outDir, { recursive: true });
  const htmlPath = path.join(outDir, 'manuscript.html');
  fs.writeFileSync(htmlPath, html, 'utf8');

  console.log(`\x1b[32m✔\x1b[0m ${htmlPath} (${compiledChapters.length} chapters, ${totalScenes} scenes, ${totalWords.toLocaleString()} words, break: "${breakStyle}")`);

  const wantsDocx = args.includes('--docx') || args.includes('--format=docx');
  const wantsEpub = args.includes('--epub') || args.includes('--format=epub');

  // Pandoc export
  const probe = spawnSync('pandoc --version', { shell: true, stdio: 'ignore' });
  if (probe.status === 0) {
    const q = s => `"${String(s).replace(/"/g, '')}"`;

    if (!wantsDocx || wantsEpub) {
      const epubPath = path.join(outDir, 'manuscript.epub');
      let cmd = `pandoc ${q(htmlPath)} -o ${q(epubPath)} --split-level=1 --metadata ${q(`title=${title}`)}`;
      if (author) cmd += ` --metadata ${q(`author=${author}`)}`;
      const res = spawnSync(cmd, { shell: true, encoding: 'utf8' });
      if (res.status === 0) console.log(`\x1b[32m✔\x1b[0m ${epubPath}`);
      else console.error(`pandoc EPUB export failed: ${(res.stderr || '').trim()}`);
    }

    if (wantsDocx) {
      const docxPath = path.join(outDir, 'manuscript.docx');
      let docxCmd = `pandoc ${q(htmlPath)} -o ${q(docxPath)} --metadata ${q(`title=${title}`)}`;
      if (author) docxCmd += ` --metadata ${q(`author=${author}`)}`;
      const docxRes = spawnSync(docxCmd, { shell: true, encoding: 'utf8' });
      if (docxRes.status === 0) console.log(`\x1b[32m✔\x1b[0m ${docxPath}`);
      else console.error(`pandoc DOCX export failed: ${(docxRes.stderr || '').trim()}`);
    }
  } else {
    if (wantsDocx || wantsEpub) {
      console.log(`\x1b[33mNote: Exporting to ${wantsDocx ? '.docx' : '.epub'} requires pandoc (https://pandoc.org).\x1b[0m`);
      console.log(`Your manuscript has been compiled to HTML at ${htmlPath}, which can be opened directly in Microsoft Word and saved as .docx.`);
    } else {
      console.log('pandoc not found — HTML only. Install pandoc (https://pandoc.org) for EPUB and DOCX export.');
    }
  }

  return {
    htmlPath,
    chaptersCount: compiledChapters.length,
    scenesCount: totalScenes,
    totalWords
  };
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith('compile_manuscript.js')) {
  compileManuscript(process.argv.slice(2));
}
