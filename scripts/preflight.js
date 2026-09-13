/**
 * Soundingboard 2.0 - Node Runtime Preflight
 * Enforces Node.js >= 18 with human-friendly guidance.
 */

/**
 * Checks whether the current Node runtime is compatible (Node >= 18).
 * @param {number|null} [simulatedMajor=null] - For testing older runtime simulation
 * @returns {boolean}
 */
export function verifyNodeRuntime(simulatedMajor = null) {
  const major = simulatedMajor !== null ?
    simulatedMajor :
    parseInt(process.versions.node.split('.')[0], 10);

  if (major < 18) {
    console.error(`\n\x1b[31m[Node.js Runtime Incompatible]\x1b[0m`);
    console.error(`Soundingboard requires Node.js version 18.0.0 or higher.`);
    console.error(`Current installed version: ${process.version}`);
    console.error(`Please install or upgrade Node.js (v18+) from https://nodejs.org/ to continue.\n`);
    return false;
  }
  return true;
}

// Self-executing when run directly
if (process.argv[1] && (process.argv[1].endsWith('preflight.js') || process.argv[1].endsWith('preflight'))) {
  if (!verifyNodeRuntime()) {
    process.exit(1);
  }
  console.log(`\x1b[32m✔ Node.js runtime compatible:\x1b[0m ${process.version}`);
}
