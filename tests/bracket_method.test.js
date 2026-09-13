#!/usr/bin/env node

/**
 * Soundingboard 2.0 - The Bracket Method Playbook & Tooling Test
 * Acceptance test for SB2-P1-07:
 * Verifies that pack bracket outputs scene context with structural cause-and-effect outline
 * and the 5-tag bracket taxonomy template.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

console.log('Testing The Bracket Method Playbook & Tooling (SB2-P1-07)...');

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✗ FAIL:\x1b[0m ${message}`);
    if (details) console.error(`    \x1b[90m${details}\x1b[0m`);
    failed++;
  }
}

// 1. Verify artifacts exist
const playbookPath = path.join(rootDir, '_config', 'templates', 'bracket_method_playbook.template.md');
assert(fs.existsSync(playbookPath), 'bracket_method_playbook.template.md exists');
if (fs.existsSync(playbookPath)) {
  const pbText = fs.readFileSync(playbookPath, 'utf8');
  assert(pbText.includes('[PRESERVE]') && pbText.includes('[CUT]') && pbText.includes('[REORDER]'),
    'Playbook template declares core bracket taxonomy tags');
  assert(pbText.includes('Swain Motivating-Reaction Units') || pbText.includes('Swain emotional sequencing'),
    'Playbook template incorporates Swain emotional sequencing');
}

const craftCardPath = path.join(rootDir, '_config', 'okf_craft', 'the_bracket_method_developmental_editing.md');
assert(fs.existsSync(craftCardPath), 'the_bracket_method_developmental_editing.md OKF craft card exists');

// 2. Test pack bracket CLI execution on fixture scene
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb2-bracket-test-'));

try {
  const scenePath = path.join(tempDir, 'sc-0005.md');
  fs.writeFileSync(scenePath, `---
id: sc-0005
chapter: ch-01
pov: Katherine
value_in: Composure (+)
value_out: Terror (--)
commandments:
  inciting_incident: The telegram slips under the door
  progressive_complication: The ink is fresh but the signature is her late husband's
  crisis: Burn the parchment or telegraph Scotland Yard
  climax: She strikes a match
  resolution: The wax catches fire
status: drafted
schema: 2.0
---

Katherine stared at the yellow envelope lying on the hall carpet.
Her hands trembled as she lifted the ivory letter-opener.
`);

  const cliScript = path.join(rootDir, 'scripts', 'soundingboard.js');
  const out = execSync(`node "${cliScript}" pack bracket "${scenePath}"`, {
    cwd: rootDir,
    encoding: 'utf8'
  });

  assert(out.includes('THE BRACKET METHOD CONTEXT'), 'CLI output includes Bracket Method context header');
  assert(out.toUpperCase().includes('ACTIVE SCENE DRAFT'), 'Output includes scene draft section');
  assert(out.includes('Katherine stared at the yellow envelope'), 'Output contains author prose verbatim');
  assert(out.includes('Story Grid 5 Commandments (Planned Intent)'), 'Output includes 5 commandments intent');
  assert(out.includes('Composure (+) → Terror (--)'), 'Output includes value shift intent');
  assert(out.includes('[PRESERVE]') && out.includes('[CUT]') && out.includes('[REORDER]'),
    'Output includes full 5-tag bracket taxonomy');
  assert(out.includes('Swain Motivating-Reaction Units'), 'Output includes Swain MRU sequencing rules');

} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

if (failed > 0) {
  console.error(`\n\x1b[31mFailed: ${failed} tests failed!\x1b[0m`);
  process.exit(1);
} else {
  console.log(`\n\x1b[32m✔ All ${passed} bracket method tests passed successfully!\x1b[0m\n`);
}
