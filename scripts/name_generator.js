#!/usr/bin/env node

/**
 * Soundingboard Tactical Name Generator & World Onomastics Engine
 * 
 * Generates linguistically grounded, sociolinguistically stratified,
 * and anti-slop names for characters, places, and worlds.
 * Pure Node.js ES module — zero external dependencies.
 */

import * as fs from 'fs';
import * as path from 'path';

// --- Lightweight Tolerant YAML Parser for Lexicon Data ---

export function parseYaml(yamlText) {
  const lines = yamlText.replace(/^\uFEFF/, '').split(/\r?\n/);
  const root = {};
  const stack = [{ indent: -1, node: root }];

  function parseVal(v) {
    if (!v || v === '~' || v === 'null') return null;
    v = v.trim();
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (/^-?\d+$/.test(v)) return parseInt(v, 10);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      return v.slice(1, -1);
    }
    if (v.startsWith('[') && v.endsWith(']')) {
      return v.slice(1, -1).split(',').map(s => parseVal(s.trim())).filter(s => s !== null && s !== '');
    }
    return v;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    // Strip comments (handling quoted text safely enough for our lexicon)
    let line = rawLine;
    const commentIdx = line.indexOf('#');
    if (commentIdx !== -1) {
      const quoteCountBefore = (line.slice(0, commentIdx).match(/"/g) || []).length;
      if (quoteCountBefore % 2 === 0) {
        line = line.slice(0, commentIdx);
      }
    }

    if (!line.trim()) continue;

    const indent = line.search(/\S/);
    const trimmed = line.trim();

    // Adjust stack to current indentation
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const currentParent = stack[stack.length - 1].node;

    if (trimmed.startsWith('- ')) {
      // List item
      const itemVal = trimmed.slice(2).trim();
      if (!Array.isArray(currentParent)) {
        // If parent is not an array, this shouldn't happen unless malformed, ignore
        continue;
      }

      if (itemVal.includes(':') && !itemVal.startsWith('[') && !itemVal.startsWith('"') && !itemVal.startsWith("'")) {
        // Dict inside array
        const [k, ...rest] = itemVal.split(':');
        const childObj = { [k.trim()]: parseVal(rest.join(':')) };
        currentParent.push(childObj);
        stack.push({ indent, node: childObj });
      } else {
        currentParent.push(parseVal(itemVal));
      }
    } else if (trimmed.includes(':')) {
      const colonIdx = trimmed.indexOf(':');
      const key = trimmed.slice(0, colonIdx).trim();
      const valStr = trimmed.slice(colonIdx + 1).trim();

      if (valStr === '') {
        // Check next line to see if it's a list or a map
        let nextIsList = false;
        for (let j = i + 1; j < lines.length; j++) {
          const nl = lines[j].trim();
          if (!nl || nl.startsWith('#')) continue;
          if (nl.startsWith('- ')) nextIsList = true;
          break;
        }

        const newNode = nextIsList ? [] : {};
        if (Array.isArray(currentParent)) {
          const container = { [key]: newNode };
          currentParent.push(container);
          stack.push({ indent, node: newNode });
        } else {
          currentParent[key] = newNode;
          stack.push({ indent, node: newNode });
        }
      } else {
        const parsed = parseVal(valStr);
        if (Array.isArray(currentParent)) {
          currentParent.push({ [key]: parsed });
        } else {
          currentParent[key] = parsed;
        }
      }
    }
  }

  return root;
}

// --- Load Lexicon Database ---

export function loadLexicon(cwd = process.cwd()) {
  const possiblePaths = [
    path.join(cwd, '_config', 'naming_lexicon.md'),
    path.join(cwd, '..', '_config', 'naming_lexicon.md'),
    path.join(path.dirname(new URL(import.meta.url).pathname), '..', '_config', 'naming_lexicon.md')
  ];

  let rawContent = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      rawContent = fs.readFileSync(p, 'utf8');
      break;
    }
  }

  if (!rawContent) {
    throw new Error('Unable to locate _config/naming_lexicon.md database.');
  }

  // Extract ```yaml ... ``` code block
  const yamlMatch = rawContent.match(/```yaml\r?\n([\s\S]*?)\r?\n```/);
  if (!yamlMatch) {
    throw new Error('No valid ```yaml codeblock found in _config/naming_lexicon.md');
  }

  return parseYaml(yamlMatch[1]);
}

// --- Load Existing Cast & Project Context ---

export function loadExistingCast(cwd = process.cwd()) {
  const cast = [];
  const registeredNames = new Set();

  // 1. Scan canon.md
  const canonPaths = [
    path.join(cwd, 'stages', '02_planning', 'output', 'canon.md'),
    path.join(cwd, 'stages', '01_onboarding', 'output', 'canon.md'),
    path.join(cwd, 'canon.md')
  ];

  for (const cp of canonPaths) {
    if (fs.existsSync(cp)) {
      const text = fs.readFileSync(cp, 'utf8');
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        if (!line.startsWith('|') || line.includes('Entity') || line.includes('---')) continue;
        const parts = line.split('|').map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const entity = parts[0].replace(/[`\[\]]/g, '').trim();
          const category = parts[1].toLowerCase();
          if (category.includes('char') || category.includes('person') || category.includes('protagonist') || category.includes('antagonist')) {
            if (!registeredNames.has(entity.toLowerCase())) {
              registeredNames.add(entity.toLowerCase());
              cast.push(analyzeAcousticProfile(entity));
            }
          }
        }
      }
      break;
    }
  }

  // 2. Scan characters directory
  const charsDirs = [
    path.join(cwd, 'stages', '01_onboarding', 'output', 'characters'),
    path.join(cwd, 'stages', '01_onboarding', 'output', 'cast'),
    path.join(cwd, '00_Story_Bible', 'characters')
  ];

  for (const cd of charsDirs) {
    if (fs.existsSync(cd)) {
      const files = fs.readdirSync(cd).filter(f => f.endsWith('.md'));
      for (const f of files) {
        const basename = path.basename(f, '.md');
        if (!registeredNames.has(basename.toLowerCase())) {
          registeredNames.add(basename.toLowerCase());
          cast.push(analyzeAcousticProfile(basename));
        }
      }
    }
  }

  return cast;
}

export function estimateSyllables(word) {
  if (!word) return 0;
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length <= 3) return 1;
  const syl = clean
    .replace(/(?:[^laeiouy]|ed|es|e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g);
  return syl ? syl.length : 1;
}

export function analyzeAcousticProfile(name) {
  const parts = name.trim().split(/\s+/);
  const primary = parts[0];
  const initial = primary[0].toUpperCase();
  const syllables = estimateSyllables(primary);
  const clean = primary.toLowerCase().replace(/[^a-z]/g, '');
  const ending = clean.slice(-2);
  return {
    fullName: name,
    primary,
    initial,
    syllables,
    ending
  };
}

export function checkCastCollision(candidateName, cast) {
  const cand = analyzeAcousticProfile(candidateName);
  const collisions = [];

  for (const c of cast) {
    if (c.primary.toLowerCase() === cand.primary.toLowerCase()) {
      collisions.push({ type: 'exact', with: c.fullName, reason: 'Identical name to existing character' });
      continue;
    }
    const sameInitial = c.initial === cand.initial;
    const sameSyllables = c.syllables === cand.syllables;
    const sameEnding = c.ending === cand.ending;

    if (sameInitial && sameSyllables && sameEnding) {
      collisions.push({ type: 'severe', with: c.fullName, reason: `Shares initial (${cand.initial}), syllable count (${cand.syllables}), and ending (-${cand.ending})` });
    } else if (sameInitial && sameSyllables) {
      collisions.push({ type: 'moderate', with: c.fullName, reason: `Shares initial (${cand.initial}) and syllable count (${cand.syllables})` });
    }
  }

  return { candidate: cand, collisions };
}

// --- Generator Logic ---

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function isAiCliche(name, denylist) {
  if (!denylist) return false;
  const lower = name.toLowerCase();
  const firsts = denylist.first_names || [];
  const lasts = denylist.last_names || [];
  const places = denylist.place_cliches || [];

  for (const f of firsts) {
    if (new RegExp(`\\b${f.toLowerCase()}\\b`, 'i').test(lower)) return true;
  }
  for (const l of lasts) {
    if (new RegExp(`\\b${l.toLowerCase()}\\b`, 'i').test(lower)) return true;
  }
  for (const p of places) {
    if (lower === p.toLowerCase()) return true;
  }
  return false;
}

export function generateMorphemeMashup(lexicon, style = 'soft_liquids') {
  const group = lexicon.mashup_morphemes?.[style] || lexicon.mashup_morphemes?.soft_liquids || {};
  const onset = pickRandom(group.onsets) || 'Val';
  const nucleus = pickRandom(group.nuclei) || 'en';
  const coda = pickRandom(group.codas) || 'dor';
  return onset + nucleus + coda;
}

export function generateToponymCompound(lexicon) {
  const specifier = pickRandom(lexicon.toponymic_compounds?.specifiers) || 'Black';
  const ending = pickRandom(lexicon.toponymic_compounds?.eroded_endings) || 'ford';
  return specifier + ending.toLowerCase();
}

export function generateName(lexicon, options = {}, cast = []) {
  const {
    target = 'character',
    culture = null,
    genre = null,
    mode = 'full',
    caste = null,
    prefix = false,
    suffix = false,
    allowCliches = false,
    mashupStyle = null
  } = options;

  let attempts = 0;
  while (attempts < 50) {
    attempts++;
    let result = '';
    let category = '';

    if (target === 'place') {
      // Location / Toponym generator
      category = 'Location';
      if (mode === 'compound' || (!culture && !genre) || Math.random() > 0.5) {
        result = generateToponymCompound(lexicon);
      } else {
        const pool = culture ? lexicon.cultures?.[culture]?.toponyms : (genre ? lexicon.genres?.[genre]?.toponyms : null);
        if (pool?.samples && pool.samples.length > 0) {
          result = pickRandom(pool.samples);
        } else {
          result = generateToponymCompound(lexicon);
        }
      }
    } else if (target === 'world') {
      // World / Realm / Faction generator
      category = 'World / Faction';
      const root1 = pickRandom(lexicon.mashup_morphemes?.hard_plosives?.onsets) || 'Tor';
      const root2 = pickRandom(lexicon.mashup_morphemes?.soft_liquids?.codas) || 'mir';
      const suffixEnd = pickRandom(['ia', 'land', 'mark', 'reach', 'hold', 'strand', 'vale', 'sector', 'prime']);
      result = `${root1}${root2}${suffixEnd.startsWith('ia') ? '' : '-' + suffixEnd}`;
    } else {
      // Character generator
      category = 'Character';

      if (mode === 'mashup') {
        const style = mashupStyle || (genre === 'clan_and_stone_subterranean' ? 'hard_plosives' : 'soft_liquids');
        const first = generateMorphemeMashup(lexicon, style);
        if (caste === 'outcast') {
          result = first;
        } else {
          const last = generateToponymCompound(lexicon);
          result = `${first} ${last}`;
        }
      } else {
        // Resolve culture or genre
        let selectedData = null;
        if (culture && lexicon.cultures?.[culture]) {
          selectedData = lexicon.cultures[culture];
        } else if (genre && lexicon.genres?.[genre]) {
          selectedData = lexicon.genres[genre];
        } else {
          // Default: pick random culture
          const cultureKeys = Object.keys(lexicon.cultures || {});
          const randomKey = pickRandom(cultureKeys);
          selectedData = lexicon.cultures[randomKey];
        }

        const firstsMasculine = selectedData?.first_names?.masculine || [];
        const firstsFeminine = selectedData?.first_names?.feminine || [];
        const handles = selectedData?.first_names?.handles || [];
        const allFirsts = [...firstsMasculine, ...firstsFeminine, ...handles];
        const allLasts = selectedData?.last_names || [];

        let first = pickRandom(allFirsts) || 'Halvar';
        let last = pickRandom(allLasts) || 'Lindqvist';

        // Apply Caste Rules
        if (caste === 'noble') {
          const noblePrefix = pickRandom(lexicon.prefixes_registry?.honorific_feudal) || 'Lord ';
          const lineagePrefix = pickRandom(['de ', 'von ', 'of House ']);
          result = `${noblePrefix}${first} ${lineagePrefix}${last}`;
        } else if (caste === 'outcast') {
          result = handles.length > 0 ? pickRandom(handles) : (pickRandom(lexicon.prefixes_registry?.street_moniker) || '') + first;
        } else if (caste === 'guild') {
          const craftSuffix = pickRandom(lexicon.suffixes_registry?.occupational_craft) || '-wright';
          result = `${first} ${last.replace(/-.*/, '')}${craftSuffix}`;
        } else if (mode === 'first') {
          result = first;
        } else if (mode === 'last') {
          result = last;
        } else {
          // Standard full name
          let pre = '';
          let suf = '';

          if (prefix === true) {
            const prePool = [...(lexicon.prefixes_registry?.lineage_patronymic || []), ...(selectedData?.prefixes || [])];
            pre = pickRandom(prePool) || '';
          } else if (typeof prefix === 'string') {
            pre = prefix + ' ';
          }

          if (suffix === true) {
            const sufPool = [...(lexicon.suffixes_registry?.kinship_patronymic || []), ...(selectedData?.suffixes || [])];
            suf = pickRandom(sufPool) || '';
          } else if (typeof suffix === 'string') {
            suf = suffix;
          }

          if (suf && !last.endsWith(suf)) {
            last = last.replace(/(?:son|sen|ski|ovic)$/i, '') + suf;
          }

          result = `${first} ${pre}${last}`.trim();
        }
      }
    }

    // Filter anti-AI cliches
    if (!allowCliches && isAiCliche(result, lexicon.anti_ai_denylist)) {
      continue;
    }

    // Check cast collisions
    const collisionCheck = checkCastCollision(result, cast);

    return {
      name: result,
      category,
      acousticProfile: collisionCheck.candidate,
      collisions: collisionCheck.collisions
    };
  }

  return { name: 'Halvar Skovgaard', category: 'Character', acousticProfile: analyzeAcousticProfile('Halvar Skovgaard'), collisions: [] };
}

// --- CLI Runner ---

function printBanner() {
  console.log('\n\x1b[1m\x1b[35m=== Soundingboard Tactical Name Generator ===\x1b[0m');
  console.log('\x1b[90mGrounded onomastics, sociolinguistic stratification & anti-slop defense.\x1b[0m\n');
}

export function runCli(args = process.argv.slice(2)) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Soundingboard Tactical Name Generator

Usage:
  node scripts/name_generator.js [options]
  node scripts/soundingboard.js name [options]

Options:
  --target=<type>        Target type: character (default), place, world
  --culture=<name>       Culture filter: norse, anglo, celtic, roman, slavic, east_asian,
                         middle_eastern, south_asian, african
  --genre=<name>         Genre filter: fantasy, stone, grimdark, cyberpunk, scifi, noir
  --mode=<mode>          Generation mode: full (default), first, last, mashup, compound
  --caste=<caste>        Caste logic: noble, guild, common, outcast
  --prefix[=<str>]       Include prefix (random or specific)
  --suffix[=<str>]       Include suffix (random or specific)
  --count=<N>            Number of candidates to generate (default: 5)
  --allow-cliches        Allow AI token favorites (Lyra, Kaelen, Silas, etc.)
  --json                 Output candidates in JSON format
  --help, -h             Show this help guide

Examples:
  node scripts/name_generator.js --culture=norse --caste=noble --count=3
  node scripts/name_generator.js --target=place --genre=grimdark --count=5
  node scripts/name_generator.js --genre=cyberpunk --caste=outcast --count=4
  node scripts/name_generator.js --mode=mashup --count=5
`);
    return;
  }

  const isJson = args.includes('--json');
  const allowCliches = args.includes('--allow-cliches');

  const targetArg = args.find(a => a.startsWith('--target='));
  const target = targetArg ? targetArg.split('=')[1].toLowerCase() : 'character';

  const cultureArg = args.find(a => a.startsWith('--culture='));
  let culture = cultureArg ? cultureArg.split('=')[1].toLowerCase() : null;

  const genreArg = args.find(a => a.startsWith('--genre='));
  let genre = genreArg ? genreArg.split('=')[1].toLowerCase() : null;

  const modeArg = args.find(a => a.startsWith('--mode='));
  const mode = modeArg ? modeArg.split('=')[1].toLowerCase() : 'full';

  const casteArg = args.find(a => a.startsWith('--caste='));
  const caste = casteArg ? casteArg.split('=')[1].toLowerCase() : null;

  const countArg = args.find(a => a.startsWith('--count='));
  const count = countArg ? parseInt(countArg.split('=')[1], 10) : 5;

  const prefix = args.includes('--prefix') || Boolean(args.find(a => a.startsWith('--prefix=')));
  const suffix = args.includes('--suffix') || Boolean(args.find(a => a.startsWith('--suffix=')));

  // Normalize aliases
  const cultureMap = {
    norse: 'norse_scandinavian',
    scandinavian: 'norse_scandinavian',
    anglo: 'anglo_saxon_medieval_english',
    english: 'anglo_saxon_medieval_english',
    celtic: 'celtic_gaelic_welsh',
    welsh: 'celtic_gaelic_welsh',
    gaelic: 'celtic_gaelic_welsh',
    roman: 'greco_roman_classical',
    greek: 'greco_roman_classical',
    classical: 'greco_roman_classical',
    slavic: 'slavic_eastern_european',
    east_asian: 'east_asian_sino_korean_japonic',
    asian: 'east_asian_sino_korean_japonic',
    middle_eastern: 'middle_eastern_persian_levantine',
    persian: 'middle_eastern_persian_levantine',
    south_asian: 'south_asian_indic',
    indic: 'south_asian_indic',
    african: 'african_west_and_east',
    hispanic: 'modern_hispanic_and_latin_american',
    latino: 'modern_hispanic_and_latin_american',
    spanish: 'modern_hispanic_and_latin_american',
    mexican: 'modern_hispanic_and_latin_american',
    brazilian: 'modern_lusophone_and_brazilian',
    portuguese: 'modern_lusophone_and_brazilian',
    lusophone: 'modern_lusophone_and_brazilian',
    french: 'modern_francophone',
    francophone: 'modern_francophone',
    german: 'modern_germanic_and_central_european',
    germanic: 'modern_germanic_and_central_european',
    austrian: 'modern_germanic_and_central_european',
    italian: 'modern_italian',
    american: 'modern_contemporary_anglosphere',
    anglosphere: 'modern_contemporary_anglosphere',
    contemporary: 'modern_contemporary_anglosphere',
    southeast_asian: 'modern_southeast_asian',
    vietnamese: 'modern_southeast_asian',
    filipino: 'modern_southeast_asian',
    tagalog: 'modern_southeast_asian',
    thai: 'modern_southeast_asian',
    indonesian: 'modern_southeast_asian',
    indigenous: 'modern_indigenous_and_pacific',
    pacific: 'modern_indigenous_and_pacific',
    polynesian: 'modern_indigenous_and_pacific',
    hawaiian: 'modern_indigenous_and_pacific',
    maori: 'modern_indigenous_and_pacific'
  };
  if (culture && cultureMap[culture]) culture = cultureMap[culture];

  const genreMap = {
    fantasy: 'high_speculative_archaic',
    stone: 'clan_and_stone_subterranean',
    dwarf: 'clan_and_stone_subterranean',
    dwarven: 'clan_and_stone_subterranean',
    grimdark: 'grimdark_and_gothic',
    gothic: 'grimdark_and_gothic',
    cyberpunk: 'cyberpunk_and_sprawl',
    sprawl: 'cyberpunk_and_sprawl',
    scifi: 'hard_scifi_and_space_opera',
    space: 'hard_scifi_and_space_opera',
    noir: 'noir_and_hardboiled'
  };
  if (genre && genreMap[genre]) genre = genreMap[genre];

  const lexicon = loadLexicon();
  const cast = loadExistingCast();

  const candidates = [];
  for (let i = 0; i < count; i++) {
    candidates.push(generateName(lexicon, {
      target,
      culture,
      genre,
      mode,
      caste,
      prefix,
      suffix,
      allowCliches
    }, cast));
  }

  if (isJson) {
    console.log(JSON.stringify({ target, candidates }, null, 2));
    return;
  }

  printBanner();
  console.log(`\x1b[36mTarget:\x1b[0m ${target.toUpperCase()} | \x1b[36mMode:\x1b[0m ${mode} | \x1b[36mCaste:\x1b[0m ${caste || 'standard'}`);
  if (culture) console.log(`\x1b[36mCulture:\x1b[0m ${culture}`);
  if (genre) console.log(`\x1b[36mGenre:\x1b[0m ${genre}`);
  console.log(`\x1b[36mCast Monitored for Collisions:\x1b[0m ${cast.length} tracked entities\n`);

  candidates.forEach((c, idx) => {
    console.log(`\x1b[1m\x1b[32m${idx + 1}. ${c.name}\x1b[0m`);
    console.log(`   • Acoustic Profile: [${c.acousticProfile.initial}] initial, ${c.acousticProfile.syllables} syl, ending: "-${c.acousticProfile.ending}"`);
    if (c.collisions && c.collisions.length > 0) {
      c.collisions.forEach(col => {
        console.log(`   \x1b[33m⚠ Collision warning: ${col.reason} (vs. ${col.with})\x1b[0m`);
      });
    } else {
      console.log(`   \x1b[90m✔ No acoustic collision with current cast\x1b[0m`);
    }
    console.log('');
  });

  console.log('\x1b[90mTip: To plan world naming rules, run: node scripts/soundingboard.js pack naming\x1b[0m\n');
}

if (process.argv[1] && process.argv[1].endsWith('name_generator.js')) {
  runCli();
}
