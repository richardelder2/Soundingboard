/**
 * Soundingboard 2.0 - Structure Plan & Obligatory Scene Validator
 * Acceptance check for SB2-P1-05:
 * Validates that all obligatory trope scenes declared in structure_plan.md
 * are mapped to explicit atomic scene IDs (sc-NNNN) rather than chapter numbers.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * @typedef {Object} ObligatoryBeat
 * @property {number} index - Row index in table
 * @property {string} beat - Promised trope beat description
 * @property {string} biblePosition - Expected genre bible position
 * @property {string} scheduledScene - Assigned scene ID (sc-NNNN) or empty
 * @property {boolean} isMapped - Whether a valid sc-NNNN ID is assigned
 */

/**
 * @typedef {Object} StructureValidationResult
 * @property {boolean} valid - Whether all obligatory beats have assigned scene IDs
 * @property {number} totalBeats - Total declared obligatory beats
 * @property {number} mappedCount - Count of beats mapped to valid sc-NNNN
 * @property {ObligatoryBeat[]} unmappedBeats - Array of unassigned obligatory beats
 * @property {string[]} errors - Descriptive error messages for Stage 02 gate
 */

/**
 * Validates obligatory scenes in structure_plan.md.
 * @param {string} [rootDir=process.cwd()]
 * @returns {StructureValidationResult}
 */
export function validateObligatoryScenes(rootDir = process.cwd()) {
  const candidatePaths = [
    path.join(rootDir, 'stages', '02_planning', 'output', 'structure_plan.md'),
    path.join(rootDir, 'structure_plan.md')
  ];

  const planPath = candidatePaths.find(p => fs.existsSync(p));
  if (!planPath) {
    return {
      valid: true,
      totalBeats: 0,
      mappedCount: 0,
      unmappedBeats: [],
      errors: []
    };
  }

  const rawContent = fs.readFileSync(planPath, 'utf8');
  const lines = rawContent.split(/\r?\n/);

  let inObligatorySection = false;
  /** @type {ObligatoryBeat[]} */
  const allBeats = [];
  /** @type {ObligatoryBeat[]} */
  const unmappedBeats = [];
  /** @type {string[]} */
  const errors = [];

  let tableHeaderFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (/^##\s+1\.\s+Obligatory-scene ledger/i.test(line)) {
      inObligatorySection = true;
      continue;
    } else if (inObligatorySection && /^##\s+\d+\./.test(line)) {
      inObligatorySection = false;
      break;
    }

    if (inObligatorySection && line.startsWith('|')) {
      if (!tableHeaderFound) {
        if (/promised beat/i.test(line)) {
          tableHeaderFound = true;
        }
        continue;
      }
      if (line.includes('---')) continue;

      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 3) {
        const beatNum = parseInt(cells[0], 10) || allBeats.length + 1;
        const beatDesc = cells[1];
        const biblePos = cells[2] || '';
        const scheduledScene = cells[3] || '';

        const hasSceneId = /^sc-\d+/i.test(scheduledScene);
        const beatObj = {
          index: beatNum,
          beat: beatDesc,
          biblePosition: biblePos,
          scheduledScene,
          isMapped: hasSceneId
        };

        allBeats.push(beatObj);

        if (!hasSceneId) {
          unmappedBeats.push(beatObj);
          errors.push(
            `Obligatory beat #${beatNum} ("${beatDesc}") is not mapped to an atomic scene ID (sc-NNNN). Found: "${scheduledScene || 'EMPTY'}".`
          );
        }
      }
    }
  }

  return {
    valid: unmappedBeats.length === 0,
    totalBeats: allBeats.length,
    mappedCount: allBeats.length - unmappedBeats.length,
    unmappedBeats,
    errors
  };
}

// CLI direct run
if (process.argv[1] && (process.argv[1].endsWith('structure_validator.js') || process.argv[1].endsWith('structure_validator'))) {
  const result = validateObligatoryScenes();
  if (result.valid) {
    console.log(`\x1b[32m✔ Stage 02 Obligatory Scene Validation:\x1b[0m All ${result.totalBeats} obligatory beats mapped to atomic scene IDs.`);
  } else {
    console.error(`\x1b[31m✗ Stage 02 Completeness Failure:\x1b[0m ${result.unmappedBeats.length} of ${result.totalBeats} obligatory beats unmapped!`);
    result.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
}
