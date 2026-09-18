/**
 * Soundingboard 2.0 - Cascading Canon 2.0 & Decision Queues (SB2-P2-06)
 * Zero runtime dependencies; built-in Node only.
 *
 * Core Mandates (PRD §15):
 * 1. Provenance Validation (PRD §15.2):
 *    Checks that scenes establishing canon entries (established_in) still exist in manuscript/.
 * 2. Reader Spoiler Guard (PRD §15.4):
 *    Suppresses facts where reader_known_as_of > current_scene from continuity checks.
 * 3. Three Gap Decision Queues (PRD §15.5, §15.6):
 *    - Orphaned: scene establishing fact was cut.
 *    - Unbound: prose asserts entity/fact never recorded in canon.
 *    - Absent / Pending: unverified fact tags or ambiguous placeholders.
 * 4. Cascading Multi-Tier Canon:
 *    Book Local -> Series -> World Universe.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse, strip } from './frontmatter.js';
import { findScenePath } from './hash_staleness.js';

const REPORT_DIR = path.join('stages', '04_diagnostics_edits', 'output', 'reports');
const VERDICTS_DIR = path.join('stages', '04_diagnostics_edits', 'output', 'verdicts');

const STOPWORDS = new Set([
  'The', 'She', 'He', 'They', 'It', 'And', 'But', 'Then', 'When', 'What',
  'That', 'This', 'There', 'Her', 'His', 'You', 'Not', 'Now', 'Once', 'After',
  'Before', 'Inside', 'Outside', 'Chapter', 'God', 'Monday', 'Tuesday',
  'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February',
  'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
  'November', 'December', 'North', 'South', 'East', 'West', 'Earth', 'Everyone',
  'Everything', 'Nobody', 'Nothing', 'Someone', 'Something', 'Maybe', 'Yes',
  'No', 'Okay', 'Fine', 'Right', 'Well', 'Look', 'Wait', 'Stop', 'Please',
  'Thanks', 'Sorry', 'Doctor', 'Captain', 'Sergeant', 'Commander', 'Chief',
  'Professor', 'Mister', 'Miss'
]);

/**
 * Extracts scene number integer from string (e.g. "sc-0010" -> 10).
 * @param {string|null} scId
 * @returns {number}
 */
export function parseSceneNumber(scId) {
  if (!scId) return 0;
  const m = String(scId).match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

/**
 * Evaluates whether a fact is known to the reader as of the target scene.
 * @param {string|null} readerKnownAsOf - e.g. "sc-0030"
 * @param {string|null} currentSceneId - e.g. "sc-0010"
 * @returns {boolean}
 */
export function isFactKnownToReader(readerKnownAsOf, currentSceneId) {
  if (!readerKnownAsOf || !currentSceneId) return true;
  const knownNum = parseSceneNumber(readerKnownAsOf);
  const currentNum = parseSceneNumber(currentSceneId);
  if (knownNum === 0 || currentNum === 0) return true;
  return currentNum >= knownNum;
}

/**
 * Locates all active canon files across the 3-tier hierarchy.
 * @param {string} rootDir
 * @returns {Array<{ level: string, path: string }>}
 */
export function resolveCanonSources(rootDir = process.cwd()) {
  const canonSources = [];

  // 1. Local Book Canon
  const bookCandidates = [
    path.join(rootDir, 'stages', '02_planning', 'output', 'canon.md'),
    path.join(rootDir, 'canon.md')
  ];
  for (const c of bookCandidates) {
    if (fs.existsSync(c)) {
      canonSources.push({ level: 'Book Local', path: c });
      break;
    }
  }

  // 2. Series Canon
  const seriesCandidates = [
    path.join(rootDir, '..', 'series', 'series_canon.md'),
    path.join(rootDir, 'series', 'series_canon.md')
  ];
  for (const c of seriesCandidates) {
    if (fs.existsSync(c)) {
      canonSources.push({ level: 'Series', path: c });
      break;
    }
  }

  // 3. World Canon
  const worldCandidates = [
    path.join(rootDir, '..', '..', 'world', 'world_canon.md'),
    path.join(rootDir, 'world', 'world_canon.md')
  ];
  for (const c of worldCandidates) {
    if (fs.existsSync(c)) {
      canonSources.push({ level: 'World Universe', path: c });
      break;
    }
  }

  // Fallback to template if nothing exists
  if (canonSources.length === 0) {
    const templateCanon = path.join(rootDir, '_config', 'templates', 'canon.template.md');
    if (fs.existsSync(templateCanon)) {
      canonSources.push({ level: 'Template', path: templateCanon });
    }
  }

  return canonSources;
}

/**
 * Parses canon entry rows across active sources.
 * Supports both 1.x schema and 2.0 schema with reader_known_as_of & epistemic_status.
 * @param {string} rootDir
 * @param {object} [options]
 * @param {string} [options.forSceneId] - If provided, suppresses facts unknown to reader as of this scene.
 * @returns {Array<{
 *   entity: string,
 *   attribute: string,
 *   value: string,
 *   establishedIn: string|null,
 *   readerKnownAsOf: string|null,
 *   epistemicStatus: 'established' | 'believed' | 'contested' | 'ambiguous',
 *   status: string,
 *   tier: string,
 *   sourcePath: string,
 *   lineNum: number,
 *   raw: string
 * }>}
 */
export function loadCanonEntries(rootDir = process.cwd(), options = {}) {
  const sources = resolveCanonSources(rootDir);
  const entries = [];

  for (const src of sources) {
    const raw = fs.readFileSync(src.path, 'utf8').replace(/^\uFEFF/, '');
    const lines = raw.split(/\r?\n/);

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      if (line.trim().startsWith('|') && !line.includes('---') && !line.toLowerCase().includes('| entity |')) {
        const cells = line.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length >= 3) {
          const entity = cells[0].replace(/[\[\]]/g, '').trim();
          if (entity.length < 2 || STOPWORDS.has(entity)) continue;

          const attribute = cells[1] || 'Trait';
          const value = cells[2] || '';

          // Schema 2.0: Entity | Attribute | Value | Established In | Reader Known As Of | Epistemic Status | Status
          let establishedIn = null;
          let readerKnownAsOf = null;
          let epistemicStatus = 'established';
          let status = 'established';

          if (cells.length >= 7) {
            establishedIn = cells[3] ? cells[3].replace(/[\[\]]/g, '').trim() : null;
            readerKnownAsOf = cells[4] ? cells[4].replace(/[\[\]]/g, '').trim() : null;
            epistemicStatus = cells[5] ? cells[5].trim().toLowerCase() : 'established';
            status = cells[6] || 'verified';
          } else if (cells.length >= 5) {
            establishedIn = cells[3] ? cells[3].replace(/[\[\]]/g, '').trim() : null;
            status = cells[4] || 'verified';
          }

          // Check reader spoiler guard
          if (options.forSceneId && readerKnownAsOf) {
            const known = isFactKnownToReader(readerKnownAsOf, options.forSceneId);
            if (!known) {
              // Fact is hidden from reader at current scene -> Omit from active canon
              continue;
            }
          }

          entries.push({
            entity,
            attribute,
            value,
            establishedIn: establishedIn || null,
            readerKnownAsOf: readerKnownAsOf || null,
            epistemicStatus: epistemicStatus || 'established',
            status,
            tier: src.level,
            sourcePath: src.path,
            lineNum: idx + 1,
            raw: line
          });
        }
      }
    }
  }

  return entries;
}

/**
 * Validates provenance: ensures scenes declared in established_in actually exist.
 * @param {Array<any>} canonEntries
 * @param {string} rootDir
 * @returns {Array<{ entry: any, missingSceneId: string }>}
 */
export function validateCanonProvenance(canonEntries, rootDir = process.cwd()) {
  const orphanedFacts = [];

  for (const entry of canonEntries) {
    if (entry.tier === 'Template') continue;
    // Author exceptions are sovereign truths (miracles, anomalies, lore constants)
    if (entry.status && /exception/i.test(entry.status)) continue;
    if (entry.establishedIn && /exception|author/i.test(entry.establishedIn)) continue;

    if (entry.establishedIn && /^sc-\d+/i.test(entry.establishedIn)) {
      const sceneId = entry.establishedIn.toLowerCase();
      const foundPath = findScenePath(sceneId, rootDir);

      if (!foundPath || !fs.existsSync(foundPath)) {
        orphanedFacts.push({
          entry,
          missingSceneId: entry.establishedIn
        });
      }
    }
  }

  return orphanedFacts;
}

/**
 * Extracts proper noun entity tokens from prose.
 * @param {string} text
 * @returns {Set<string>}
 */
function extractProseEntities(text) {
  const entityCounts = new Map();
  const re = /(^|[\s"“”'‘(—-])([A-Z][a-z]{2,})(['’]s)?\b/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    const word = m[2];
    if (STOPWORDS.has(word)) continue;
    entityCounts.set(word, (entityCounts.get(word) || 0) + 1);
  }
  return entityCounts;
}

/**
 * Detects unbound entities: proper nouns asserted in draft prose with no entry in canon.
 * @param {string} rootDir
 * @param {Array<any>} canonEntries
 * @returns {Array<{ entity: string, scenes: string[], occurrences: number }>}
 */
export function detectUnboundEntities(rootDir = process.cwd(), canonEntries = []) {
  const knownCanonNames = new Set(canonEntries.map(e => e.entity.toLowerCase()));
  const entityOccurrences = new Map(); // entityName -> { name, scenes: Set, count }

  const manuscriptDir = path.join(rootDir, 'manuscript');
  if (!fs.existsSync(manuscriptDir)) return [];

  const chDirs = fs.readdirSync(manuscriptDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^ch-/i.test(d.name))
    .map(d => d.name);

  for (const ch of chDirs) {
    const chPath = path.join(manuscriptDir, ch);
    const files = fs.readdirSync(chPath).filter(f => /^sc-\d+\.md$/i.test(f));

    for (const f of files) {
      const scId = path.basename(f, '.md');
      const scFile = path.join(chPath, f);
      const raw = fs.readFileSync(scFile, 'utf8');
      const body = strip(raw);

      const foundMap = extractProseEntities(body);
      for (const [token, count] of foundMap) {
        const lower = token.toLowerCase();
        if (!knownCanonNames.has(lower) && token.length >= 3) {
          const rec = entityOccurrences.get(lower) || { entity: token, scenes: new Set(), count: 0 };
          rec.count += count;
          rec.scenes.add(scId);
          entityOccurrences.set(lower, rec);
        }
      }
    }
  }

  // Filter to recurring entities (appearing in >= 2 scenes or >= 3 times in single scene)
  const unbound = [];
  for (const [_, rec] of entityOccurrences) {
    if (rec.scenes.size >= 2 || rec.count >= 3) {
      unbound.push({
        entity: rec.entity,
        scenes: Array.from(rec.scenes),
        occurrences: rec.count
      });
    }
  }

  return unbound.sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * Builds the 3 Epistemic Decision Queues (PRD §15.5, §15.6).
 * @param {string} rootDir
 * @returns {{
 *   orphanedQueue: Array<{
 *     fact: string,
 *     entity: string,
 *     missingSceneId: string,
 *     tier: string,
 *     options: Array<{ label: string, action: string }>
 *   }>,
 *   unboundQueue: Array<{
 *     entity: string,
 *     scenes: string[],
 *     occurrences: number,
 *     options: Array<{ label: string, action: string }>
 *   }>,
 *   absentQueue: Array<{
 *     fact: string,
 *     entity: string,
 *     status: string,
 *     lineNum: number,
 *     sourcePath: string,
 *     options: Array<{ label: string, action: string }>
 *   }>
 * }}
 */
export function buildDecisionQueues(rootDir = process.cwd()) {
  const canonEntries = loadCanonEntries(rootDir);

  // 1. Orphaned Facts Queue (scenes establishing entry have been cut)
  const orphanedList = validateCanonProvenance(canonEntries, rootDir);
  const orphanedQueue = orphanedList.map(item => ({
    entity: item.entry.entity,
    fact: item.entry.attribute + ': ' + item.entry.value,
    missingSceneId: item.missingSceneId,
    tier: item.entry.tier,
    options: [
      { label: 'Option 1 (Keep & Reassign)', action: `Keep fact; reassign established_in to a surviving scene.` },
      { label: 'Option 2 (Drop)', action: `Drop fact "${item.entry.entity}" from canon ledger since scene ${item.missingSceneId} was cut.` },
      { label: 'Option 3 (Hold Pending)', action: `Hold pending review in case cut scene ${item.missingSceneId} is restored.` },
      { label: 'Option 4 (Custom)', action: 'Write-in custom resolution.' }
    ]
  }));

  // 2. Unbound Entities Queue (prose asserts entity with no canon record)
  const unboundList = detectUnboundEntities(rootDir, canonEntries);
  const unboundQueue = unboundList.map(item => ({
    entity: item.entity,
    scenes: item.scenes,
    occurrences: item.occurrences,
    options: [
      { label: 'Option 1 (Record as Stated)', action: `Add "${item.entity}" to canon ledger as established in ${item.scenes[0]}.` },
      { label: 'Option 2 (Record Corrected)', action: `Record "${item.entity}" with corrected spelling or attribute.` },
      { label: 'Option 3 (Mark Ambiguous)', action: `Mark "${item.entity}" as deliberately ambiguous / minor background.` },
      { label: 'Option 4 (Revise Prose)', action: `Revise scene prose in ${item.scenes.join(', ')} to remove or replace.` }
    ]
  }));

  // 3. Absent / Unverified Queue (facts tagged unverified or ambiguous)
  const absentList = canonEntries.filter(e => /unverified/i.test(e.status) || e.epistemicStatus === 'ambiguous');
  const absentQueue = absentList.map(item => ({
    entity: item.entity,
    fact: item.attribute + ': ' + item.value,
    status: item.status,
    lineNum: item.lineNum,
    sourcePath: item.sourcePath,
    options: [
      { label: 'Option 1 (Verify)', action: `Confirm and verify fact upon Stage 04 gate clearance.` },
      { label: 'Option 2 (Specify / Clarify)', action: `Refine ambiguous details in ${item.sourcePath}.` },
      { label: 'Option 3 (Drop / Defer)', action: `Defer or remove unverified fact.` }
    ]
  }));

  return {
    orphanedQueue,
    unboundQueue,
    absentQueue
  };
}

/**
 * Runs a comprehensive Canon 2.0 integrity check and decision queue audit.
 * @param {object} [options]
 * @param {string} [options.rootDir]
 * @param {boolean} [options.strict]
 * @param {boolean} [options.json]
 * @returns {any}
 */
export function runCanonCheck(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const entries = loadCanonEntries(rootDir);
  const queues = buildDecisionQueues(rootDir);

  const totalOrphaned = queues.orphanedQueue.length;
  const totalUnbound = queues.unboundQueue.length;
  const totalAbsent = queues.absentQueue.length;

  const passed = totalOrphaned === 0 && (!options.strict || totalAbsent === 0);

  const result = {
    passed,
    totalCanonEntries: entries.length,
    orphanedFactsCount: totalOrphaned,
    unboundEntitiesCount: totalUnbound,
    absentFactsCount: totalAbsent,
    queues,
    timestamp: new Date().toISOString()
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return result;
  }

  console.log('\n========================================');
  console.log('   Cascading Canon Integrity & Decision Queues Check (SB2-P2-06)');
  console.log('========================================\n');

  console.log(`Total Established Facts Across Tiers: ${entries.length}`);
  console.log(`  • Orphaned Facts: ${totalOrphaned}`);
  console.log(`  • Unbound Entities: ${totalUnbound}`);
  console.log(`  • Absent / Unverified Facts: ${totalAbsent}\n`);

  // 1. Orphaned Facts
  if (totalOrphaned > 0) {
    console.log(`  \x1b[31m❌ Orphaned Facts Queue (${totalOrphaned} fact(s) lost establishing scene):\x1b[0m`);
    queues.orphanedQueue.forEach(q => {
      console.log(`     • [${q.tier}] ${q.entity}: "${q.fact}" (scene ${q.missingSceneId} missing)`);
    });
    console.log('     \x1b[33m↳ Run decision queue resolution to reassign or drop cut facts.\x1b[0m\n');
  } else {
    console.log('  \x1b[32m✔ Provenance Clean: All canon facts linked to surviving scene records.\x1b[0m');
  }

  // 2. Unbound Entities
  if (totalUnbound > 0) {
    console.log(`\n  \x1b[36m💡 Unbound Entities Queue (${totalUnbound} recurring proper noun(s) unrecorded in canon):\x1b[0m`);
    queues.unboundQueue.slice(0, 8).forEach(q => {
      console.log(`     • "${q.entity}": appears ${q.occurrences}x across [${q.scenes.join(', ')}]`);
    });
    if (totalUnbound > 8) {
      console.log(`     ... and ${totalUnbound - 8} more unbound entities.`);
    }
  }

  // 3. Absent / Unverified Facts
  if (totalAbsent > 0) {
    console.log(`\n  \x1b[33m▲ Absent / Unverified Queue (${totalAbsent} fact(s) pending gate verification):\x1b[0m`);
    queues.absentQueue.forEach(q => {
      console.log(`     • ${q.entity}: ${q.fact} [Line ${q.lineNum}]`);
    });
  } else {
    console.log('  \x1b[32m✔ Verification Clean: All active entries verified.\x1b[0m');
  }

  // Save report artifact
  const reportsDir = path.join(rootDir, 'stages', '04_diagnostics_edits', 'output', 'reports');
  const verdictsDir = path.join(rootDir, 'stages', '04_diagnostics_edits', 'output', 'verdicts');
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.mkdirSync(verdictsDir, { recursive: true });

  const reportPath = path.join(reportsDir, 'canon_decision_queues_report.md');
  const lines = [];
  lines.push('# Canon 2.0 Decision Queues Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}  |  Total Facts: ${entries.length}`);
  lines.push('');
  lines.push('## 1. Orphaned Facts Queue (Cut Scene Provenance)');
  if (totalOrphaned > 0) {
    queues.orphanedQueue.forEach(q => {
      lines.push(`### ${q.entity} (${q.tier})`);
      lines.push(`- **Fact:** ${q.fact}`);
      lines.push(`- **Missing Scene:** \`${q.missingSceneId}\``);
      lines.push('- **Human-in-the-Loop Options:**');
      q.options.forEach(opt => lines.push(`  - **${opt.label}:** ${opt.action}`));
      lines.push('');
    });
  } else {
    lines.push('✔ No orphaned canon facts detected.');
    lines.push('');
  }

  lines.push('## 2. Unbound Entities Queue (Discovered in Prose)');
  if (totalUnbound > 0) {
    queues.unboundQueue.forEach(q => {
      lines.push(`### ${q.entity}`);
      lines.push(`- **Occurrences:** ${q.occurrences} across scenes: \`${q.scenes.join(', ')}\``);
      lines.push('- **Human-in-the-Loop Options:**');
      q.options.forEach(opt => lines.push(`  - **${opt.label}:** ${opt.action}`));
      lines.push('');
    });
  } else {
    lines.push('✔ No unbound recurring entities detected.');
    lines.push('');
  }

  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');

  // Save verdict
  const verdictPayload = {
    check: 'canon_2.0',
    verdict: totalOrphaned === 0 ? 'PASS' : 'WARN',
    orphanedCount: totalOrphaned,
    unboundCount: totalUnbound,
    absentCount: totalAbsent,
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(path.join(verdictsDir, 'canon.json'), JSON.stringify(verdictPayload, null, 2), 'utf8');

  console.log(`\nReport saved: ${reportPath}\n`);

  return result;
}

/**
 * Queries canon entries with optional spoiler filtering.
 * @param {string} queryTerm
 * @param {object} [options]
 * @param {string} [options.rootDir]
 * @param {string} [options.scene] - Scene ID for spoiler guard (suppresses facts after this scene)
 */
export function queryCanon(queryTerm, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const entries = loadCanonEntries(rootDir, { forSceneId: options.scene });

  const term = queryTerm ? queryTerm.toLowerCase().trim() : '';
  const matched = entries.filter(e => {
    if (!term) return true;
    return e.entity.toLowerCase().includes(term) ||
           e.attribute.toLowerCase().includes(term) ||
           e.value.toLowerCase().includes(term);
  });

  console.log(`\nCascading Canon Query: "${queryTerm || 'ALL ENTITIES'}"`);
  if (options.scene) {
    console.log(`\x1b[36m🛡️ Reader Spoiler Guard Active: facts revealed after ${options.scene} are suppressed.\x1b[0m`);
  }
  console.log(`Found ${matched.length} matching canon fact(s):\n`);

  console.log('| Tier | Entity | Attribute / Fact | Value | Established In | Reader Known As Of | Epistemic | Status |');
  console.log('|---|---|---|---|---|---|---|---|');
  matched.forEach(r => {
    console.log(`| **[${r.tier}]** | **${r.entity}** | ${r.attribute} | ${r.value} | ${r.establishedIn || '-'} | ${r.readerKnownAsOf || '-'} | ${r.epistemicStatus} | ${r.status} |`);
  });
  console.log('');
  return matched;
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith('canon.js')) {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'check';
  const sceneArg = args.find(a => a.startsWith('--scene='));
  const scene = sceneArg ? sceneArg.split('=')[1] : undefined;

  if (cmd === 'query') {
    queryCanon(args[1], { scene });
  } else if (cmd === 'check' || cmd === 'queues') {
    runCanonCheck({ strict: args.includes('--strict'), json: args.includes('--json') });
  } else {
    runCanonCheck();
  }
}
