/**
 * Soundingboard 2.0 - Same-POV Voice Anchor Resolution Engine
 * Resolves voice calibration prose by walking back for the most recent drafted scene
 * sharing the same POV. Prevents stylistic contamination across POV changes.
 */

import * as fs from 'fs';
import * as path from 'path';
import { strip } from './frontmatter.js';

/**
 * Extracts the trailing ~500 words / ~40 lines of prose from a text body.
 * @param {string} text
 * @param {number} [maxWords=500]
 * @returns {string}
 */
export function extractTrailingProse(text, maxWords = 500) {
  const clean = text.trim();
  if (!clean) return '';

  const lines = clean.split(/\r?\n/);
  const tailLines = lines.slice(-40).join('\n');
  const words = tailLines.match(/[\w'’-]+/g) || [];

  if (words.length <= maxWords) {
    return tailLines.trim();
  }

  // If > maxWords, slice the last maxWords words
  const allWords = clean.match(/\S+/g) || [];
  return allWords.slice(-maxWords).join(' ').trim();
}

/**
 * @typedef {Object} AnchorResolution
 * @property {string|null} anchorSceneId - Resolved scene ID, or null if provisional/sample
 * @property {boolean} anchorProvisional - True if fell back to Stage 01 sample or no same-POV scene existed
 * @property {string} prose - Trailing prose text for voice calibration
 * @property {'same_pov_scene' | 'preceding_scene' | 'stage01_sample' | 'none'} source - Origin of anchor prose
 * @property {string|null} pov - Active POV resolved against
 */

/**
 * Resolves the voice anchor for a target scene.
 *
 * Rules:
 * 1. Walk back through preceding assembled scenes for the most recent drafted scene sharing target POV.
 * 2. If found, returns its trailing prose with anchorProvisional: false.
 * 3. If none exists (first scene in this POV), falls back to Stage 01 voice sample with anchorProvisional: true.
 * 4. If project declared POV anchoring disabled/shifting, falls back to sequence order.
 *
 * @param {string} targetSceneId
 * @param {string} [rootDir=process.cwd()]
 * @param {Object} [options={}]
 * @param {boolean} [options.forceSequential=false]
 * @returns {AnchorResolution}
 */
export function resolveVoiceAnchor(targetSceneId, rootDir = process.cwd(), options = {}) {
  const manifestPath = path.join(rootDir, 'manuscript.json');
  /** @type {any} */
  let manifest = null;

  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (_) {}
  }

  // Load preferences if available
  const prefsPath = path.join(rootDir, 'stages', '01_onboarding', 'output', 'preferences.json');
  /** @type {Record<string, any>} */
  let prefs = {};
  if (fs.existsSync(prefsPath)) {
    try {
      prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
    } catch (_) {}
  }

  const povAnchoringDisabled = options.forceSequential ||
    prefs.pov_anchoring === false ||
    prefs.pov_structure === 'shifting' ||
    prefs.pov === 'omniscient';

  if (!manifest || !Array.isArray(manifest.scenes)) {
    return resolveFallbackSample(rootDir, null);
  }

  // Find target scene
  const targetScene = manifest.scenes.find((/** @type {any} */ s) => s.id === targetSceneId);
  const targetPov = targetScene && targetScene.pov ? targetScene.pov.trim() : null;

  // Build ordered sequence of scenes from chapters assembly
  /** @type {any[]} */
  const orderedScenes = [];
  if (Array.isArray(manifest.chapters) && manifest.chapters.length > 0) {
    for (const ch of manifest.chapters) {
      if (Array.isArray(ch.scenes)) {
        for (const scId of ch.scenes) {
          const sc = manifest.scenes.find((/** @type {any} */ s) => s.id === scId);
          if (sc) orderedScenes.push(sc);
        }
      }
    }
  } else {
    orderedScenes.push(...manifest.scenes);
  }

  // Find position of targetSceneId in assembly
  const targetIdx = orderedScenes.findIndex(s => s.id === targetSceneId);
  const precedingScenes = targetIdx > 0 ? orderedScenes.slice(0, targetIdx) : (targetIdx === -1 ? orderedScenes : []);

  // Helper to read drafted scene prose
  /**
   * @param {any} scene
   * @returns {string}
   */
  function getSceneProse(scene) {
    if (!scene.file) return '';
    const fullPath = path.join(rootDir, scene.file.replace(/\//g, path.sep));
    if (!fs.existsSync(fullPath)) return '';
    const raw = fs.readFileSync(fullPath, 'utf8');
    return strip(raw).trim();
  }

  // 1. Fallback to sequence order if POV anchoring is explicitly disabled
  if (povAnchoringDisabled) {
    for (let i = precedingScenes.length - 1; i >= 0; i--) {
      const sc = precedingScenes[i];
      const prose = getSceneProse(sc);
      if (prose.length > 0) {
        return {
          anchorSceneId: sc.id,
          anchorProvisional: false,
          prose: extractTrailingProse(prose),
          source: 'preceding_scene',
          pov: targetPov
        };
      }
    }
    return resolveFallbackSample(rootDir, targetPov);
  }

  // 2. Normal same-POV walkback
  if (targetPov) {
    for (let i = precedingScenes.length - 1; i >= 0; i--) {
      const sc = precedingScenes[i];
      if (sc.pov && sc.pov.trim().toLowerCase() === targetPov.toLowerCase()) {
        const prose = getSceneProse(sc);
        if (prose.length > 0) {
          return {
            anchorSceneId: sc.id,
            anchorProvisional: false,
            prose: extractTrailingProse(prose),
            source: 'same_pov_scene',
            pov: targetPov
          };
        }
      }
    }
  }

  // 3. No prior scene in this POV -> Stage 01 voice sample with anchorProvisional: true
  return resolveFallbackSample(rootDir, targetPov);
}

/**
 * Resolves fallback voice sample from Stage 01 / Stage 02 artifacts.
 * @param {string} rootDir
 * @param {string|null} targetPov
 * @returns {AnchorResolution}
 */
function resolveFallbackSample(rootDir, targetPov) {
  const sampleCandidates = [
    path.join(rootDir, 'stages', '01_onboarding', 'output', 'voice_sample.md'),
    path.join(rootDir, 'stages', '02_planning', 'output', 'voice_exemplars.md'),
    path.join(rootDir, 'voice_exemplars.md')
  ];

  for (const p of sampleCandidates) {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      const prose = strip(raw).trim();
      if (prose.length > 0) {
        return {
          anchorSceneId: null,
          anchorProvisional: true,
          prose: extractTrailingProse(prose),
          source: 'stage01_sample',
          pov: targetPov
        };
      }
    }
  }

  return {
    anchorSceneId: null,
    anchorProvisional: true,
    prose: '',
    source: 'none',
    pov: targetPov
  };
}
