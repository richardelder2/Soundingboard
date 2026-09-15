/**
 * Soundingboard 2.0 - Git & Creative History Engine
 *
 * Core philosophy:
 * "Soundingboard files contain the meaning. Git records the evolution."
 *
 * Git is the historical layer over the file-first creative workspace,
 * never a competing database or source of truth. The human author retains
 * complete creative authority. Commits and pushes occur only when authorized
 * by the author.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { parse, strip } from './frontmatter.js';

/**
 * Checks if a directory is inside a Git repository.
 * @param {string} [rootDir=process.cwd()]
 * @returns {boolean}
 */
export function isGitRepository(rootDir = process.cwd()) {
  try {
    const out = execSync('git rev-parse --is-inside-work-tree', {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return out === 'true';
  } catch (_) {
    return false;
  }
}

/**
 * Executes a Git command safely, returning output or null on failure.
 * @param {string} command
 * @param {string} [rootDir=process.cwd()]
 * @returns {string|null}
 */
export function runGit(command, rootDir = process.cwd()) {
  try {
    return execSync(`git ${command}`, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (err) {
    return null;
  }
}

/**
 * Returns basic Git status information for the workspace.
 * @param {string} [rootDir=process.cwd()]
 */
export function getGitStatus(rootDir = process.cwd()) {
  if (!isGitRepository(rootDir)) {
    return {
      isRepo: false,
      branch: null,
      isClean: false,
      hasCommits: false,
      unpushedCommits: 0,
      remotes: []
    };
  }

  let branch = runGit('branch --show-current', rootDir);
  if (!branch) {
    // Might be detached HEAD or empty repo
    const rev = runGit('rev-parse --short HEAD', rootDir);
    branch = rev ? `HEAD (${rev})` : 'main (unborn)';
  }

  let hasCommits = false;
  try {
    execSync('git rev-parse --verify HEAD', {
      cwd: rootDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    hasCommits = true;
  } catch (_) {
    hasCommits = false;
  }

  const porcelain = runGit('status --porcelain', rootDir) || '';
  const isClean = porcelain.trim().length === 0;

  let unpushedCommits = 0;
  if (hasCommits) {
    try {
      const upstream = runGit('rev-parse --abbrev-ref @{u}', rootDir);
      if (upstream) {
        const countStr = runGit(`rev-list --count ${upstream}..HEAD`, rootDir);
        unpushedCommits = parseInt(countStr || '0', 10);
      }
    } catch (_) {
      // Upstream might not be configured
    }
  }

  const remotesRaw = runGit('remote -v', rootDir) || '';
  const remotes = Array.from(
    new Set(
      remotesRaw
        .split('\n')
        .map(l => l.split(/\s+/)[0])
        .filter(Boolean)
    )
  );

  return {
    isRepo: true,
    branch,
    isClean,
    hasCommits,
    unpushedCommits,
    remotes
  };
}

/**
 * Technical integrity verification:
 * Verifies YAML validity on all scene and chapter files, checks for duplicate scene IDs,
 * and validates that chapter playlists reference real scene files.
 *
 * NOTE: This is strictly TECHNICAL INTEGRITY (syntactic correctness and reference validity).
 * It NEVER flags or blocks on creative uncertainty (AI tells, pacing, motivation, etc.).
 *
 * @param {string} [rootDir=process.cwd()]
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function verifyTechnicalIntegrity(rootDir = process.cwd()) {
  const errors = [];
  const warnings = [];

  const msDir = path.join(rootDir, 'manuscript');
  if (!fs.existsSync(msDir)) {
    return { valid: true, errors, warnings };
  }

  const seenSceneIds = new Map(); // id -> filePath

  // 1. Scan scenes pool: manuscript/scenes/
  const poolDir = path.join(msDir, 'scenes');
  if (fs.existsSync(poolDir)) {
    const sceneFiles = fs.readdirSync(poolDir).filter(f => /^sc-.*\.md$/i.test(f));
    for (const file of sceneFiles) {
      const filePath = path.join(poolDir, file);
      const raw = fs.readFileSync(filePath, 'utf8');
      try {
        const meta = parse(raw, filePath);
        if (meta.id) {
          if (seenSceneIds.has(meta.id)) {
            errors.push(`Duplicate scene ID "${meta.id}" in ${file} (previously seen in ${path.basename(seenSceneIds.get(meta.id))})`);
          } else {
            seenSceneIds.set(meta.id, filePath);
          }
        }
      } catch (err) {
        errors.push(`Malformed YAML frontmatter in scene file ${path.relative(rootDir, filePath)}: ${err.message}`);
      }
    }
  }

  // 2. Scan chapter playlists: manuscript/chapters/ or legacy manuscript/ch-XX/
  const chPoolDir = path.join(msDir, 'chapters');
  const chapterDirs = fs.existsSync(chPoolDir)
    ? fs.readdirSync(chPoolDir).filter(f => /^ch-.*\.md$/i.test(f)).map(f => path.join(chPoolDir, f))
    : [];

  // Also check legacy folder-based chapters
  const legacyDirs = fs.readdirSync(msDir)
    .filter(d => /^ch-\d+/i.test(d) && fs.statSync(path.join(msDir, d)).isDirectory())
    .map(d => path.join(msDir, d, 'chapter.md'))
    .filter(p => fs.existsSync(p));

  const allChapterFiles = [...chapterDirs, ...legacyDirs];

  for (const chPath of allChapterFiles) {
    const raw = fs.readFileSync(chPath, 'utf8');
    let meta = {};
    try {
      meta = parse(raw, chPath);
    } catch (err) {
      errors.push(`Malformed YAML frontmatter in chapter playlist ${path.relative(rootDir, chPath)}: ${err.message}`);
      continue;
    }

    // Check referenced scenes exist
    if (Array.isArray(meta.scenes)) {
      for (const scId of meta.scenes) {
        const directCandidate = path.join(poolDir, `${scId}.md`);
        const legacyCandidate = path.join(path.dirname(chPath), `${scId}.md`);
        if (!fs.existsSync(directCandidate) && !fs.existsSync(legacyCandidate)) {
          errors.push(`Chapter playlist ${path.basename(chPath)} references missing scene "${scId}"`);
        }
      }
    }
  }

  // Also check root preferences.md if present
  const prefPath = path.join(rootDir, 'preferences.md');
  if (fs.existsSync(prefPath)) {
    try {
      parse(fs.readFileSync(prefPath, 'utf8'), prefPath);
    } catch (err) {
      errors.push(`Malformed YAML frontmatter in preferences.md: ${err.message}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Analyzes creative changes in the working tree (or between commits).
 * Categorizes changes into creative concepts:
 * - Revised scenes (prose changes vs metadata changes)
 * - Moved scenes (chapter playlist modifications)
 * - Resolved brackets / new bracket notes
 * - Canon updates
 * - Writer's Room activity
 *
 * @param {string} [rootDir=process.cwd()]
 * @param {{ baseRef?: string }} [options]
 */
export function analyzeCreativeChanges(rootDir = process.cwd(), options = {}) {
  if (!isGitRepository(rootDir)) {
    return {
      isRepo: false,
      scenesRevised: [],
      scenesMoved: [],
      bracketsResolvedCount: 0,
      canonUpdated: false,
      canonChanges: [],
      writersRoomFiles: [],
      otherFiles: [],
      suggestedType: 'checkpoint',
      suggestedMessage: 'checkpoint: creative progress snapshot'
    };
  }

  const baseRef = options.baseRef || 'HEAD';
  let diffFilesRaw = '';
  let hasHead = false;
  try {
    execSync('git rev-parse --verify HEAD', { cwd: rootDir, stdio: ['pipe', 'pipe', 'pipe'] });
    hasHead = true;
  } catch (_) {
    hasHead = false;
  }

  if (hasHead) {
    diffFilesRaw = runGit(`diff --name-status ${baseRef}`, rootDir) || '';
    // Also include untracked files
    const untracked = runGit('status --porcelain', rootDir) || '';
    untracked.split('\n').forEach(line => {
      if (line.startsWith('?? ')) {
        diffFilesRaw += `\nA\t${line.slice(3).trim()}`;
      }
    });
  } else {
    // Initial commit scenario
    const untracked = runGit('status --porcelain', rootDir) || '';
    untracked.split('\n').forEach(line => {
      const p = line.slice(3).trim();
      if (p) diffFilesRaw += `\nA\t${p}`;
    });
  }

  const lines = diffFilesRaw.split('\n').map(l => l.trim()).filter(Boolean);

  const scenesRevised = [];
  const scenesMoved = [];
  let bracketsResolvedCount = 0;
  let canonUpdated = false;
  const canonChanges = [];
  const writersRoomFiles = [];
  const otherFiles = [];

  for (const line of lines) {
    const parts = line.split(/\t+/);
    const status = parts[0] || '';
    const filePath = parts[1] || '';
    const norm = filePath.replace(/\\/g, '/');

    // 1. Scene files in manuscript/scenes/
    if (norm.startsWith('manuscript/scenes/') && norm.endsWith('.md')) {
      const scId = path.basename(norm, '.md');
      // Inspect whether prose, metadata, or brackets changed
      let proseChanged = false;
      let metaChanged = false;
      let bracketsInFile = 0;

      if (fs.existsSync(path.join(rootDir, filePath))) {
        const fullContent = fs.readFileSync(path.join(rootDir, filePath), 'utf8');
        const bracketMatches = fullContent.match(/\[(PRESERVE|CUT|REORDER|STRUCTURAL NOTE|DRAFT SUGGESTION|CRAFT NOTE|AI-TELL)[^\]]*\]/gi);
        if (bracketMatches) {
          bracketsInFile = bracketMatches.length;
        }
      }

      if (hasHead && status === 'M') {
        try {
          const oldContent = runGit(`show HEAD:"${filePath}"`, rootDir) || '';
          const newContent = fs.existsSync(path.join(rootDir, filePath))
            ? fs.readFileSync(path.join(rootDir, filePath), 'utf8')
            : '';

          const oldProse = strip(oldContent).trim();
          const newProse = strip(newContent).trim();
          proseChanged = oldProse !== newProse;

          let oldMeta = {};
          let newMeta = {};
          try { oldMeta = parse(oldContent, filePath); } catch (_) {}
          try { newMeta = parse(newContent, filePath); } catch (_) {}
          metaChanged = JSON.stringify(oldMeta) !== JSON.stringify(newMeta);

          // Check brackets resolved: if old had brackets that are gone in new
          const oldBrackets = (oldContent.match(/\[(PRESERVE|CUT|REORDER|STRUCTURAL NOTE|DRAFT SUGGESTION|CRAFT NOTE|AI-TELL)[^\]]*\]/gi) || []).length;
          const newBrackets = (newContent.match(/\[(PRESERVE|CUT|REORDER|STRUCTURAL NOTE|DRAFT SUGGESTION|CRAFT NOTE|AI-TELL)[^\]]*\]/gi) || []).length;
          if (oldBrackets > newBrackets) {
            bracketsResolvedCount += (oldBrackets - newBrackets);
          }
        } catch (_) {
          proseChanged = true;
        }
      } else {
        proseChanged = true;
      }

      scenesRevised.push({
        id: scId,
        path: filePath,
        status: status.startsWith('A') ? 'added' : status.startsWith('D') ? 'deleted' : 'modified',
        proseChanged,
        metaChanged,
        activeBrackets: bracketsInFile
      });
      continue;
    }

    // 2. Chapter playlists (structural changes)
    if ((norm.startsWith('manuscript/chapters/') || /^manuscript\/ch-\d+\/chapter\.md$/i.test(norm)) && norm.endsWith('.md')) {
      const chId = path.basename(norm, '.md');
      if (hasHead && status === 'M') {
        try {
          const oldContent = runGit(`show HEAD:"${filePath}"`, rootDir) || '';
          const newContent = fs.existsSync(path.join(rootDir, filePath))
            ? fs.readFileSync(path.join(rootDir, filePath), 'utf8')
            : '';
          let oldMeta = {};
          let newMeta = {};
          try { oldMeta = parse(oldContent, filePath); } catch (_) {}
          try { newMeta = parse(newContent, filePath); } catch (_) {}

          const oldScenes = Array.isArray(oldMeta.scenes) ? oldMeta.scenes : [];
          const newScenes = Array.isArray(newMeta.scenes) ? newMeta.scenes : [];
          if (JSON.stringify(oldScenes) !== JSON.stringify(newScenes)) {
            scenesMoved.push({
              chapter: chId,
              path: filePath,
              before: oldScenes,
              after: newScenes
            });
          }
        } catch (_) {}
      } else {
        scenesMoved.push({ chapter: chId, path: filePath });
      }
      continue;
    }

    // 3. Canon files
    if (norm.includes('canon.md')) {
      canonUpdated = true;
      canonChanges.push(filePath);
      continue;
    }

    // 4. Writer's Room
    if (norm.startsWith('writers_room/')) {
      writersRoomFiles.push(filePath);
      continue;
    }

    // 5. Other files (outlines, character cards, preferences, etc.)
    otherFiles.push(filePath);
  }

  // Determine suggested commit type & message
  let suggestedType = 'checkpoint';
  let suggestedMessage = 'checkpoint: creative progress snapshot';

  if (scenesMoved.length > 0 && scenesRevised.length === 0) {
    suggestedType = 'experiment';
    suggestedMessage = `experiment: reorder scenes across ${scenesMoved.map(m => m.chapter).join(', ')}`;
  } else if (bracketsResolvedCount > 0 && scenesRevised.length > 0) {
    suggestedType = 'revision';
    suggestedMessage = `revision: resolve editorial brackets in ${scenesRevised.map(s => s.id).slice(0, 2).join(', ')}`;
  } else if (scenesRevised.length === 1 && scenesRevised[0].status === 'added') {
    suggestedType = 'scene';
    suggestedMessage = `scene(${scenesRevised[0].id}): complete first draft`;
  } else if (scenesRevised.length === 1) {
    suggestedType = 'scene';
    suggestedMessage = `scene(${scenesRevised[0].id}): revise scene draft`;
  } else if (scenesRevised.length > 1) {
    suggestedType = 'revision';
    suggestedMessage = `revision: update scenes ${scenesRevised.slice(0, 3).map(s => s.id).join(', ')}`;
  } else if (canonUpdated && scenesRevised.length === 0) {
    suggestedType = 'milestone';
    suggestedMessage = 'milestone: update narrative canon and lore entries';
  } else if (writersRoomFiles.length > 0 && scenesRevised.length === 0) {
    suggestedType = 'checkpoint';
    suggestedMessage = `checkpoint: update writer's room notes and draft explorations`;
  }

  return {
    isRepo: true,
    scenesRevised,
    scenesMoved,
    bracketsResolvedCount,
    canonUpdated,
    canonChanges,
    writersRoomFiles,
    otherFiles,
    suggestedType,
    suggestedMessage
  };
}

/**
 * Formats creative changes into a warm, author-friendly summary string.
 * @param {ReturnType<typeof analyzeCreativeChanges>} summary
 * @returns {string}
 */
export function formatCreativeSummary(summary) {
  if (!summary.isRepo) {
    return 'Git repository is not initialized. Run `soundingboard doctor --fix` to initialize.';
  }

  const lines = [];
  lines.push('Soundingboard Creative History Summary');
  lines.push('─────────────────────────────────────────');

  const totalChanges =
    summary.scenesRevised.length +
    summary.scenesMoved.length +
    summary.bracketsResolvedCount +
    (summary.canonUpdated ? 1 : 0) +
    summary.writersRoomFiles.length +
    summary.otherFiles.length;

  if (totalChanges === 0) {
    lines.push('Working tree is clean. No uncommitted creative changes.');
    return lines.join('\n');
  }

  lines.push('Since your last checkpoint:');
  if (summary.scenesRevised.length > 0) {
    const proseCount = summary.scenesRevised.filter(s => s.proseChanged).length;
    const metaCount = summary.scenesRevised.filter(s => s.metaChanged && !s.proseChanged).length;
    const addedCount = summary.scenesRevised.filter(s => s.status === 'added').length;

    let detail = `${summary.scenesRevised.length} scene(s) modified`;
    if (addedCount > 0) detail += ` (${addedCount} new)`;
    if (proseCount > 0) detail += ` [${proseCount} prose updates]`;
    if (metaCount > 0) detail += ` [${metaCount} frontmatter updates]`;
    lines.push(`  • ${detail}: ${summary.scenesRevised.map(s => s.id).join(', ')}`);
  }

  if (summary.scenesMoved.length > 0) {
    lines.push(`  • ${summary.scenesMoved.length} chapter playlist(s) restructured: ${summary.scenesMoved.map(m => m.chapter).join(', ')}`);
  }

  if (summary.bracketsResolvedCount > 0) {
    lines.push(`  • ${summary.bracketsResolvedCount} editorial bracket(s) resolved`);
  }

  if (summary.canonUpdated) {
    lines.push(`  • Narrative canon updated (${summary.canonChanges.map(c => path.basename(c)).join(', ')})`);
  }

  if (summary.writersRoomFiles.length > 0) {
    lines.push(`  • ${summary.writersRoomFiles.length} Writer's Room file(s) updated`);
  }

  if (summary.otherFiles.length > 0) {
    lines.push(`  • ${summary.otherFiles.length} other project file(s) modified`);
  }

  lines.push('');
  lines.push(`Suggested commit:`);
  lines.push(`  \x1b[36m${summary.suggestedMessage}\x1b[0m`);

  return lines.join('\n');
}

/**
 * Creates a checkpoint commit after validating technical integrity.
 * Commits ONLY when requested.
 *
 * @param {string} [rootDir=process.cwd()]
 * @param {{ message?: string, allowDirty?: boolean }} [options]
 * @returns {{ success: boolean, commitHash?: string, error?: string, integrityErrors?: string[] }}
 */
export function createCheckpointCommit(rootDir = process.cwd(), options = {}) {
  if (!isGitRepository(rootDir)) {
    return { success: false, error: 'Directory is not a Git repository.' };
  }

  // 1. Verify technical integrity first
  const integrity = verifyTechnicalIntegrity(rootDir);
  if (!integrity.valid) {
    return {
      success: false,
      error: 'Technical integrity check failed. Fix structural errors before committing.',
      integrityErrors: integrity.errors
    };
  }

  // 2. Stage files
  try {
    execSync('git add -A', { cwd: rootDir, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err) {
    return { success: false, error: `Failed to stage files: ${err.message}` };
  }

  // 3. Determine commit message
  let message = options.message;
  if (!message) {
    const analysis = analyzeCreativeChanges(rootDir);
    message = analysis.suggestedMessage || 'checkpoint: creative progress snapshot';
  }

  // Escape double quotes for shell execution
  const escapedMessage = message.replace(/"/g, '\\"');

  try {
    execSync(`git commit -m "${escapedMessage}"`, { cwd: rootDir, stdio: ['pipe', 'pipe', 'pipe'] });
    const commitHash = runGit('rev-parse --short HEAD', rootDir) || 'unknown';
    return { success: true, commitHash };
  } catch (err) {
    const status = runGit('status --porcelain', rootDir);
    if (!status || status.trim().length === 0) {
      return { success: false, error: 'Nothing to commit, working tree clean.' };
    }
    return { success: false, error: `Git commit failed: ${err.message}` };
  }
}

/**
 * Summarizes outgoing changes for a push operation.
 * @param {string} [rootDir=process.cwd()]
 */
export function getPushSummary(rootDir = process.cwd()) {
  const status = getGitStatus(rootDir);
  if (!status.isRepo) {
    return { canPush: false, reason: 'Not a Git repository.' };
  }

  if (status.remotes.length === 0) {
    return {
      canPush: false,
      reason: 'No remote repository configured. Set an upstream remote with `git remote add origin <url>`.'
    };
  }

  const branch = status.branch;
  let aheadCount = 0;
  let commitLog = [];

  try {
    const upstream = runGit('rev-parse --abbrev-ref @{u}', rootDir);
    if (upstream) {
      const rawCount = runGit(`rev-list --count ${upstream}..HEAD`, rootDir);
      aheadCount = parseInt(rawCount || '0', 10);
      if (aheadCount > 0) {
        const rawLog = runGit(`log --oneline -n ${aheadCount} ${upstream}..HEAD`, rootDir) || '';
        commitLog = rawLog.split('\n').filter(Boolean);
      }
    } else {
      // If no upstream tracking branch yet, count all commits on this branch
      const rawCount = runGit(`rev-list --count HEAD`, rootDir);
      aheadCount = parseInt(rawCount || '0', 10);
      const rawLog = runGit(`log --oneline -n 5`, rootDir) || '';
      commitLog = rawLog.split('\n').filter(Boolean);
    }
  } catch (_) {
    aheadCount = 1;
  }

  return {
    canPush: true,
    branch,
    remote: status.remotes[0] || 'origin',
    unpushedCommits: aheadCount,
    commitLog
  };
}

/**
 * Compares two branches for structural differences (scene ordering, chapter lists)
 * without making creative judgments.
 *
 * @param {string} [rootDir=process.cwd()]
 * @param {string} branchA
 * @param {string} [branchB='HEAD']
 */
export function compareExperiments(rootDir = process.cwd(), branchA, branchB = 'HEAD') {
  if (!isGitRepository(rootDir)) {
    return { error: 'Not a Git repository.' };
  }

  const diffOutput = runGit(`diff --name-status ${branchA}..${branchB}`, rootDir) || '';
  const lines = diffOutput.split('\n').filter(Boolean);

  const changedScenes = [];
  const changedChapters = [];

  lines.forEach(l => {
    const [status, filePath] = l.split(/\t+/);
    if (!filePath) return;
    const norm = filePath.replace(/\\/g, '/');
    if (norm.startsWith('manuscript/scenes/')) {
      changedScenes.push({ id: path.basename(norm, '.md'), status });
    } else if (norm.startsWith('manuscript/chapters/')) {
      changedChapters.push({ id: path.basename(norm, '.md'), status });
    }
  });

  return {
    branchA,
    branchB,
    changedScenes,
    changedChapters,
    totalFilesChanged: lines.length
  };
}
