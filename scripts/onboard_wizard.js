#!/usr/bin/env node

/**
 * LEGACY CLI WIZARD (STANDALONE FALLBACK ONLY)
 * 
 * NOTE FOR AGENTS (Claude Code, Antigravity, Codex):
 * DO NOT execute this script in agent-assisted workflows.
 * This script is superseded by the agent-led onboarding contract:
 *   stages/01_onboarding/CONTEXT.md (Path A)
 * Conduct the interview directly in dialogue and write onboarding artifacts natively.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { callGemini } from './gemini_helper.js';

const OUTPUT_DIR = path.join('stages', '01_onboarding', 'output');
const BIBLE_DIR = path.join(OUTPUT_DIR, 'bible');
const CHARACTERS_DIR = path.join(OUTPUT_DIR, 'characters');

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

// Function to extract questions from markdown file
function parseQuestions(markdownPath) {
  if (!fs.existsSync(markdownPath)) {
    console.error(`Blueprint not found at: ${markdownPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(markdownPath, 'utf8');
  const lines = content.split('\n');
  const questions = [];
  
  lines.forEach(line => {
    const match = line.match(/^\d+\.\s+(.*)$/);
    if (match) {
      questions.push(match[1].replace(/^["']|["']$/g, ''));
    }
  });
  return questions;
}

function getAvailableBlueprints() {
  const setupDir = 'setup';
  if (!fs.existsSync(setupDir)) return [];
  return fs.readdirSync(setupDir)
    .filter(f => f.endsWith('_blueprint.md'))
    .map(f => {
      const fullPath = path.join(setupDir, f);
      const content = fs.readFileSync(fullPath, 'utf8');
      const name = content.match(/^name:\s*(.+)$/m)?.[1]?.trim() || f.replace(/_blueprint\.md$/, '');
      const description = content.match(/^description:\s*(.+)$/m)?.[1]?.trim() || '';
      return { file: f, path: fullPath, name, description };
    });
}

async function main() {
  const blueprints = getAvailableBlueprints();
  if (blueprints.length === 0) {
    console.error('No blueprint files found in setup/');
    process.exit(1);
  }

  let selectedBlueprint = null;
  const envBlueprint = process.env.SOUNDINGBOARD_BLUEPRINT || process.env.SB_BLUEPRINT || process.env.SAGA_BLUEPRINT;

  if (envBlueprint && fs.existsSync(envBlueprint)) {
    const found = blueprints.find(b => path.resolve(b.path) === path.resolve(envBlueprint));
    if (found) {
      selectedBlueprint = found;
    } else {
      const content = fs.readFileSync(envBlueprint, 'utf8');
      selectedBlueprint = {
        file: path.basename(envBlueprint),
        path: envBlueprint,
        name: content.match(/^name:\s*(.+)$/m)?.[1]?.trim() || path.basename(envBlueprint),
        description: content.match(/^description:\s*(.+)$/m)?.[1]?.trim() || ''
      };
    }
  } else {
    console.log('\n\x1b[1m\x1b[36m=== Soundingboard Novel Onboarding Wizard ===\x1b[0m\n');
    console.log('Select a genre blueprint for this project:\n');
    blueprints.forEach((b, idx) => {
      console.log(`  \x1b[33m[${idx + 1}]\x1b[0m \x1b[1m${b.name}\x1b[0m (${b.file})`);
      if (b.description) {
        console.log(`      \x1b[90m${b.description}\x1b[0m`);
      }
    });
    console.log('');
    const choice = await askQuestion(`Select a blueprint [1-${blueprints.length}]: `);
    const num = parseInt(choice, 10);
    if (!isNaN(num) && num >= 1 && num <= blueprints.length) {
      selectedBlueprint = blueprints[num - 1];
    } else {
      console.log(`Invalid selection; defaulting to ${blueprints[0].name}.`);
      selectedBlueprint = blueprints[0];
    }
  }

  console.log(`\n\x1b[1m\x1b[35m=== ${selectedBlueprint.name} Onboarding ===\x1b[0m\n`);
  console.log(`Reading questions from ${selectedBlueprint.file}...`);
  const questions = parseQuestions(selectedBlueprint.path);
  
  if (questions.length === 0) {
    console.error(`No questions found in ${selectedBlueprint.file}`);
    process.exit(1);
  }

  const responses = [];
  const systemInstruction = `You are an encouraging, domain-expert creative writing coach executing the "${selectedBlueprint.name}" onboarding process.
${selectedBlueprint.description ? `Focus: ${selectedBlueprint.description}\n` : ''}Your mission is to help the author design an immersive, compelling story within this genre. Enthusiastically validate their ideas, offer concise suggestions to sharpen genre tropes and storytelling, and keep your feedback under 3 sentences.`;

  for (let i = 0; i < questions.length - 2; i++) {
    console.log(`\n\x1b[36m[Question ${i + 1}/${questions.length - 2}]\x1b[0m`);
    console.log(`\x1b[1m${questions[i]}\x1b[0m`);
    
    const answer = await askQuestion('\nYour Response: ');
    responses.push({ question: questions[i], answer });

    console.log('\n\x1b[33mRefinement coaching...\x1b[0m');
    const prompt = `Genre/Blueprint: "${selectedBlueprint.name}"\nQuestion asked: "${questions[i]}"\nUser's answer: "${answer}"\n\nValidate the user's idea and offer a quick tip to sharpen the narrative or genre tropes.`;
    const feedback = await callGemini(prompt, systemInstruction);
    console.log(`\x1b[32mCoach: ${feedback}\x1b[0m\n`);
  }

  // Synthesis & Logline Compilation
  console.log('\x1b[35mCompiling concept synthesis & logline...\x1b[0m');
  const synthesisPrompt = `Here are the responses gathered from the onboarding questionnaire for a ${selectedBlueprint.name} story:
${responses.map((r, idx) => `${idx + 1}. Q: ${r.question}\nA: ${r.answer}`).join('\n\n')}

Synthesize these elements into a rich, cohesive narrative concept summary. Group the synthesis into these OKF categories:
1. Core Tech & World Rules (or Genre Mechanics)
2. Setting & Sensory Aesthetic
3. Character Dynamics & Foils
4. Central Conflict & Stakes

Followed by a punchy logline.`;

  const synthesisOutput = await callGemini(synthesisPrompt, systemInstruction, true);
  
  console.log(`\n\x1b[1m\x1b[32m=== ${selectedBlueprint.name.toUpperCase()} CONCEPT SYNTHESIS ===\x1b[0m\n`);
  console.log(synthesisOutput);
  console.log('\n\x1b[32m=================================\x1b[0m\n');

  // Ensure output folders exist
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(BIBLE_DIR, { recursive: true });
  fs.mkdirSync(CHARACTERS_DIR, { recursive: true });

  // Save compiled preferences JSON
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'preferences.json'),
    JSON.stringify({
      blueprint: `setup/${selectedBlueprint.file}`,
      blueprint_name: selectedBlueprint.name,
      responses,
      synthesis: synthesisOutput
    }, null, 2),
    'utf8'
  );

  // Create OKF World Bible File
  const bibleContent = `---
type: WorldBible
genre: ${selectedBlueprint.name}
focus: ${selectedBlueprint.name}
last_modified: ${new Date().toISOString().split('T')[0]}
---

# Global ${selectedBlueprint.name} Concept Synthesis

${synthesisOutput}
`;
  fs.writeFileSync(path.join(BIBLE_DIR, 'world_bible.md'), bibleContent, 'utf8');

  // Create OKF Character Files based on responses
  const charA = responses[9]?.answer || 'Protagonist';
  const charAFlaw = responses[10]?.answer || '';
  const charB = responses[11]?.answer || 'Foil';
  
  const charAProfile = `---
type: CharacterProfile
name: "${charA.split(' ')[0]}"
role: Primary Character
discipline: "${charA}"
flaw: "${charAFlaw}"
status: Seeded
---

# ${charA.split(' ')[0]}

Seeded during ${selectedBlueprint.name} onboarding.
`;

  const charBProfile = `---
type: CharacterProfile
name: "${charB.split(' ')[0]}"
role: Secondary / Partner Foil
discipline: "${charB}"
status: Seeded
---

# ${charB.split(' ')[0]}

Seeded during ${selectedBlueprint.name} onboarding.
`;

  fs.writeFileSync(path.join(CHARACTERS_DIR, 'character_a.md'), charAProfile, 'utf8');
  fs.writeFileSync(path.join(CHARACTERS_DIR, 'character_b.md'), charBProfile, 'utf8');

  console.log(`\n\x1b[32m✔ Onboarding complete! Created preferences.json, world_bible.md, character_a.md, and character_b.md under stages/01_onboarding/output/\x1b[0m\n`);
}

main().catch(console.error);
