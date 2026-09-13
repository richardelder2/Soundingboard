import { parse, stringify, strip, split, FrontmatterError } from '../scripts/frontmatter.js';
import assert from 'assert';

console.log('Testing scripts/frontmatter.js ...');

// 1. PRD §5.2 Scene Example
const sceneExample = `---
id: sc-0043
chapter: ch-07
pov: Maren
location: The salt works, night
value_in: Trust (+)
value_out: Betrayal (--)
commandments:
  inciting_incident: Maren finds the ledger has been altered
  progressive_complication: Tam's alibi collapses under her own notes
  crisis: Expose Tam or protect the crew
  climax: She burns the ledger
  resolution: Tam sees the smoke
voice_anchor: sc-0038
anchor_provisional: false
craft_modules: [okf-042, okf-091]
status: diagnosed
schema: 2.0
---

The salt works held the day's heat long after dark...
`;

const parsedScene = parse(sceneExample);
assert.strictEqual(parsedScene.id, 'sc-0043');
assert.strictEqual(parsedScene.chapter, 'ch-07');
assert.strictEqual(parsedScene.pov, 'Maren');
assert.strictEqual(parsedScene.anchor_provisional, false);
assert.deepStrictEqual(parsedScene.craft_modules, ['okf-042', 'okf-091']);
assert.strictEqual(parsedScene.commandments.climax, 'She burns the ledger');
assert.strictEqual(parsedScene.schema, '2.0');

// Byte-for-byte roundtrip test on §5.2
const sceneSplit = split(sceneExample);
const sceneRoundtrip = stringify(sceneSplit.data, sceneSplit.body);
assert.strictEqual(sceneRoundtrip.replace(/\r\n/g, '\n'), sceneExample.replace(/\r\n/g, '\n'), 'PRD §5.2 scene example must round-trip byte-for-byte');
console.log('✔ PASS: PRD §5.2 Scene Example byte-for-byte roundtrip');

// 2. PRD §5.3 Chapter Example
const chapterExample = `---
id: ch-07
number: 7
title: Salt and Ash
scenes: [sc-0042, sc-0043, sc-0044]
break_rationale: >
  Ends on Tam seeing the smoke. Withholds his reaction until Ch 9 so the
  reveal carries across the Fen interlude.
status: drafted
schema: 2.0
---
`;

const parsedChapter = parse(chapterExample);
assert.strictEqual(parsedChapter.id, 'ch-07');
assert.strictEqual(parsedChapter.number, 7);
assert.strictEqual(parsedChapter.title, 'Salt and Ash');
assert.deepStrictEqual(parsedChapter.scenes, ['sc-0042', 'sc-0043', 'sc-0044']);
assert.ok(parsedChapter.break_rationale.includes('Ends on Tam seeing the smoke.'));

// Byte-for-byte roundtrip test on §5.3
const chapterSplit = split(chapterExample);
const chapterRoundtrip = stringify(chapterSplit.data, chapterSplit.body);
assert.strictEqual(chapterRoundtrip.replace(/\r\n/g, '\n'), chapterExample.replace(/\r\n/g, '\n'), 'PRD §5.3 chapter example must round-trip byte-for-byte');
console.log('✔ PASS: PRD §5.3 Chapter Example byte-for-byte roundtrip');

// 3. Error Case: Folded scalar containing a tab
const tabExample = `---
break_rationale: >
  Line with a \ttab character
---
`;
let tabErrorCaught = false;
try {
  parse(tabExample);
} catch (e) {
  assert.ok(e instanceof FrontmatterError);
  assert.ok(e.message.includes('cannot contain tabs'));
  tabErrorCaught = true;
}
assert.ok(tabErrorCaught, 'Rejects folded scalar with tab');
console.log('✔ PASS: Rejects folded scalar containing tab');

// 4. Error Case: Unclosed flow sequence
const unclosedSequenceExample = `---
scenes: [sc-0001, sc-0002
title: Bad
---
`;
let unclosedErrorCaught = false;
try {
  parse(unclosedSequenceExample);
} catch (e) {
  assert.ok(e instanceof FrontmatterError);
  assert.ok(e.message.includes('Unclosed flow sequence'));
  unclosedErrorCaught = true;
}
assert.ok(unclosedErrorCaught, 'Rejects unclosed flow sequence');
console.log('✔ PASS: Rejects unclosed flow sequence');

// 5. Error Case: Two levels of map nesting
const doubleNestingExample = `---
commandments:
  inciting_incident:
    deep_key: not allowed
---
`;
let nestingErrorCaught = false;
try {
  parse(doubleNestingExample);
} catch (e) {
  assert.ok(e instanceof FrontmatterError);
  assert.ok(e.message.includes('more than one level of map nesting'));
  nestingErrorCaught = true;
}
assert.ok(nestingErrorCaught, 'Rejects two levels of map nesting');
console.log('✔ PASS: Rejects two levels of map nesting');

// 6. Strip function test
const textWithoutFrontmatter = 'Just regular markdown prose.';
assert.strictEqual(strip(textWithoutFrontmatter), textWithoutFrontmatter);
assert.strictEqual(strip(sceneExample).trim(), "The salt works held the day's heat long after dark...");
console.log('✔ PASS: Strip frontmatter functions accurately');

console.log('\nAll frontmatter unit tests passed successfully!\n');
