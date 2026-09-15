#!/usr/bin/env node

/**
 * Soundingboard 2.0 - Deterministic Context Packer for Git & Creative History (Playbook #21)
 * Assembles Git status, creative changes, author Git preferences, technical integrity,
 * and recent history into a disciplined context block.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContextPacker } from './pack_helper.js';
import { parse } from './frontmatter.js';
import {
  getGitStatus,
  analyzeCreativeChanges,
  formatCreativeSummary,
  verifyTechnicalIntegrity,
  runGit
} from './git_history.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/pack-git.js [base_ref]');
  console.log('Example: node scripts/pack-git.js');
  console.log('Assembles Git status, creative changes, preferences, and Playbook #21 instructions.');
  process.exit(0);
}

const baseRef = args[0] || 'HEAD';
const packer = new ContextPacker('Git & Creative History (Playbook #21)');
packer.emitHeader();

// 1. Author Preferences & Boundaries
const prefCandidates = [
  path.join(cwd, 'preferences.md'),
  path.join(cwd, 'stages', '01_onboarding', 'output', 'preferences.json')
];
let gitMode = 'gentle';
let gitRemotePush = 'ask';
let workingMode = 'solo';
let authorName = 'Author';

for (const candidate of prefCandidates) {
  if (fs.existsSync(candidate)) {
    try {
      const raw = fs.readFileSync(candidate, 'utf8');
      const data = candidate.endsWith('.json') ? JSON.parse(raw) : parse(raw, candidate);
      if (data.git_mode) gitMode = data.git_mode;
      if (data.git_remote_push) gitRemotePush = data.git_remote_push;
      if (data.working_mode) workingMode = data.working_mode;
      if (data.author_name || data.author) authorName = data.author_name || data.author;
      break;
    } catch (_) {}
  }
}

const prefsSummary = `
- **Author:** ${authorName}
- **Working Mode:** ${workingMode}
- **Git Mode:** ${gitMode} (options: gentle | quiet | guided | automatic)
  - gentle: Suggest checkpoints at meaningful creative milestones with rationale.
  - quiet: No proactive reminders; commit only upon explicit author request.
  - guided: Suggest checkpoints and supply full creative diff summaries.
  - automatic: Automatic local checkpoint commits per author preferences.
- **Git Remote Push:** ${gitRemotePush} (options: ask | manual | automatic)
  - ask: Always confirm with author before pushing to remote.
  - manual: Never suggest pushing; author pushes manually.
  - automatic: Automatically push after approved milestone commits.
`;
packer.emitSection('Author Git Preferences & Boundaries', prefsSummary.trim());

// 2. Git Status & Remote Tracking
const gitStatus = getGitStatus(cwd);
if (!gitStatus.isRepo) {
  packer.emitSection('Git Repository Status', 'Workspace is NOT a Git repository. Run `soundingboard doctor --fix` to initialize tracking.');
} else {
  const statusSummary = `
- **Branch:** ${gitStatus.branch}
- **Working Tree:** ${gitStatus.isClean ? 'Clean (no uncommitted changes)' : 'Dirty (uncommitted changes present)'}
- **Has Commits:** ${gitStatus.hasCommits ? 'Yes' : 'No (brand new repository)'}
- **Unpushed Commits:** ${gitStatus.unpushedCommits}
- **Configured Remotes:** ${gitStatus.remotes.length > 0 ? gitStatus.remotes.join(', ') : 'None'}
`;
  packer.emitSection('Git Repository & Branch Status', statusSummary.trim());
}

// 3. Creative Changes Summary
const creativeAnalysis = analyzeCreativeChanges(cwd, { baseRef });
const creativeText = formatCreativeSummary(creativeAnalysis);
packer.emitSection('Creative Changes Since Last Checkpoint', creativeText);

// 4. Technical Integrity Verification
const integrity = verifyTechnicalIntegrity(cwd);
let integrityText = '';
if (integrity.valid) {
  integrityText = '✔ Technical Integrity Passed: All scene frontmatters, chapter playlists, and scene IDs are structurally valid.';
} else {
  integrityText = `✗ Technical Integrity Errors Found (${integrity.errors.length}):\n` +
    integrity.errors.map(e => `  - ${e}`).join('\n') +
    '\n\nNote: Fix these technical syntax/reference errors before committing. (Creative uncertainty like pacing or tells never blocks commits).';
}
packer.emitSection('Technical Integrity Check', integrityText);

// 5. Recent Git History
if (gitStatus.hasCommits) {
  const recentLog = runGit('log --oneline -n 6', cwd) || 'No commits found.';
  packer.emitSection('Recent Creative Checkpoints (Last 6 Commits)', recentLog);
}

// 6. Playbook #21 Agent Guidelines & Workflow Rules
const playbookInstructions = `
### Playbook #21: Agent Git Behavior Protocol

1. **Foundational Rule:**
   - Soundingboard files contain the meaning. Git records the evolution.
   - The author owns the creative work.
   - The agent NEVER unilaterally rewrites prose, never claims creative authority, and never turns Git into an editorial gatekeeper.

2. **Commit Proposal Etiquette:**
   - Honor author's \`git_mode\`:
     - If \`quiet\`: Never proactively suggest commits.
     - If \`gentle\` or \`guided\`: Propose checkpoints only at meaningful creative moments (substantial scene draft, major revision, bracket resolution, Act restructuring, end of session). Always explain WHY.
   - Present the 4 HITL options:
     [1] Commit now (with suggested or customized message)
     [2] Review creative diff / details
     [3] Edit commit message
     [4] Continue writing without committing

3. **Separation of Concerns:**
   - Local commits and remote pushes are distinct operations.
   - Never push without author confirmation unless \`git_remote_push\` is explicitly configured to 'automatic'.
   - Technical integrity issues (syntax/corrupted IDs) may warn or block; creative critique NEVER blocks.
`;
packer.emitSection('Playbook #21 Agent Protocol', playbookInstructions.trim());

packer.emitSummary();
