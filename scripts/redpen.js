#!/usr/bin/env node

/**
 * Soundingboard — Red Pen Mechanical Enforcement Engine (Playbook #18 & #20)
 * 
 * Enforces the core invariant:
 * "The human author always holds the red pen. The AI never unilaterally rewrites author prose."
 * 
 * Verifies the Bracket Invariant:
 * Stripping all `[...]` annotations from old and new text must leave the author's words identical.
 * Calibrated against working_mode (solo, hybrid, generative) in preferences.md.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const rootDir = path.resolve(__dirname, '..');

// Protected paths where author prose lives
export const PROTECTED_PATHS = [
  'manuscript/',
  'writers_room/',
  'stages/03_drafting/output/chapters/',
  'preferences.md'
];

/**
 * Checks if a relative or absolute file path falls within a protected path.
 */
export function isProtectedPath(filePath, baseDir = rootDir) {
  const absTarget = path.resolve(baseDir, filePath);
  const rel = path.relative(baseDir, absTarget).replace(/\\/g, '/');

  // Exact match for preferences.md
  if (rel === 'preferences.md' || rel.endsWith('/preferences.md')) {
    return true;
  }

  for (const p of PROTECTED_PATHS) {
    const normP = p.replace(/\\/g, '/');
    if (rel === normP || rel.startsWith(normP)) {
      return true;
    }
  }
  return false;
}

/**
 * Reads the active working_mode from preferences.md ('solo' | 'hybrid' | 'generative').
 * Defaults to 'solo' if preferences.md is absent or unconfigured.
 */
export function getWorkingMode(baseDir = rootDir) {
  const prefsPath = path.join(baseDir, 'preferences.md');
  if (!fs.existsSync(prefsPath)) return 'solo';

  try {
    const text = fs.readFileSync(prefsPath, 'utf8');
    const match = text.match(/working_mode\s*:\s*["']?(solo|hybrid|generative)["']?/i);
    if (match) return match[1].toLowerCase();

    // Secondary heuristic check
    if (/mode\s*:\s*["']?hybrid["']?/i.test(text)) return 'hybrid';
    if (/mode\s*:\s*["']?generative["']?/i.test(text)) return 'generative';
    return 'solo';
  } catch (err) {
    return 'solo';
  }
}

/**
 * Strips all bracket annotations `[...]` and normalizes whitespace.
 */
export function stripBrackets(text) {
  if (!text) return '';
  return text
    .replace(/\[[\s\S]*?\]/g, '') // remove bracketed expressions
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')      // normalize intra-line spaces
    .replace(/\n\s*\n+/g, '\n\n') // normalize paragraph breaks
    .trim();
}

/**
 * Separates YAML frontmatter from markdown body prose.
 */
export function splitFrontmatter(text) {
  if (!text) return { frontmatter: '', body: '' };
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (match) {
    return {
      frontmatter: match[1],
      body: match[2]
    };
  }
  return {
    frontmatter: '',
    body: text
  };
}

/**
 * Evaluates an edit to determine if it is:
 * - 'identical': no changes at all
 * - 'frontmatter_only': changes frontmatter metadata but body prose is unchanged
 * - 'bracket_only': body changes ONLY add, modify, or remove bracket tags
 * - 'author_words_changed': author's prose was modified or deleted
 */
export function classifyTextEdit(oldText, newText) {
  if (oldText === newText) {
    return { classification: 'identical', details: 'No changes detected' };
  }

  const oldParsed = splitFrontmatter(oldText);
  const newParsed = splitFrontmatter(newText);

  const oldBody = oldParsed.body;
  const newBody = newParsed.body;

  // If bodies are strictly identical, it's frontmatter only
  if (oldBody === newBody) {
    return { classification: 'frontmatter_only', details: 'Metadata frontmatter updated; prose unchanged' };
  }

  const oldStripped = stripBrackets(oldBody);
  const newStripped = stripBrackets(newBody);

  if (oldStripped === newStripped) {
    return {
      classification: 'bracket_only',
      details: 'Bracket Method suggestions added/adjusted; author prose is unchanged'
    };
  }

  return {
    classification: 'author_words_changed',
    details: 'Author prose words were modified, added outside brackets, or deleted'
  };
}

/**
 * Determines the Red Pen policy decision for a given edit.
 * Returns: { decision: 'allow' | 'ask' | 'deny', reason: string, classification: string }
 */
export function evaluateRedPenPolicy({
  targetPath,
  oldText = null,
  newText,
  isNewFile = false,
  workingMode = 'solo',
  baseDir = rootDir
}) {
  const protectedTarget = isProtectedPath(targetPath, baseDir);

  // If path is not protected, allow normal modifications
  if (!protectedTarget) {
    return {
      decision: 'allow',
      classification: 'unprotected_path',
      reason: `Path ${targetPath} is not a protected author prose location.`
    };
  }

  // Gating changes to preferences.md itself
  const relPath = path.relative(baseDir, path.resolve(baseDir, targetPath)).replace(/\\/g, '/');
  if (relPath === 'preferences.md' || relPath.endsWith('/preferences.md')) {
    return {
      decision: 'ask',
      classification: 'preferences_protection',
      reason: 'Preferences file governs working mode and agent permissions; modification requires author authorization.'
    };
  }

  // Creating a new file in a protected path
  if (isNewFile || oldText === null) {
    if (workingMode === 'generative') {
      return {
        decision: 'allow',
        classification: 'new_file_generative',
        reason: 'Generative mode: agent is authorized to draft new prose files upon request.'
      };
    } else {
      return {
        decision: 'ask',
        classification: 'new_file_guarded',
        reason: `${workingMode.toUpperCase()} mode: creating new prose file in ${relPath} requires author authorization.`
      };
    }
  }

  // Existing file modification
  const { classification, details } = classifyTextEdit(oldText, newText);

  if (classification === 'identical') {
    return { decision: 'allow', classification, reason: details };
  }

  if (classification === 'frontmatter_only') {
    if (workingMode === 'solo') {
      return {
        decision: 'ask',
        classification,
        reason: `Solo mode: frontmatter update to ${relPath} requires author confirmation.`
      };
    }
    return {
      decision: 'allow',
      classification,
      reason: `Metadata update in ${workingMode} mode.`
    };
  }

  if (classification === 'bracket_only') {
    if (workingMode === 'solo') {
      return {
        decision: 'ask',
        classification,
        reason: `Solo mode: all changes in ${relPath} require author confirmation.`
      };
    }
    return {
      decision: 'allow',
      classification,
      reason: `Bracket-only diagnostic suggestion permitted in ${workingMode} mode.`
    };
  }

  // author_words_changed
  return {
    decision: 'ask',
    classification,
    reason: `Red Pen Guard: Author prose in ${relPath} was modified. The human author holds the red pen. Please confirm or use The Bracket Method.`
  };
}

/**
 * Checks a shell command for unauthorized modifications to protected paths.
 */
export function evaluateShellCommand(commandLine, baseDir = rootDir) {
  if (!commandLine || typeof commandLine !== 'string') {
    return { decision: 'allow', reason: 'Empty command' };
  }

  const cmd = commandLine.trim();

  // Allowed commands: standalone soundingboard or git status/diff
  if (/^node\s+(scripts\/)?(soundingboard|saga|sb)\.js(\s+|$)/i.test(cmd) &&
      !/(&&|;|\||>>|>)/.test(cmd)) {
    return { decision: 'allow', reason: 'Official Soundingboard CLI invocation' };
  }

  // Check if any protected paths are referenced in destructive patterns
  const protectedPats = ['manuscript', 'writers_room', 'stages/03_drafting', 'preferences\\.md'];
  const pathRegex = new RegExp(`(${protectedPats.join('|')})`, 'i');

  if (pathRegex.test(cmd)) {
    // Destructive / modifying shell commands
    const destructiveRegex = /\b(sed|awk|rm|del|rmdir|erase|mv|move|cp|copy|cat\s*>|echo\s*>|tee|Out-File|Set-Content|Remove-Item)\b|[>]/i;
    if (destructiveRegex.test(cmd)) {
      return {
        decision: 'ask',
        reason: `Shell Guard: Command references protected author path with modification/deletion utilities: "${cmd}"`
      };
    }

    // Chained commands attempting to hide file edits
    if (/(&&|;|\|)/.test(cmd)) {
      return {
        decision: 'ask',
        reason: `Shell Guard: Chained command references protected path: "${cmd}"`
      };
    }
  }

  return { decision: 'allow', reason: 'Command does not target protected prose paths' };
}

/**
 * Handles incoming hook payload from stdin (Antigravity PreToolUse hook).
 */
export async function handleHookPayload(stdinData, baseDir = rootDir) {
  let payload;
  try {
    payload = typeof stdinData === 'string' ? JSON.parse(stdinData) : stdinData;
  } catch (err) {
    return { decision: 'allow', reason: 'Unparseable hook payload' };
  }

  const toolCall = payload.toolCall || payload;
  const toolName = toolCall.name || '';
  const args = toolCall.args || {};
  const workingMode = getWorkingMode(baseDir);

  if (toolName === 'run_command') {
    const cmd = args.CommandLine || args.command || '';
    return evaluateShellCommand(cmd, baseDir);
  }

  if (toolName === 'write_to_file') {
    const targetFile = args.TargetFile || args.path || '';
    const newContent = args.CodeContent !== undefined ? args.CodeContent : (args.content || '');
    const absPath = path.isAbsolute(targetFile) ? targetFile : path.resolve(baseDir, targetFile);

    const exists = fs.existsSync(absPath);
    const oldContent = exists ? fs.readFileSync(absPath, 'utf8') : null;

    return evaluateRedPenPolicy({
      targetPath: absPath,
      oldText: oldContent,
      newText: newContent,
      isNewFile: !exists,
      workingMode,
      baseDir
    });
  }

  if (toolName === 'replace_file_content') {
    const targetFile = args.TargetFile || args.path || '';
    const targetContent = args.TargetContent || '';
    const replacementContent = args.ReplacementContent || '';
    const absPath = path.isAbsolute(targetFile) ? targetFile : path.resolve(baseDir, targetFile);

    if (!fs.existsSync(absPath)) {
      return { decision: 'allow', reason: 'Target file does not exist' };
    }

    const oldText = fs.readFileSync(absPath, 'utf8');
    const newText = oldText.replace(targetContent, replacementContent);

    return evaluateRedPenPolicy({
      targetPath: absPath,
      oldText,
      newText,
      isNewFile: false,
      workingMode,
      baseDir
    });
  }

  return { decision: 'allow', reason: 'Tool not guarded by Red Pen' };
}

/**
 * Git audit: scans git diff --since <commit> or against HEAD for author word changes in protected paths.
 */
export function checkGitDiffSince(commitRef = 'HEAD~1', baseDir = rootDir) {
  try {
    const statusOutput = execSync(`git diff --name-only ${commitRef}`, { cwd: baseDir, encoding: 'utf8' });
    const changedFiles = statusOutput.split(/\r?\n/).filter(Boolean);

    const violations = [];

    for (const relFile of changedFiles) {
      if (!isProtectedPath(relFile, baseDir)) continue;

      try {
        const oldContent = execSync(`git show ${commitRef}:${relFile}`, { cwd: baseDir, encoding: 'utf8' });
        const absPath = path.resolve(baseDir, relFile);
        const newContent = fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : '';

        const { classification, details } = classifyTextEdit(oldContent, newContent);
        if (classification === 'author_words_changed') {
          violations.push({
            file: relFile,
            classification,
            details
          });
        }
      } catch (err) {
        // file might be newly added in git
      }
    }

    return violations;
  } catch (err) {
    return [];
  }
}

// CLI Execution Entry Point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  if (command === 'hook') {
    // Read stdin for hook payload
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { input += chunk; });
    process.stdin.on('end', async () => {
      const result = await handleHookPayload(input.trim());
      const hookOutput = { decision: result.decision || 'allow' };
      if (result.reason) hookOutput.reason = result.reason;
      console.log(JSON.stringify(hookOutput));
      process.exit(0);
    });
  } else if (command === 'check') {
    const sinceIdx = args.indexOf('--since');
    const commitRef = sinceIdx !== -1 && args[sinceIdx + 1] ? args[sinceIdx + 1] : 'HEAD~1';
    console.log(`Auditing git changes since ${commitRef} for Red Pen violations...`);
    const violations = checkGitDiffSince(commitRef);
    if (violations.length === 0) {
      console.log('\x1b[32m✔ PASS:\x1b[0m Zero unbracketed author prose violations detected.');
      process.exit(0);
    } else {
      console.error(`\x1b[31m✗ VIOLATION:\x1b[0m Found ${violations.length} files with modified author prose:`);
      violations.forEach(v => console.error(`  • ${v.file}: ${v.details}`));
      process.exit(1);
    }
  } else {
    console.log('Soundingboard Red Pen Engine');
    console.log('Usage:');
    console.log('  node scripts/redpen.js hook           # Handles stdin/stdout hook JSON');
    console.log('  node scripts/redpen.js check [--since <ref>] # Audits Git diff for prose modifications');
  }
}
