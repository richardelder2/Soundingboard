import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { spawnSync } from 'child_process';

function stripBOM(str) {
  return str.replace(/^\uFEFF/, '');
}

function checkPandoc() {
  try {
    const res = spawnSync('pandoc', ['-v'], { encoding: 'utf8', stdio: 'pipe' });
    return res.status === 0;
  } catch (_) {
    return false;
  }
}

function calculateFileHash(bufferOrStr) {
  return crypto.createHash('sha256').update(bufferOrStr).digest('hex').slice(0, 12);
}

function harvestEntitiesFromText(text) {
  const lines = text.split(/\r?\n/);
  const entities = new Set();
  const honorificRegex = /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Captain|Commander|Officer|Inspector|Detective|Lord|Lady|King|Queen|Professor)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g;
  
  lines.forEach(line => {
    const honMatches = line.match(honorificRegex) || [];
    honMatches.forEach(m => entities.add(m.trim()));

    const speakerMatches = line.match(/(?:said|asked|replied|shouted|whispered|muttered|called)\s+([A-Z][a-z]+)\b/g) || [];
    speakerMatches.forEach(s => {
      const parts = s.split(/\s+/);
      if (parts[1]) entities.add(parts[1]);
    });

    const actionMatches = line.match(/^([A-Z][a-z]+)\s+(?:stepped|turned|walked|looked|ran|felt|held|drew|stood|sat|smiled|frowned|nodded|gasped|paused|glanced|reached|pulled|pushed|whispered|spoke)\b/);
    if (actionMatches && actionMatches[1]) {
      entities.add(actionMatches[1]);
    }
  });

  const stopWords = new Set(['Chapter', 'The', 'And', 'But', 'Then', 'When', 'What', 'Where', 'Why', 'How', 'There', 'Here', 'This', 'That', 'Suddenly']);
  return Array.from(entities).filter(e => !stopWords.has(e) && e.length > 2);
}

function seedOrUpdateCanon(entities, chapterNum, bookTitle = 'Untitled') {
  if (entities.length === 0) return [];
  const canonDir = path.join('stages', '02_planning', 'output');
  fs.mkdirSync(canonDir, { recursive: true });
  const canonPath = path.join(canonDir, 'canon.md');

  let canonContent = '';
  const nowStr = new Date().toISOString().split('T')[0];

  if (fs.existsSync(canonPath)) {
    canonContent = fs.readFileSync(canonPath, 'utf8');
  } else {
    const tmplPath = path.join('_config', 'templates', 'canon.template.md');
    if (fs.existsSync(tmplPath)) {
      canonContent = fs.readFileSync(tmplPath, 'utf8')
        .replace(/book:\s*"\[title\]"/, `book: "${bookTitle.replace(/"/g, '\\"')}"`)
        .replace(/last_modified:\s*\[YYYY-MM-DD\]/, `last_modified: ${nowStr}`);
    } else {
      canonContent = [
        '---',
        'type: Canon',
        `book: "${bookTitle.replace(/"/g, '\\"')}"`,
        `last_verified_chapter: 0`,
        `last_modified: ${nowStr}`,
        '---',
        '',
        '# Canon — established facts ledger',
        '',
        '*The single source of truth for what is true on the page. Ingested facts begin tagged [unverified chN].*',
        '',
        '## Entity Ledger',
        '| Entity | Attribute | Value | First Asserted | Status |',
        '|---|---|---|---|---|',
        ''
      ].join('\n');
    }
  }

  const added = [];
  entities.forEach(ent => {
    if (!canonContent.includes(`| ${ent} |`)) {
      const row = `| ${ent} | figure/presence | Established in draft | ch ${chapterNum} | unverified ch${chapterNum} |\n`;
      added.push(ent);
      if (canonContent.includes('## Entity Ledger')) {
        const parts = canonContent.split('## Entity Ledger');
        const lines = parts[1].split('\n');
        let tableIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('|---|')) {
            tableIndex = i;
            break;
          }
        }
        if (tableIndex !== -1) {
          lines.splice(tableIndex + 1, 0, row.trim());
          canonContent = parts[0] + '## Entity Ledger' + lines.join('\n');
        } else {
          canonContent += `\n${row}`;
        }
      } else {
        canonContent += `\n## Entity Ledger\n| Entity | Attribute | Value | First Asserted | Status |\n|---|---|---|---|---|\n${row}`;
      }
    }
  });

  if (added.length > 0) {
    fs.writeFileSync(canonPath, canonContent, 'utf8');
  }
  return added;
}

function seedVoiceExemplars(text, bookTitle = 'Untitled') {
  const voiceDir = path.join('stages', '02_planning', 'output');
  fs.mkdirSync(voiceDir, { recursive: true });
  const voicePath = path.join(voiceDir, 'voice_exemplars.md');
  if (fs.existsSync(voicePath)) return false;

  const paragraphs = text.split(/\r?\n\r?\n/).map(p => p.trim()).filter(p => {
    const w = (p.match(/[\w'’-]+/g) || []).length;
    return w >= 40 && w <= 250 && !p.startsWith('#') && !p.startsWith('---');
  });

  if (paragraphs.length === 0) return false;
  const sample = paragraphs[0];
  const nowStr = new Date().toISOString().split('T')[0];

  const content = [
    '---',
    'type: VoiceExemplars',
    `book: "${bookTitle.replace(/"/g, '\\"')}"`,
    `last_modified: ${nowStr}`,
    '---',
    '',
    '# Voice Exemplars — anti-drift kit',
    '',
    '*Seeded automatically from author raw draft ingestion.*',
    '',
    '## Narration — [POV / Narrator]',
    '**Register:** Captured from ingested prose',
    '',
    `> ${sample.replace(/\n/g, '\n> ')}`,
    '',
    '## Dialogue — Key Figures',
    '**Register:** In-character delivery',
    '',
    '## Anti-patterns for this book',
    '- Watch for unintended tone drift away from initial raw draft'
  ].join('\n');

  fs.writeFileSync(voicePath, content, 'utf8');
  return true;
}

function archiveRawFile(filePath, type = 'drafts') {
  const resolved = path.resolve(process.cwd(), filePath);
  const targetSubdir = type === 'notes' ? 'notes' : 'drafts';
  const inputsDir = path.resolve(process.cwd(), 'inputs', targetSubdir);
  fs.mkdirSync(inputsDir, { recursive: true });

  const isAlreadyInInputs = resolved.startsWith(path.resolve(process.cwd(), 'inputs'));
  if (isAlreadyInInputs) {
    const rel = path.relative(process.cwd(), resolved).replace(/\\/g, '/');
    return { archivePath: rel, isNewCopy: false };
  }

  const baseName = path.basename(resolved);
  let destPath = path.join(inputsDir, baseName);

  if (fs.existsSync(destPath)) {
    const origBuf = fs.readFileSync(resolved);
    const destBuf = fs.readFileSync(destPath);
    if (!origBuf.equals(destBuf)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      destPath = path.join(inputsDir, `${stamp}_${baseName}`);
      fs.copyFileSync(resolved, destPath);
    }
  } else {
    fs.copyFileSync(resolved, destPath);
  }

  const relDest = path.relative(process.cwd(), destPath).replace(/\\/g, '/');
  return { archivePath: relDest, isNewCopy: true };
}

function convertFileToMarkdown(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.docx') {
    if (!checkPandoc()) {
      throw new Error('Importing .docx files requires pandoc. Please install pandoc or convert to Markdown.');
    }
    const tempMd = path.join(path.dirname(filePath), `__temp_import_${Date.now()}.md`);
    try {
      const res = spawnSync('pandoc', [filePath, '-t', 'markdown', '-o', tempMd], { encoding: 'utf8' });
      if (res.status !== 0 || !fs.existsSync(tempMd)) {
        throw new Error(res.stderr || 'Pandoc failed to convert .docx');
      }
      return stripBOM(fs.readFileSync(tempMd, 'utf8'));
    } finally {
      if (fs.existsSync(tempMd)) fs.unlinkSync(tempMd);
    }
  } else if (['.md', '.markdown', '.txt'].includes(ext)) {
    return stripBOM(fs.readFileSync(filePath, 'utf8'));
  } else {
    throw new Error(`Unsupported file format: ${ext}. Please provide .md, .txt, or .docx`);
  }
}

export function importManuscript(sourcePath, options = {}) {
  if (!sourcePath) {
    console.error('Error: Please specify a file or directory to ingest (e.g. soundingboard ingest draft.md)');
    process.exitCode = 1;
    return { success: false, error: 'No source path specified' };
  }

  const resolvedSource = path.resolve(process.cwd(), sourcePath);
  if (!fs.existsSync(resolvedSource)) {
    console.error(`Error: Source not found: ${resolvedSource}`);
    process.exitCode = 1;
    return { success: false, error: 'File or directory not found' };
  }

  const isDirectory = fs.statSync(resolvedSource).isDirectory();
  const fileList = [];

  if (isDirectory) {
    const entries = fs.readdirSync(resolvedSource).filter(f => /\.(md|markdown|txt|docx)$/i.test(f));
    entries.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    entries.forEach(e => fileList.push(path.join(resolvedSource, e)));
  } else {
    fileList.push(resolvedSource);
  }

  if (fileList.length === 0) {
    console.error('Error: No supported manuscript files (.md, .txt, .docx) found.');
    process.exitCode = 1;
    return { success: false, error: 'No files to ingest' };
  }

  const manifestPath = 'manuscript.json';
  let manifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (_) {
      manifest = {};
    }
  }
  if (!manifest.title) {
    manifest.title = path.basename(resolvedSource, path.extname(resolvedSource)).replace(/[_-]+/g, ' ');
  }
  if (!manifest.schema_version) {
    manifest.schema_version = '2.0.0';
  }
  if (!manifest.chapters) {
    manifest.chapters = [];
  }

  const chaptersDir = path.join('stages', '03_drafting', 'output', 'chapters');
  fs.mkdirSync(chaptersDir, { recursive: true });

  const allImported = [];
  let allHarvestedCanon = [];
  let voiceSeeded = false;

  const chapterHeadingRegex = /^(?:#{1,3})\s+(?:chapter\s+(\d+|[ivxlcdm]+|\w+)[:.]?|(prologue|epilogue)|(\d+)[.:]\s+)(.*)$/i;

  fileList.forEach(singleFile => {
    let markdownText;
    try {
      markdownText = convertFileToMarkdown(singleFile);
    } catch (err) {
      console.error(`\x1b[31mError converting ${singleFile}:\x1b[0m ${err.message}`);
      return;
    }

    const { archivePath } = archiveRawFile(singleFile, options.type || 'drafts');
    const rawHash = calculateFileHash(markdownText);

    const lines = markdownText.split(/\r?\n/);
    const rawChapters = [];
    let currentTitle = '';
    let currentLines = [];
    let currentExplicitNum = null;
    let chapterSubIndex = 0;

    function pushCurrent() {
      if (currentLines.length > 0) {
        const body = currentLines.join('\n').trim();
        if (body.length > 0) {
          chapterSubIndex++;
          rawChapters.push({
            subNum: chapterSubIndex,
            explicitNum: currentExplicitNum,
            title: currentTitle || `Chapter ${chapterSubIndex}`,
            content: body
          });
        }
      }
      currentLines = [];
      currentExplicitNum = null;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(chapterHeadingRegex);
      if (match) {
        pushCurrent();
        currentTitle = line.replace(/^#{1,3}\s+/, '').trim();
        const numStr = match[1] || match[3];
        const pNum = numStr ? parseInt(numStr, 10) : null;
        currentExplicitNum = (!isNaN(pNum) && pNum > 0) ? pNum : null;
      } else {
        currentLines.push(line);
      }
    }
    pushCurrent();

    if (rawChapters.length === 0 && markdownText.trim().length > 0) {
      const baseName = path.basename(singleFile, path.extname(singleFile)).replace(/[_-]+/g, ' ');
      rawChapters.push({
        subNum: 1,
        explicitNum: null,
        title: baseName,
        content: markdownText.trim()
      });
    }

    rawChapters.forEach(ch => {
      let finalContent = ch.content;
      const hasFrontmatter = /^---\r?\n[\s\S]*?\r?\n---/.test(finalContent);

      if (hasFrontmatter && !ch.explicitNum) {
        const fmChMatch = finalContent.match(/^chapter:\s*(\d+)/m);
        if (fmChMatch) {
          ch.explicitNum = parseInt(fmChMatch[1], 10);
        }
      }

      let targetId = options.targetChapter ? parseInt(options.targetChapter, 10) : null;

      // 1. Explicit chapter number from heading or frontmatter
      if (!targetId && ch.explicitNum) {
        targetId = ch.explicitNum;
      }

      // 2. Match prior ingestion in manuscript.json (re-ingest of same file)
      if (!targetId && rawChapters.length === 1) {
        const rawBase = path.basename(singleFile);
        const prior = manifest.chapters.find(c => {
          if (!c.source_raw_file) return false;
          const priorBase = path.basename(c.source_raw_file);
          return c.source_raw_file === archivePath ||
                 priorBase === rawBase ||
                 priorBase.endsWith(`_${rawBase}`);
        });
        if (prior && prior.id) {
          targetId = prior.id;
        }
      }

      // 3. Sequential next chapter
      if (!targetId) {
        targetId = manifest.chapters.length > 0
          ? Math.max(...manifest.chapters.map(c => c.id || 0)) + 1
          : allImported.length + 1;
      }

      const pad = String(targetId).padStart(2, '0');
      const chFilename = `ch${pad}.md`;
      const targetFile = path.join(chaptersDir, chFilename);

      const wordCount = (finalContent.match(/[\w'’-]+/g) || []).length;
      const nowIso = new Date().toISOString();

      if (!hasFrontmatter) {
        const fm = [
          '---',
          `chapter: ${targetId}`,
          `title: "${ch.title.replace(/"/g, '\\"')}"`,
          'status: "imported"',
          `source_raw_file: "${archivePath}"`,
          `source_hash: "${rawHash}"`,
          `ingested_at: "${nowIso}"`,
          `word_count: ${wordCount}`,
          '---',
          ''
        ].join('\n');
        finalContent = fm + finalContent;
      } else {
        // Update frontmatter on re-ingestion
        if (/^source_hash:/m.test(finalContent)) {
          finalContent = finalContent.replace(/^source_hash:\s*.*$/m, `source_hash: "${rawHash}"`);
        } else {
          finalContent = finalContent.replace(/^---/, `---\nsource_hash: "${rawHash}"`);
        }
        if (/^ingested_at:/m.test(finalContent)) {
          finalContent = finalContent.replace(/^ingested_at:\s*.*$/m, `ingested_at: "${nowIso}"`);
        }
        if (/^word_count:/m.test(finalContent)) {
          finalContent = finalContent.replace(/^word_count:\s*.*$/m, `word_count: ${wordCount}`);
        }
        if (/^source_raw_file:/m.test(finalContent)) {
          finalContent = finalContent.replace(/^source_raw_file:\s*.*$/m, `source_raw_file: "${archivePath}"`);
        }
      }

      fs.writeFileSync(targetFile, finalContent, 'utf8');

      const entities = harvestEntitiesFromText(ch.content);
      const addedCanon = seedOrUpdateCanon(entities, targetId, manifest.title);
      if (addedCanon.length > 0) {
        allHarvestedCanon = allHarvestedCanon.concat(addedCanon);
      }

      if (!voiceSeeded) {
        voiceSeeded = seedVoiceExemplars(ch.content, manifest.title);
      }

      const chapterEntry = {
        id: targetId,
        title: ch.title,
        draft_file: path.join('stages', '03_drafting', 'output', 'chapters', chFilename).replace(/\\/g, '/'),
        source_raw_file: archivePath,
        status: 'imported',
        words: wordCount,
        last_audit: null
      };

      const existingIdx = manifest.chapters.findIndex(c => c.id === targetId);
      if (existingIdx !== -1) {
        manifest.chapters[existingIdx] = chapterEntry;
      } else {
        manifest.chapters.push(chapterEntry);
      }

      allImported.push(chapterEntry);
    });
  });

  manifest.chapters.sort((a, b) => a.id - b.id);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  // Maintain backward-compatible output message for existing tests
  console.log(`\n\x1b[32m✔ Successfully imported ${allImported.length} chapter(s) from "${path.basename(resolvedSource)}"\x1b[0m`);
  console.log(`  Destination: ${chaptersDir}/`);
  console.log(`  Registered in manuscript.json with status: "imported"`);

  // Sounding Board Debrief
  console.log(`\n\x1b[1m\x1b[35m=== Sounding Board Debrief ===\x1b[0m`);
  console.log(`📁 \x1b[1mRaw Vault Snapshot:\x1b[0m Preserved in inputs/`);
  console.log(`📖 \x1b[1mChapters Ingested:\x1b[0m ${allImported.length} chapter(s) registered`);
  allImported.forEach(c => {
    console.log(`   • ch ${String(c.id).padStart(2)}: "${c.title}" (${c.words.toLocaleString()} words)`);
  });

  if (allHarvestedCanon.length > 0) {
    const uniqueEntities = Array.from(new Set(allHarvestedCanon));
    console.log(`🧠 \x1b[1mCanon Entities Harvested:\x1b[0m ${uniqueEntities.slice(0, 8).join(', ')}${uniqueEntities.length > 8 ? ` (+${uniqueEntities.length - 8} more)` : ''}`);
    console.log(`   → Appended to stages/02_planning/output/canon.md as [unverified]`);
  }

  if (voiceSeeded) {
    console.log(`🎙️ \x1b[1mVoice Exemplars:\x1b[0m Seeded in stages/02_planning/output/voice_exemplars.md`);
  }

  console.log(`\x1b[36mNext action:\x1b[0m Write your next chapter in your favorite editor, or run:`);
  console.log(`  • "node scripts/soundingboard.js status" to review the manuscript ledger`);
  console.log(`  • "node scripts/soundingboard.js canon query <entity>" to verify facts\n`);

  return {
    success: true,
    chaptersCount: allImported.length,
    chapters: allImported,
    harvestedEntities: allHarvestedCanon
  };
}

export function ingestManuscript(sourcePath, options = {}) {
  return importManuscript(sourcePath, options);
}
