import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Detect current platform package manager installation command
 */
export function getInstallCommand(tool) {
  const platform = process.platform;

  if (tool === 'pandoc') {
    if (platform === 'win32') {
      return {
        manager: 'winget',
        cmd: 'winget install --id JohnMacFarlane.Pandoc -e --silent --accept-package-agreements --accept-source-agreements',
        manualUrl: 'https://pandoc.org/installing.html'
      };
    } else if (platform === 'darwin') {
      return {
        manager: 'brew',
        cmd: 'brew install pandoc',
        manualUrl: 'https://pandoc.org/installing.html'
      };
    } else {
      return {
        manager: 'apt',
        cmd: 'sudo apt-get install -y pandoc',
        manualUrl: 'https://pandoc.org/installing.html'
      };
    }
  }

  if (tool === 'node') {
    if (platform === 'win32') {
      return {
        manager: 'winget',
        cmd: 'winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements',
        manualUrl: 'https://nodejs.org'
      };
    } else if (platform === 'darwin') {
      return {
        manager: 'brew',
        cmd: 'brew install node',
        manualUrl: 'https://nodejs.org'
      };
    } else {
      return {
        manager: 'apt',
        cmd: 'sudo apt-get install -y nodejs npm',
        manualUrl: 'https://nodejs.org'
      };
    }
  }

  if (tool === 'git') {
    if (platform === 'win32') {
      return {
        manager: 'winget',
        cmd: 'winget install --id Git.Git -e --silent --accept-package-agreements --accept-source-agreements',
        manualUrl: 'https://git-scm.com'
      };
    } else if (platform === 'darwin') {
      return {
        manager: 'xcode-select',
        cmd: 'xcode-select --install',
        manualUrl: 'https://git-scm.com'
      };
    } else {
      return {
        manager: 'apt',
        cmd: 'sudo apt-get install -y git',
        manualUrl: 'https://git-scm.com'
      };
    }
  }

  return null;
}

/**
 * Perform a full diagnostic of the author's environment
 */
export function diagnoseEnvironment(projectDir = process.cwd()) {
  const checks = [];

  // 1. Node.js Version Check
  const nodeVer = process.version;
  const majorNode = parseInt(nodeVer.replace(/^v/, '').split('.')[0], 10) || 0;
  const nodePass = majorNode >= 18;
  checks.push({
    id: 'node',
    name: 'Node.js Runtime',
    level: 'mandatory',
    status: nodePass ? 'pass' : 'fail',
    current: nodeVer,
    required: '>= 18.0.0',
    message: nodePass
      ? `Node.js ${nodeVer} (supports native fetch & ES modules)`
      : `Node.js ${nodeVer} is too old. Node 18+ is required.`,
    canFix: !nodePass,
    fixType: 'system_tool',
    fixInstruction: getInstallCommand('node')
  });

  // 2. Git Binary Check
  let gitPass = false;
  let gitVer = 'not found';
  try {
    const out = execSync('git --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    gitVer = out.trim();
    gitPass = true;
  } catch {}

  checks.push({
    id: 'git_bin',
    name: 'Git Version Control',
    level: 'mandatory',
    status: gitPass ? 'pass' : 'fail',
    current: gitVer,
    required: 'installed',
    message: gitPass ? gitVer : 'Git is not installed or not in PATH',
    canFix: !gitPass,
    fixType: 'system_tool',
    fixInstruction: getInstallCommand('git')
  });

  // 3. Git Repository Status
  let isGit = fs.existsSync(path.join(projectDir, '.git'));
  if (!isGit) {
    try {
      const topLevel = execSync('git rev-parse --show-toplevel', {
        cwd: projectDir,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
      isGit = path.resolve(topLevel) === path.resolve(projectDir);
    } catch {}
  }

  checks.push({
    id: 'git_repo',
    name: 'Git Workspace Tracking',
    level: 'recommended',
    status: isGit ? 'pass' : 'warn',
    current: isGit ? 'initialized' : 'not initialized',
    required: 'active git repository',
    message: isGit ? 'Workspace is tracked by Git' : 'Folder is not a Git repository (needed for auto-snapshots and updates)',
    canFix: !isGit && gitPass,
    fixType: 'auto_command',
    fixDescription: 'Initialize clean Git repository with main branch'
  });

  // 4. Git Identity Check (The #1 silent failure for non-technical users)
  let authorName = '';
  let authorEmail = '';
  if (gitPass) {
    try {
      authorName = execSync('git config user.name', { cwd: projectDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch {}
    try {
      authorEmail = execSync('git config user.email', { cwd: projectDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch {}
  }

  const identityPass = Boolean(authorName && authorEmail);
  checks.push({
    id: 'git_identity',
    name: 'Git Author Identity',
    level: 'recommended',
    status: identityPass ? 'pass' : 'warn',
    current: identityPass ? `${authorName} <${authorEmail}>` : 'unconfigured',
    required: 'user.name and user.email set',
    message: identityPass
      ? `Author identity set to: ${authorName} <${authorEmail}>`
      : 'Git author identity is missing. Auto-snapshots and commits may fail.',
    canFix: !identityPass && gitPass,
    fixType: 'auto_command',
    fixDescription: 'Configure local Git author identity for this novel workspace'
  });

  // 5. Pandoc Check (EPUB / DOCX compilation & Word ingestion)
  let pandocPass = false;
  let pandocVer = 'not found';
  try {
    const probe = spawnSync('pandoc', ['-v'], { encoding: 'utf8', stdio: 'pipe' });
    if (probe.status === 0 && probe.stdout) {
      pandocVer = probe.stdout.split('\n')[0].trim();
      pandocPass = true;
    }
  } catch {}

  checks.push({
    id: 'pandoc',
    name: 'Pandoc Document Engine',
    level: 'optional',
    status: pandocPass ? 'pass' : 'info',
    current: pandocVer,
    required: 'optional (for EPUB/DOCX & Word import)',
    message: pandocPass
      ? `${pandocVer} (EPUB, DOCX export & Word imports enabled)`
      : 'Pandoc not detected. HTML publishing works; EPUB/DOCX & Word docx imports require Pandoc.',
    canFix: !pandocPass,
    fixType: 'system_tool',
    fixInstruction: getInstallCommand('pandoc')
  });

  // 6. Environment (.env) Check
  const envPath = path.join(projectDir, '.env');
  const envExists = fs.existsSync(envPath);
  checks.push({
    id: 'env_file',
    name: 'Studio Configuration (.env)',
    level: 'recommended',
    status: envExists ? 'pass' : 'warn',
    current: envExists ? 'present' : 'missing',
    required: '.env file in workspace root',
    message: envExists ? '.env configuration file present' : '.env file missing (needed if using local LLMs or cloud APIs)',
    canFix: !envExists,
    fixType: 'auto_file',
    fixDescription: 'Create standard .env file with local & cloud model options'
  });

  // 7. Inputs Vault Check
  const inputsDrafts = path.join(projectDir, 'inputs', 'drafts');
  const inputsNotes = path.join(projectDir, 'inputs', 'notes');
  const vaultPass = fs.existsSync(inputsDrafts) && fs.existsSync(inputsNotes);
  checks.push({
    id: 'inputs_vault',
    name: 'Inputs Drop-Zone Vault (inputs/)',
    level: 'recommended',
    status: vaultPass ? 'pass' : 'warn',
    current: vaultPass ? 'scaffolded' : 'missing',
    required: 'inputs/drafts/ & inputs/notes/',
    message: vaultPass ? 'Inputs vault active for external notes and drafts' : 'Inputs vault folders missing',
    canFix: !vaultPass,
    fixType: 'auto_file',
    fixDescription: 'Scaffold inputs/drafts/, inputs/notes/, and README.md'
  });

  const mandatoryPass = checks.filter(c => c.level === 'mandatory').every(c => c.status === 'pass');
  const canFixCount = checks.filter(c => c.canFix).length;

  return {
    isReady: mandatoryPass,
    checks,
    canFixCount
  };
}

/**
 * Automatically remediate fixable environment issues
 */
export function autoFixEnvironment(projectDir = process.cwd(), options = {}) {
  const diag = diagnoseEnvironment(projectDir);
  const fixed = [];
  const manualNeeded = [];

  for (const check of diag.checks) {
    if (!check.canFix) continue;

    // 1. Fix Git Repo
    if (check.id === 'git_repo') {
      try {
        execSync('git init', { cwd: projectDir, stdio: ['pipe', 'pipe', 'pipe'] });
        try { execSync('git branch -M main', { cwd: projectDir, stdio: ['pipe', 'pipe', 'pipe'] }); } catch {}
        fixed.push({ id: check.id, message: 'Initialized clean Git repository (branch: main)' });
      } catch (e) {
        manualNeeded.push({ id: check.id, message: `Could not init git: ${e.message}` });
      }
    }

    // 2. Fix Git Author Identity
    if (check.id === 'git_identity') {
      try {
        const defaultName = options.authorName || process.env.USERNAME || process.env.USER || 'Author';
        const defaultEmail = options.authorEmail || `${defaultName.toLowerCase().replace(/\s+/g, '.')}@soundingboard.local`;
        execSync(`git config user.name "${defaultName}"`, { cwd: projectDir, stdio: ['pipe', 'pipe', 'pipe'] });
        execSync(`git config user.email "${defaultEmail}"`, { cwd: projectDir, stdio: ['pipe', 'pipe', 'pipe'] });
        fixed.push({ id: check.id, message: `Configured local Git identity: ${defaultName} <${defaultEmail}>` });
      } catch (e) {
        manualNeeded.push({ id: check.id, message: `Could not set git config: ${e.message}` });
      }
    }

    // 3. Fix Missing .env
    if (check.id === 'env_file') {
      try {
        const envPath = path.join(projectDir, '.env');
        const envContent = [
          '# Soundingboard Environment Variables',
          '# Option A: Local Edge (Ollama)',
          'LOCAL_MODEL=true',
          'LOCAL_MODEL_URL=http://localhost:11434/v1/chat/completions',
          'LOCAL_MODEL_NAME=gemma2',
          '',
          '# Option B: OpenRouter Cloud (Free & Open Weights)',
          '# USE_OPENROUTER=true',
          '# OPENROUTER_API_KEY=your_key',
          '# OPENROUTER_MODEL=meta-llama/llama-3-8b-instruct:free',
          '',
          '# Option C: Gemini Cloud',
          '# GEMINI_API_KEY=your_key',
          ''
        ].join('\n');
        fs.writeFileSync(envPath, envContent, 'utf8');
        fixed.push({ id: check.id, message: 'Created default .env configuration file' });
      } catch (e) {
        manualNeeded.push({ id: check.id, message: `Could not create .env: ${e.message}` });
      }
    }

    // 4. Fix Missing inputs/ vault
    if (check.id === 'inputs_vault') {
      try {
        const drafts = path.join(projectDir, 'inputs', 'drafts');
        const notes = path.join(projectDir, 'inputs', 'notes');
        fs.mkdirSync(drafts, { recursive: true });
        fs.mkdirSync(notes, { recursive: true });
        const readme = path.join(projectDir, 'inputs', 'README.md');
        if (!fs.existsSync(readme)) {
          fs.writeFileSync(readme, '# Inputs Vault\nDrop external notes into `notes/` and raw chapter drafts into `drafts/`.\n', 'utf8');
        }
        fixed.push({ id: check.id, message: 'Scaffolded inputs/ vault (inputs/drafts/ and inputs/notes/)' });
      } catch (e) {
        manualNeeded.push({ id: check.id, message: `Could not scaffold inputs/: ${e.message}` });
      }
    }

    // 5. System Tools (Pandoc, Node, Git) — Install if explicitly requested
    if (check.fixType === 'system_tool') {
      if (options.installTools && check.fixInstruction && check.fixInstruction.cmd) {
        try {
          console.log(`\n  \x1b[36mRunning installer for ${check.name} via ${check.fixInstruction.manager}...\x1b[0m`);
          execSync(check.fixInstruction.cmd, { stdio: 'inherit' });
          fixed.push({ id: check.id, message: `Installed ${check.name} via ${check.fixInstruction.manager}` });
        } catch (e) {
          manualNeeded.push({
            id: check.id,
            name: check.name,
            cmd: check.fixInstruction.cmd,
            url: check.fixInstruction.manualUrl,
            message: `Automatic installation failed. Try running manually or downloading from ${check.fixInstruction.manualUrl}`
          });
        }
      } else {
        manualNeeded.push({
          id: check.id,
          name: check.name,
          cmd: check.fixInstruction ? check.fixInstruction.cmd : null,
          url: check.fixInstruction ? check.fixInstruction.manualUrl : null,
          message: `Tool can be installed automatically via: ${check.fixInstruction ? check.fixInstruction.cmd : 'manual download'}`
        });
      }
    }
  }

  return { fixed, manualNeeded };
}

/**
 * CLI Command Handler for doctor
 */
export function handleDoctor(args = []) {
  console.log('\n\x1b[1m\x1b[35m=== Soundingboard Studio Doctor (Environment Health Check) ===\x1b[0m\n');

  const shouldFix = args.includes('--fix') || args.includes('-f');
  const installTools = args.includes('--install-tools') || args.includes('--tools');

  if (shouldFix) {
    console.log('  \x1b[36mApplying automatic concierge fixes...\x1b[0m\n');
    const fixResult = autoFixEnvironment(process.cwd(), { installTools });
    if (fixResult.fixed.length > 0) {
      console.log('  \x1b[1mRemediations Applied:\x1b[0m');
      for (const item of fixResult.fixed) {
        console.log(`    \x1b[32m✔\x1b[0m ${item.message}`);
      }
      console.log('');
    }
  }

  const diag = diagnoseEnvironment(process.cwd());

  // Group by category
  const core = diag.checks.filter(c => c.id === 'node' || c.id === 'git_bin' || c.id === 'git_repo' || c.id === 'git_identity');
  const publishing = diag.checks.filter(c => c.id === 'pandoc');
  const workspace = diag.checks.filter(c => c.id === 'env_file' || c.id === 'inputs_vault');

  console.log('  \x1b[1m[Core Engine]\x1b[0m');
  for (const c of core) {
    printCheckLine(c);
  }

  console.log('\n  \x1b[1m[Publishing & Document Ingestion]\x1b[0m');
  for (const c of publishing) {
    printCheckLine(c);
  }

  console.log('\n  \x1b[1m[Studio Vaults & Environment]\x1b[0m');
  for (const c of workspace) {
    printCheckLine(c);
  }

  console.log('\n------------------------------------------------------------');

  if (diag.isReady) {
    console.log('  \x1b[1m\x1b[32m✔ Studio foundation is primed and ready for novel production!\x1b[0m');
  } else {
    console.log('  \x1b[1m\x1b[31m✗ Mandatory requirements are missing.\x1b[0m Please resolve the items marked [FAIL].');
  }

  const fixableItems = diag.checks.filter(c => c.canFix && c.fixType === 'auto_command');
  const toolItems = diag.checks.filter(c => c.canFix && c.fixType === 'system_tool');

  if (!shouldFix && (fixableItems.length > 0 || toolItems.length > 0)) {
    console.log('\n  \x1b[1m\x1b[36mConcierge Auto-Healing Available:\x1b[0m');
    if (fixableItems.length > 0) {
      console.log(`  • To auto-heal workspace configuration: \x1b[33mnode scripts/soundingboard.js doctor --fix\x1b[0m`);
    }
    if (toolItems.length > 0) {
      console.log(`  • To auto-install missing tools (e.g. Pandoc): \x1b[33mnode scripts/soundingboard.js doctor --fix --install-tools\x1b[0m`);
    }
  }
  console.log('');
}

function printCheckLine(c) {
  let icon = '\x1b[32m✔\x1b[0m';
  if (c.status === 'fail') icon = '\x1b[31m✗ [FAIL]\x1b[0m';
  else if (c.status === 'warn') icon = '\x1b[33m▲ [WARN]\x1b[0m';
  else if (c.status === 'info') icon = '\x1b[90m○ [INFO]\x1b[0m';

  console.log(`    ${icon} ${c.name.padEnd(28)} \x1b[90m${c.message}\x1b[0m`);
}
