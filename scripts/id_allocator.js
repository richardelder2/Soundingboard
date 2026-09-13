/**
 * Soundingboard 2.0 - Centralized Monotonic ID Allocator
 * Zero-dependency ID allocation for:
 * - Scenes: sc-NNNN (e.g. sc-0001)
 * - Threads: th-NN (e.g. th-01)
 * - Canon facts: e-NNNN (e.g. e-0001)
 *
 * Guarantees monotonic allocation: never fills gaps and never reissues deleted IDs.
 */

import * as fs from 'fs';
import * as path from 'path';

const WATERMARK_FILE = path.join('.soundingboard', 'watermarks.json');

/**
 * Reads the persistent watermark cache if it exists.
 * @param {string} rootDir
 * @returns {Record<string, number>}
 */
function readWatermarks(rootDir) {
  const p = path.join(rootDir, WATERMARK_FILE);
  if (fs.existsSync(p)) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (_) {
      return {};
    }
  }
  return {};
}

/**
 * Saves the persistent watermark cache.
 * @param {string} rootDir
 * @param {Record<string, number>} watermarks
 */
function saveWatermarks(rootDir, watermarks) {
  const p = path.join(rootDir, WATERMARK_FILE);
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(p, JSON.stringify(watermarks, null, 2) + '\n', 'utf8');
}

/**
 * Recursively scans a directory for files matching an extension.
 * @param {string} dir
 * @returns {string[]}
 */
function walk(dir) {
  /** @type {string[]} */
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walk(full));
    } else if (/\.(md|json)$/i.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Scans the workspace tree to find the highest number matching a prefix pattern.
 * @param {string} rootDir
 * @param {string} prefix - e.g. 'sc', 'th', 'e'
 * @returns {number}
 */
export function scanTreeForHighestId(rootDir, prefix) {
  let highest = 0;
  const pattern = new RegExp(`\\b${prefix}-(\\d+)\\b`, 'g');

  const dirsToScan = [
    path.join(rootDir, 'manuscript'),
    path.join(rootDir, 'stages'),
    path.join(rootDir, '_config')
  ];

  for (const d of dirsToScan) {
    const files = walk(d);
    for (const f of files) {
      // Check file name itself
      const filename = path.basename(f);
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(filename)) !== null) {
        const num = parseInt(match[1], 10);
        if (num > highest) highest = num;
      }

      // Check file content
      try {
        const content = fs.readFileSync(f, 'utf8');
        pattern.lastIndex = 0;
        while ((match = pattern.exec(content)) !== null) {
          const num = parseInt(match[1], 10);
          if (num > highest) highest = num;
        }
      } catch (_) {}
    }
  }

  return highest;
}

/**
 * Gets the current high-water mark for a prefix, consulting tree and watermark.
 * @param {string} rootDir
 * @param {string} prefix
 * @returns {number}
 */
export function getHighWaterMark(rootDir, prefix) {
  const watermarks = readWatermarks(rootDir);
  const recorded = watermarks[prefix] || 0;
  const inTree = scanTreeForHighestId(rootDir, prefix);
  const currentMax = Math.max(recorded, inTree);

  if (currentMax > recorded) {
    watermarks[prefix] = currentMax;
    saveWatermarks(rootDir, watermarks);
  }

  return currentMax;
}

/**
 * Allocates the next monotonic ID for a given prefix and pad length.
 * @param {string} rootDir
 * @param {string} prefix
 * @param {number} padLength
 * @returns {string}
 */
function allocateNextId(rootDir, prefix, padLength) {
  const watermarks = readWatermarks(rootDir);
  const currentHigh = getHighWaterMark(rootDir, prefix);
  const nextNum = currentHigh + 1;

  watermarks[prefix] = nextNum;
  saveWatermarks(rootDir, watermarks);

  const padded = String(nextNum).padStart(padLength, '0');
  return `${prefix}-${padded}`;
}

/**
 * Allocates the next monotonic scene ID (sc-NNNN).
 * @param {string} [rootDir=process.cwd()]
 * @returns {string}
 */
export function nextSceneId(rootDir = process.cwd()) {
  return allocateNextId(rootDir, 'sc', 4);
}

/**
 * Allocates the next monotonic thread ID (th-NN).
 * @param {string} [rootDir=process.cwd()]
 * @returns {string}
 */
export function nextThreadId(rootDir = process.cwd()) {
  return allocateNextId(rootDir, 'th', 2);
}

/**
 * Allocates the next monotonic canon fact ID (e-NNNN).
 * @param {string} [rootDir=process.cwd()]
 * @returns {string}
 */
export function nextCanonId(rootDir = process.cwd()) {
  return allocateNextId(rootDir, 'e', 4);
}

export { nextSceneId as allocateSceneId };
