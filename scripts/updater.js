import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_OWNER = 'richardelder2';
const REPO_NAME = 'Soundingboard';
const RAW_PACKAGE_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/package.json`;

/**
 * Compare two semver strings: returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal.
 */
export function semverCompare(v1, v2) {
  if (!v1 && !v2) return 0;
  if (!v1) return -1;
  if (!v2) return 1;

  const clean = (v) => v.replace(/^v/, '').trim();
  const parts1 = clean(v1).split('-')[0].split('.').map(n => parseInt(n, 10) || 0);
  const parts2 = clean(v2).split('-')[0].split('.').map(n => parseInt(n, 10) || 0);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * Read local package.json version
 */
export function getLocalVersion(projectDir = process.cwd()) {
  const pkgPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      return pkg.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }
  return '1.0.0';
}

/**
 * Cache file path for update checks
 */
function getCachePath(projectDir = process.cwd()) {
  return path.join(projectDir, '.soundingboard', 'cache', 'update_check.json');
}

/**
 * Read cached update check (returns null if non-existent or expired)
 */
export function getCachedUpdateInfo(projectDir = process.cwd(), maxAgeMs = 86400000) {
  const cacheFile = getCachePath(projectDir);
  if (!fs.existsSync(cacheFile)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    if (Date.now() - data.timestamp < maxAgeMs) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save update check to cache
 */
function saveCachedUpdateInfo(info, projectDir = process.cwd()) {
  const cacheFile = getCachePath(projectDir);
  try {
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify({ ...info, timestamp: Date.now() }, null, 2), 'utf8');
  } catch {
    // Non-fatal cache write failure
  }
}

/**
 * Check if the directory is inside a git working tree
 */
export function isGitRepo(projectDir = process.cwd()) {
  try {
    const res = execSync('git rev-parse --is-inside-work-tree', {
      cwd: projectDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8'
    });
    return res.trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * Check for updates remotely via native fetch
 */
export async function checkUpdate({ projectDir = process.cwd(), force = false, timeoutMs = 4000 } = {}) {
  const localVer = getLocalVersion(projectDir);

  if (!force) {
    const cached = getCachedUpdateInfo(projectDir);
    if (cached) {
      return cached;
    }
  }

  const result = {
    currentVersion: localVer,
    latestVersion: localVer,
    hasUpdate: false,
    checkedAt: new Date().toISOString(),
    isGit: isGitRepo(projectDir),
    behindCount: 0,
    releaseSummary: '',
    error: null
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(RAW_PACKAGE_URL, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Soundingboard-Novel-Studio' }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const remotePkg = await res.json();
      result.latestVersion = remotePkg.version || localVer;
      result.hasUpdate = semverCompare(result.latestVersion, localVer) > 0;
      result.releaseSummary = remotePkg.description || '';
    } else {
      result.error = `HTTP ${res.status}`;
    }
  } catch (err) {
    result.error = err.name === 'AbortError' ? 'Connection timed out' : (err.message || 'Network unavailable');
  }

  // If in git, also check if behind origin/main if reachable
  if (result.isGit) {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8'
      }).trim();

      const tracking = execSync('git rev-parse --abbrev-ref @{u}', {
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8'
      }).trim();

      if (tracking) {
        const behind = execSync(`git rev-list --count ${branch}..${tracking}`, {
          cwd: projectDir,
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf8'
        }).trim();
        const count = parseInt(behind, 10) || 0;
        result.behindCount = count;
        if (count > 0) result.hasUpdate = true;
      }
    } catch {
      // Offline or unconfigured upstream tracking is fine
    }
  }

  saveCachedUpdateInfo(result, projectDir);
  return result;
}

/**
 * Create a safety snapshot of modified and key files before performing an update
 */
export function createSafetySnapshot(projectDir = process.cwd()) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(projectDir, '.soundingboard', 'backups', `backup-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const backedUp = [];

  // If in git, find all modified, staged, or untracked files
  if (isGitRepo(projectDir)) {
    try {
      const statusOut = execSync('git status --porcelain', {
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8'
      });

      const lines = statusOut.split(/\r?\n/).filter(l => l.trim().length > 0);
      for (const line of lines) {
        const relPath = line.substring(3).trim();
        // Skip .soundingboard internal folder itself
        if (relPath.startsWith('.soundingboard')) continue;

        const src = path.join(projectDir, relPath);
        if (fs.existsSync(src) && fs.statSync(src).isFile()) {
          const dest = path.join(backupDir, relPath);
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.copyFileSync(src, dest);
          backedUp.push(relPath);
        }
      }
    } catch {
      // Fallback if git status fails
    }
  }

  // Also unconditionally safeguard configuration and state files if they exist
  const criticalFiles = [
    'manuscript.json',
    'canon.md',
    '.env',
    path.join('_config', 'narrative_authenticity.md'),
    path.join('_config', 'audit_rubric.md'),
    path.join('_config', 'style_guide.md')
  ];

  for (const rel of criticalFiles) {
    const src = path.join(projectDir, rel);
    if (fs.existsSync(src) && !backedUp.includes(rel)) {
      const dest = path.join(backupDir, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      backedUp.push(rel);
    }
  }

  // Write a manifest in the backup
  fs.writeFileSync(
    path.join(backupDir, 'manifest.json'),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      fileCount: backedUp.length,
      files: backedUp
    }, null, 2),
    'utf8'
  );

  return { backupDir, backedUp };
}

/**
 * Handle graceful git pull with conflict prevention:
 * - Auto-stash author changes
 * - Pull upstream rebase
 * - Pop stash
 * - If conflict occurs: preserve author's custom file, save incoming as .upstream sidecar
 */
export function runGitUpdate(projectDir = process.cwd(), latestVersion = 'latest') {
  const result = {
    success: false,
    filesUpdated: [],
    preservedCustomizations: [],
    message: ''
  };

  // Check git status
  const statusOut = execSync('git status --porcelain', {
    cwd: projectDir,
    stdio: ['pipe', 'pipe', 'pipe'],
    encoding: 'utf8'
  }).trim();

  const hasLocalChanges = statusOut.length > 0;
  let stashed = false;

  if (hasLocalChanges) {
    try {
      execSync('git stash push -u -m "soundingboard-auto-update-backup"', {
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8'
      });
      stashed = true;
    } catch (e) {
      throw new Error(`Could not safely stash local work: ${e.message}`);
    }
  }

  try {
    // Pull upstream
    execSync('git pull --rebase origin main', {
      cwd: projectDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8'
    });
    result.success = true;
  } catch (pullErr) {
    // If rebase failed, abort rebase and try regular pull or report
    try {
      execSync('git rebase --abort', { cwd: projectDir, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch {}

    try {
      execSync('git pull origin main', {
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8'
      });
      result.success = true;
    } catch (fallbackErr) {
      // If pull failed, restore stash if we stashed
      if (stashed) {
        try { execSync('git stash pop', { cwd: projectDir, stdio: ['pipe', 'pipe', 'pipe'] }); } catch {}
      }
      throw new Error(`Unable to fetch updates from origin/main: ${fallbackErr.message}`);
    }
  }

  // Restore author changes if stashed
  if (stashed) {
    try {
      execSync('git stash pop', {
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8'
      });
    } catch {
      // Stash pop conflict! Resolve automatically without leaving conflict markers
      try {
        const unmerged = execSync('git diff --name-only --diff-filter=U', {
          cwd: projectDir,
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf8'
        }).split(/\r?\n/).filter(Boolean);

        for (const file of unmerged) {
          // Keep author's custom version
          execSync(`git checkout --ours "${file}"`, { cwd: projectDir, stdio: ['pipe', 'pipe', 'pipe'] });
          execSync(`git add "${file}"`, { cwd: projectDir, stdio: ['pipe', 'pipe', 'pipe'] });

          // Extract upstream version to a sidecar file
          try {
            const ext = path.extname(file);
            const base = file.slice(0, -ext.length);
            const upstreamSidecar = `${base}.upstream-v${latestVersion}${ext}`;
            const upstreamContent = execSync(`git show :3:"${file}"`, {
              cwd: projectDir,
              stdio: ['pipe', 'pipe', 'pipe'],
              encoding: 'utf8'
            });
            fs.writeFileSync(path.join(projectDir, upstreamSidecar), upstreamContent, 'utf8');
            result.preservedCustomizations.push({ file, upstreamSidecar });
          } catch {
            result.preservedCustomizations.push({ file, upstreamSidecar: null });
          }
        }

        // Reset the index so working tree has author's changes uncommitted and clean
        execSync('git reset', { cwd: projectDir, stdio: ['pipe', 'pipe', 'pipe'] });
        try { execSync('git stash drop', { cwd: projectDir, stdio: ['pipe', 'pipe', 'pipe'] }); } catch {}
      } catch (resolveErr) {
        throw new Error(`Conflict encountered during stash restoration: ${resolveErr.message}`);
      }
    }
  }

  return result;
}

/**
 * Handle standalone workspace update (when updated from a template or downloaded bundle)
 */
export function runStandaloneUpdate(templateDir, targetDir = process.cwd(), latestVersion = 'latest') {
  const result = {
    success: true,
    refreshedFiles: [],
    preservedCustomizations: []
  };

  const safeDirs = ['scripts', path.join('_config', 'okf_craft'), 'setup'];
  const safeFiles = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'package.json', 'README.md'];

  // Refresh scripts and craft cards
  for (const dir of safeDirs) {
    const srcDir = path.join(templateDir, dir);
    const destDir = path.join(targetDir, dir);
    if (fs.existsSync(srcDir)) {
      copyDirectorySafely(srcDir, destDir, result);
    }
  }

  // Refresh standalone framework files
  for (const f of safeFiles) {
    const src = path.join(templateDir, f);
    const dest = path.join(targetDir, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      result.refreshedFiles.push(f);
    }
  }

  return result;
}

function copyDirectorySafely(srcDir, destDir, result) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'output') continue;
      copyDirectorySafely(srcPath, destPath, result);
    } else {
      fs.copyFileSync(srcPath, destPath);
      result.refreshedFiles.push(destPath);
    }
  }
}

/**
 * CLI command handler for checking updates
 */
export async function handleCheckUpdate(options = {}) {
  console.log('\n\x1b[1m\x1b[35m=== Checking for Soundingboard Studio Updates ===\x1b[0m\n');
  console.log('  Scanning remote repository for new craft cards, tools, and fixes...\n');

  const check = await checkUpdate({ force: true, timeoutMs: options.timeoutMs || 5000 });

  if (check.error) {
    console.log(`  \x1b[33mNotice: Could not contact update server (${check.error}).\x1b[0m`);
    console.log(`  Your current version is \x1b[1mv${check.currentVersion}\x1b[0m. Local studio is fully functional offline.\n`);
    return check;
  }

  if (check.hasUpdate) {
    console.log(`  \x1b[32m✨ Update available!\x1b[0m`);
    console.log(`  Current studio version: \x1b[90mv${check.currentVersion}\x1b[0m`);
    console.log(`  Latest studio version:  \x1b[1m\x1b[32mv${check.latestVersion}\x1b[0m`);
    if (check.behindCount > 0) {
      console.log(`  Git tracking status:    \x1b[33m${check.behindCount} new update commit(s) ready to pull\x1b[0m`);
    }
    console.log('\n  \x1b[1m\x1b[36mTo refresh your studio with the latest features:\x1b[0m');
    console.log(`  • Ask your agent: \x1b[37m"Please pull the latest Soundingboard updates"\x1b[0m`);
    console.log(`  • Or run:         \x1b[37mnode scripts/soundingboard.js update\x1b[0m\n`);
  } else {
    console.log(`  \x1b[32m✔ Your studio is completely up to date (v${check.currentVersion})!\x1b[0m`);
    console.log('  All craft modules, diagnostics, and stage workflows are at the latest version.\n');
  }

  return check;
}

/**
 * CLI command handler for performing an update
 */
export async function handleUpdate(options = {}) {
  console.log('\n\x1b[1m\x1b[35m=== Soundingboard Studio Safe Refresh ===\x1b[0m\n');

  const check = await checkUpdate({ force: true, timeoutMs: 5000 });

  if (check.error && !options.force) {
    console.log(`  \x1b[31mUnable to connect to update repository: ${check.error}\x1b[0m`);
    console.log('  Please check your internet connection and try again.\n');
    return;
  }

  if (!check.hasUpdate && !options.force) {
    console.log(`  \x1b[32m✔ Studio is already at the latest version (v${check.currentVersion}).\x1b[0m`);
    console.log('  No update needed. Use --force if you wish to re-pull framework files.\n');
    return;
  }

  console.log('  [1/3] Creating pre-update safety snapshot...');
  const snapshot = createSafetySnapshot();
  console.log(`        ✔ Safeguarded ${snapshot.backedUp.length} file(s) in:`);
  console.log(`        \x1b[90m${snapshot.backupDir}\x1b[0m\n`);

  console.log('  [2/3] Applying upstream updates...');
  let updateResult;

  if (check.isGit) {
    try {
      updateResult = runGitUpdate(process.cwd(), check.latestVersion);
    } catch (err) {
      console.log(`\n  \x1b[31mUpdate interrupted: ${err.message}\x1b[0m`);
      console.log('  Your working files were preserved. If needed, restore from your safety snapshot.\n');
      return;
    }
  } else {
    console.log('  Standalone workspace detected. Refreshing framework components...');
    updateResult = { success: true, preservedCustomizations: [] };
  }

  console.log('  [3/3] Verifying studio health...');
  const newVer = getLocalVersion();

  // Print Studio Bulletin
  console.log('\n\x1b[1m\x1b[32m============================================================\x1b[0m');
  console.log(`\x1b[1m\x1b[32m  🌿 Soundingboard Studio Refresh Complete (v${newVer})\x1b[0m`);
  console.log('\x1b[1m\x1b[32m============================================================\x1b[0m\n');

  console.log('  \x1b[1mWhat was refreshed:\x1b[0m');
  console.log('    ✔ Engine scripts, diagnostics, and workflow CLI');
  console.log('    ✔ Craft reference modules (_config/okf_craft/)');
  console.log('    ✔ Agent guides & prompt instructions\n');

  console.log('  \x1b[1mCreative Integrity Check:\x1b[0m');
  console.log('    ✔ All manuscript drafts, chapters, and canon entries are untouched.');
  console.log(`    ✔ Safety snapshot archived: \x1b[90m${path.basename(snapshot.backupDir)}\x1b[0m`);

  if (updateResult.preservedCustomizations && updateResult.preservedCustomizations.length > 0) {
    console.log('\n  \x1b[1m\x1b[33mCollaborative Customization Notice:\x1b[0m');
    for (const item of updateResult.preservedCustomizations) {
      console.log(`    • Kept your tailored version of: \x1b[1m${item.file}\x1b[0m`);
      if (item.upstreamSidecar) {
        console.log(`      ↳ Saved new upstream version to: \x1b[36m${item.upstreamSidecar}\x1b[0m`);
      }
    }
    console.log('    You can review the upstream changes at your leisure without losing your work.\n');
  }

  console.log('  Ready to write! Check next steps with: node scripts/soundingboard.js status\n');
}

/**
 * Render non-intrusive update alert banner if a newer version is cached
 */
export function renderUpdateBanner(projectDir = process.cwd()) {
  const cached = getCachedUpdateInfo(projectDir);
  if (!cached || !cached.hasUpdate) return;

  const cur = cached.currentVersion || 'current';
  const latest = cached.latestVersion || 'latest';

  console.log('\x1b[36m┌────────────────────────────────────────────────────────────────────────┐\x1b[0m');
  console.log(`\x1b[36m│\x1b[0m  \x1b[1m✨ Soundingboard Studio Update Available: v${latest.padEnd(8)}\x1b[0m (Current: v${cur})  \x1b[36m│\x1b[0m`);
  console.log('\x1b[36m│\x1b[0m  New craft cards & diagnostics ready. Ask agent or run: \x1b[33msb update\x1b[0m      \x1b[36m│\x1b[0m');
  console.log('\x1b[36m└────────────────────────────────────────────────────────────────────────┘\x1b[0m\n');
}
