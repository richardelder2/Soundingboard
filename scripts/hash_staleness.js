/**
 * Soundingboard 2.0 - Content Hashing & Staleness Engine
 * Uses node:crypto SHA-256 to track direct input provenance.
 *
 * Principles:
 * - Content-based, not timestamp-based (timestamps lie across git checkouts).
 * - Hash direct inputs only — never children wholesale.
 * - Stale means stale, not wrong. Report stale; never auto-rerun unasked.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { strip } from './frontmatter.js';

/**
 * Computes deterministic SHA-256 hash of text.
 * Normalizes CRLF to LF to maintain cross-platform integrity.
 * @param {string} text
 * @returns {string} 64-char hex string
 */
export function hashContent(text) {
  if (typeof text !== 'string') return '';
  const normalized = text.replace(/\r\n/g, '\n');
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * Computes hash of a scene's prose body (excluding frontmatter).
 * @param {string} fullSceneText
 * @returns {string}
 */
export function hashSceneProse(fullSceneText) {
  const body = strip(fullSceneText).trim();
  return hashContent(body);
}

/**
 * Finds the relative or absolute path of a scene file by its ID.
 * @param {string} sceneId - e.g. 'sc-0043'
 * @param {string} [rootDir=process.cwd()]
 * @returns {string|null}
 */
export function findScenePath(sceneId, rootDir = process.cwd()) {
  const manuscriptDir = path.join(rootDir, 'manuscript');
  if (!fs.existsSync(manuscriptDir)) return null;

  const chapterDirs = fs.readdirSync(manuscriptDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^ch-/i.test(d.name));

  for (const ch of chapterDirs) {
    const candidate = path.join(manuscriptDir, ch.name, `${sceneId}.md`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Computes current prose hash of a scene on disk.
 * @param {string} sceneId
 * @param {string} [rootDir=process.cwd()]
 * @returns {string|null}
 */
export function getSceneHash(sceneId, rootDir = process.cwd()) {
  const scenePath = findScenePath(sceneId, rootDir);
  if (!scenePath || !fs.existsSync(scenePath)) return null;
  const raw = fs.readFileSync(scenePath, 'utf8');
  return hashSceneProse(raw);
}

/**
 * Builds a computed_against map for a list of scene IDs.
 * @param {string[]} sceneIds
 * @param {string} [rootDir=process.cwd()]
 * @returns {Record<string, string>}
 */
export function buildComputedAgainst(sceneIds, rootDir = process.cwd()) {
  /** @type {Record<string, string>} */
  const map = {};
  for (const id of sceneIds) {
    const h = getSceneHash(id, rootDir);
    if (h) {
      map[id] = h;
    }
  }
  return map;
}

/**
 * Evaluates whether a finding record is stale against current scene prose.
 * @param {{ computed_against?: Record<string, string> }} finding
 * @param {string} [rootDir=process.cwd()]
 * @returns {{ isStale: boolean, changedScenes: string[], missingScenes: string[] }}
 */
export function checkStaleness(finding, rootDir = process.cwd()) {
  const computedAgainst = finding.computed_against || {};
  const changedScenes = [];
  const missingScenes = [];

  for (const [sceneId, originalHash] of Object.entries(computedAgainst)) {
    const currentHash = getSceneHash(sceneId, rootDir);
    if (!currentHash) {
      missingScenes.push(sceneId);
    } else if (currentHash !== originalHash) {
      changedScenes.push(sceneId);
    }
  }

  const isStale = changedScenes.length > 0 || missingScenes.length > 0;
  return {
    isStale,
    changedScenes,
    missingScenes
  };
}
