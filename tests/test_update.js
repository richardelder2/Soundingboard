import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { semverCompare, getCachedUpdateInfo, createSafetySnapshot, runStandaloneUpdate } from '../scripts/updater.js';

export async function testUpdateSystem(assert, rootDir) {
  // 1. Semver Comparison Tests
  assert(semverCompare('1.2.0', '1.1.0') === 1, 'semverCompare recognizes newer major/minor version');
  assert(semverCompare('1.0.9', '1.1.0') === -1, 'semverCompare recognizes older version');
  assert(semverCompare('1.1.0', '1.1.0') === 0, 'semverCompare recognizes equal version');
  assert(semverCompare('v1.2.0', '1.1.0') === 1, 'semverCompare strips leading v prefix');
  assert(semverCompare('1.1.1', '1.1.0') === 1, 'semverCompare recognizes newer patch version');

  // 2. Cache handling
  const cacheDir = path.join(rootDir, '.soundingboard', 'cache');
  const cacheFile = path.join(cacheDir, 'update_check.json');
  const origCache = fs.existsSync(cacheFile) ? fs.readFileSync(cacheFile, 'utf8') : null;

  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    const mockData = {
      currentVersion: '1.1.0',
      latestVersion: '1.2.0',
      hasUpdate: true,
      timestamp: Date.now()
    };
    fs.writeFileSync(cacheFile, JSON.stringify(mockData), 'utf8');

    const retrieved = getCachedUpdateInfo(rootDir, 60000);
    assert(retrieved && retrieved.hasUpdate === true, 'getCachedUpdateInfo retrieves fresh cached update');

    const expired = getCachedUpdateInfo(rootDir, -1000);
    assert(expired === null, 'getCachedUpdateInfo returns null for expired cache');
  } finally {
    if (origCache !== null) {
      fs.writeFileSync(cacheFile, origCache, 'utf8');
    }
  }

  // 3. Safety Snapshot Creation
  const snapshot = createSafetySnapshot(rootDir);
  assert(fs.existsSync(snapshot.backupDir), 'createSafetySnapshot creates backup directory');
  assert(fs.existsSync(path.join(snapshot.backupDir, 'manifest.json')), 'Safety snapshot contains manifest.json');
  
  // Cleanup test snapshot
  try {
    fs.rmSync(snapshot.backupDir, { recursive: true, force: true });
  } catch {}

  // 4. CLI Check-Update & Update dry execution
  const cliScript = path.join(rootDir, 'scripts', 'soundingboard.js');
  try {
    const checkOut = execSync(`node "${cliScript}" check-update`, { cwd: rootDir, encoding: 'utf8' });
    assert(checkOut.includes('Checking for Soundingboard Studio Updates'), 'CLI check-update executes cleanly');
  } catch (e) {
    assert(false, 'CLI check-update threw error', e.message);
  }

  try {
    const updateOut = execSync(`node "${cliScript}" update`, { cwd: rootDir, encoding: 'utf8' });
    assert(updateOut.includes('Soundingboard Studio Safe Refresh'), 'CLI update executes cleanly');
  } catch (e) {
    assert(false, 'CLI update threw error', e.message);
  }

  // 5. Standalone Workspace Refresh Safety (Sacred files must NEVER be overwritten)
  const tempTestDir = path.join(rootDir, 'tests', 'fixtures', 'temp_workspace');
  fs.mkdirSync(path.join(tempTestDir, 'stages', '03_drafting', 'output'), { recursive: true });
  fs.mkdirSync(path.join(tempTestDir, 'inputs', 'drafts'), { recursive: true });
  const sacredChapter = path.join(tempTestDir, 'stages', '03_drafting', 'output', 'ch01.md');
  const sacredDraft = path.join(tempTestDir, 'inputs', 'drafts', 'raw.md');
  fs.writeFileSync(sacredChapter, '# Sacred Chapter\nDo not touch!', 'utf8');
  fs.writeFileSync(sacredDraft, '# Sacred Raw Draft\nOriginal words!', 'utf8');

  try {
    const result = runStandaloneUpdate(rootDir, tempTestDir, '1.2.0');
    assert(result.success === true, 'Standalone workspace update succeeds');
    assert(fs.readFileSync(sacredChapter, 'utf8') === '# Sacred Chapter\nDo not touch!', 'Sacred chapter was untouched by update');
    assert(fs.readFileSync(sacredDraft, 'utf8') === '# Sacred Raw Draft\nOriginal words!', 'Sacred raw draft in inputs/ was untouched by update');
    assert(fs.existsSync(path.join(tempTestDir, 'scripts', 'soundingboard.js')), 'Scripts were refreshed in target workspace');
  } finally {
    try {
      fs.rmSync(tempTestDir, { recursive: true, force: true });
    } catch {}
  }
}
