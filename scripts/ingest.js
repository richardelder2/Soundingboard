#!/usr/bin/env node

/**
 * Soundingboard 2.0 - Manuscript Ingest Entrypoint
 * Decomposes external drafts into atomic scenes and chapters in manuscript/.
 */

import { importManuscript, ingestManuscript } from './importer.js';

export { importManuscript, ingestManuscript };

if (process.argv[1] && (process.argv[1].endsWith('ingest.js') || process.argv[1].endsWith('ingest'))) {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node scripts/ingest.js <file|dir> [--target-chapter=N]');
    process.exit(0);
  }
  const source = args[0];
  /** @type {Record<string, any>} */
  const options = {};
  const chArg = args.find(a => a.startsWith('--target-chapter=') || a.startsWith('--chapter='));
  if (chArg) options.targetChapter = chArg.split('=')[1];
  importManuscript(source, options);
}
