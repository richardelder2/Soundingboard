import * as fs from 'fs';
import * as path from 'path';
import assert from 'assert';
import { nextSceneId, nextThreadId, nextCanonId, getHighWaterMark } from '../scripts/id_allocator.js';

console.log('Testing scripts/id_allocator.js ...');

const tempTestDir = path.join('tests', 'fixtures', 'temp_id_test');
if (fs.existsSync(tempTestDir)) {
  fs.rmSync(tempTestDir, { recursive: true, force: true });
}
fs.mkdirSync(tempTestDir, { recursive: true });

try {
  // Test 1: Empty tree allocation
  const id1 = nextSceneId(tempTestDir);
  assert.strictEqual(id1, 'sc-0001', 'Empty tree should allocate sc-0001');
  console.log('✔ PASS: Empty tree allocates sc-0001');

  // Test 2: Gaps in tree
  // Simulate an existing tree with sc-0001 and sc-0003 (sc-0002 is missing/gap)
  const manuscriptDir = path.join(tempTestDir, 'manuscript', 'ch-01');
  fs.mkdirSync(manuscriptDir, { recursive: true });
  fs.writeFileSync(path.join(manuscriptDir, 'sc-0001.md'), '---\nid: sc-0001\n---\n');
  fs.writeFileSync(path.join(manuscriptDir, 'sc-0003.md'), '---\nid: sc-0003\n---\n');

  // Clear the watermark file to simulate cold start on a tree with gaps
  const watermarkFile = path.join(tempTestDir, '.soundingboard', 'watermarks.json');
  if (fs.existsSync(watermarkFile)) fs.unlinkSync(watermarkFile);

  const idAfterGap = nextSceneId(tempTestDir);
  assert.strictEqual(idAfterGap, 'sc-0004', 'Tree with gaps should allocate sc-0004 (never re-use gap sc-0002)');
  console.log('✔ PASS: Tree with gaps allocates next highest sc-0004 without filling gaps');

  // Test 3: Deleted highest ID
  // We allocate sc-0005 and write it to disk
  const id5 = nextSceneId(tempTestDir);
  assert.strictEqual(id5, 'sc-0005');
  const sc5File = path.join(manuscriptDir, 'sc-0005.md');
  fs.writeFileSync(sc5File, '---\nid: sc-0005\n---\n');

  // Now delete sc-0005.md from disk
  fs.unlinkSync(sc5File);

  // Next allocation must NOT reissue sc-0005, it must issue sc-0006
  const idAfterDelete = nextSceneId(tempTestDir);
  assert.strictEqual(idAfterDelete, 'sc-0006', 'Deleted highest ID should not be reissued');
  console.log('✔ PASS: Deleted highest ID is never reissued (allocates sc-0006)');

  // Test 4: Threads and Canon IDs
  const th1 = nextThreadId(tempTestDir);
  assert.strictEqual(th1, 'th-01');
  const th2 = nextThreadId(tempTestDir);
  assert.strictEqual(th2, 'th-02');

  const e1 = nextCanonId(tempTestDir);
  assert.strictEqual(e1, 'e-0001');
  console.log('✔ PASS: Thread and Canon IDs allocate monotonically');

  console.log('\nAll id_allocator tests passed successfully!\n');
} finally {
  if (fs.existsSync(tempTestDir)) {
    fs.rmSync(tempTestDir, { recursive: true, force: true });
  }
}
