/**
 * Soundingboard 2.0 - Concurrency Guard & Migration Gate
 *
 * Concurrency Principle:
 * Non-linear work means an author may edit a scene in an editor while an agent
 * or process is working on it. Writes verify content hash and REFUSE rather than clobber.
 *
 * Migration Gate:
 * Detects legacy 1.x chapter models and directs the agent/user to migrate first.
 * No dual-model branching inside core operations.
 */

import * as fs from 'fs';
import * as path from 'path';
import { hashContent } from './hash_staleness.js';

export class ConcurrencyConflictError extends Error {
  /**
   * @param {string} filePath
   * @param {string} currentHash
   * @param {string} expectedHash
   */
  constructor(filePath, currentHash, expectedHash) {
    super(`Concurrency conflict: Refusing to overwrite "${filePath}". File on disk was modified concurrently (current hash: ${currentHash.slice(0, 8)}..., expected: ${expectedHash.slice(0, 8)}...).`);
    this.name = 'ConcurrencyConflictError';
    this.filePath = filePath;
    this.currentHash = currentHash;
    this.expectedHash = expectedHash;
  }
}

/**
 * Safely writes scene content to disk, verifying expected hash to prevent clobbering.
 * @param {string} filePath
 * @param {string} newContent
 * @param {string|null} [expectedHash=null]
 * @throws {ConcurrencyConflictError} if file exists and current hash differs from expectedHash
 */
export function writeGuarded(filePath, newContent, expectedHash = null) {
  if (fs.existsSync(filePath)) {
    const diskContent = fs.readFileSync(filePath, 'utf8');
    const diskHash = hashContent(diskContent);

    if (expectedHash !== null && diskHash !== expectedHash) {
      throw new ConcurrencyConflictError(filePath, diskHash, expectedHash);
    }
  }

  const parentDir = path.dirname(filePath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
}

/**
 * Checks whether the project in rootDir has migrated to the 2.0 scene model.
 * If unmigrated, returns false and prints the migrate-first instruction.
 * @param {string} [rootDir=process.cwd()]
 * @param {{ silent?: boolean }} [options]
 * @returns {boolean}
 */
export function checkMigrationGate(rootDir = process.cwd(), options = {}) {
  const manifestPath = path.join(rootDir, 'manuscript.json');
  if (!fs.existsSync(manifestPath)) {
    // New project or unindexed; check if manuscript/ directory exists with scenes
    const manuscriptDir = path.join(rootDir, 'manuscript');
    if (fs.existsSync(manuscriptDir)) {
      return true;
    }
    // Check if legacy chapters exist in stages/03_drafting
    const legacyChaptersDir = path.join(rootDir, 'stages', '03_drafting', 'output', 'chapters');
    if (fs.existsSync(legacyChaptersDir)) {
      const files = fs.readdirSync(legacyChaptersDir).filter(f => f.endsWith('.md'));
      if (files.length > 0) {
        if (!options.silent) {
          console.error(`\x1b[33m\n[Soundingboard 2.0 Migration Required]\x1b[0m`);
          console.error(`This workspace has 1.x chapter drafts in stages/03_drafting/.`);
          console.error(`Soundingboard 2.0 requires scenes as the atomic unit.`);
          console.error(`To migrate your manuscript safely, run:`);
          console.error(`  \x1b[36mnode scripts/soundingboard.js migrate-to-scenes\x1b[0m\n`);
        }
        return false;
      }
    }
    return true;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.unit_type === 'scene') {
      return true;
    }

    if (!options.silent) {
      console.error(`\x1b[33m\n[Soundingboard 2.0 Migration Required]\x1b[0m`);
      console.error(`This project is registered with unit_type: "${manifest.unit_type || 'chapter'}".`);
      console.error(`Soundingboard 2.0 requires scenes as the atomic storage unit.`);
      console.error(`To migrate losslessly to 2.0, run:`);
      console.error(`  \x1b[36mnode scripts/soundingboard.js migrate-to-scenes\x1b[0m\n`);
    }
    return false;
  } catch (_) {
    return true;
  }
}
