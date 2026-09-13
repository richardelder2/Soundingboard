import assert from 'assert';
import { verifyNodeRuntime } from '../scripts/preflight.js';

console.log('Testing scripts/preflight.js ...');

// 1. Current environment should be >= 18
const currentCheck = verifyNodeRuntime();
assert.strictEqual(currentCheck, true, 'Current Node runtime should be compatible');
console.log('✔ PASS: Current Node runtime verifies successfully');

// 2. Simulated Node 16 should fail cleanly and return false
const simulated16 = verifyNodeRuntime(16);
assert.strictEqual(simulated16, false, 'Simulated Node 16 must fail preflight check');
console.log('✔ PASS: Simulated Node 16 is rejected cleanly without stack traces');

// 3. Simulated Node 18 should pass
const simulated18 = verifyNodeRuntime(18);
assert.strictEqual(simulated18, true, 'Simulated Node 18 must pass preflight check');
console.log('✔ PASS: Simulated Node 18 passes preflight check');

// 4. Simulated Node 20 should pass
const simulated20 = verifyNodeRuntime(20);
assert.strictEqual(simulated20, true, 'Simulated Node 20 must pass preflight check');
console.log('✔ PASS: Simulated Node 20 passes preflight check');

console.log('\nAll preflight tests passed successfully!\n');
