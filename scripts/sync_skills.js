#!/usr/bin/env node

/**
 * Soundingboard — Multi-Harness Skill Synchronization Engine
 * Synchronizes canonical skill definitions from .claude/skills into .agents/skills/
 * ensuring modern Antigravity slash-command and semantic skill parity.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function syncSkills(baseDir = rootDir) {
  const claudeSkillsDir = path.join(baseDir, '.claude', 'skills');
  const agentSkillsDir = path.join(baseDir, '.agents', 'skills');

  if (!fs.existsSync(claudeSkillsDir)) {
    console.error(`\x1b[31mError: Source skills directory not found at ${claudeSkillsDir}\x1b[0m`);
    return { count: 0, skills: [] };
  }

  if (!fs.existsSync(agentSkillsDir)) {
    fs.mkdirSync(agentSkillsDir, { recursive: true });
  }

  const entries = fs.readdirSync(claudeSkillsDir, { withFileTypes: true });
  const synced = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillName = entry.name;
      const srcSkillPath = path.join(claudeSkillsDir, skillName);
      const destSkillPath = path.join(agentSkillsDir, skillName);

      if (!fs.existsSync(destSkillPath)) {
        fs.mkdirSync(destSkillPath, { recursive: true });
      }

      // Copy all files in the skill directory
      const skillFiles = fs.readdirSync(srcSkillPath);
      for (const file of skillFiles) {
        const srcFile = path.join(srcSkillPath, file);
        const destFile = path.join(destSkillPath, file);
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, destFile);
        }
      }
      synced.push(skillName);
    }
  }

  return { count: synced.length, skills: synced };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('\n\x1b[1m\x1b[35m=== Synchronizing Harness Skills (.claude -> .agents) ===\x1b[0m');
  const result = syncSkills();
  console.log(`\x1b[32m✔ Synchronized ${result.count} skills to .agents/skills/:\x1b[0m`);
  result.skills.forEach(s => console.log(`  • /${s}`));
  console.log('\nAll skills are now active as Antigravity slash commands and agent tools.\n');
}
