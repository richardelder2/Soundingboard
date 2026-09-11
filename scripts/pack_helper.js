import * as fs from 'fs';
import * as path from 'path';

/**
 * Shared helper for deterministic context packers.
 * Provides uniform section output, character/token counting, and safe file reading.
 */

export class ContextPacker {
  constructor(title) {
    this.title = title;
    this.sections = [];
    this.totalChars = 0;
  }

  emitHeader() {
    const border = '='.repeat(60);
    console.log(`\x1b[36m${border}\x1b[0m`);
    console.log(`\x1b[1m\x1b[36mCONTEXT PACKET: ${this.title.toUpperCase()}\x1b[0m`);
    console.log(`\x1b[36m${border}\x1b[0m\n`);
  }

  emitSection(sectionTitle, content) {
    if (!content || !content.trim()) return;
    const cleanContent = content.trim();
    const chars = cleanContent.length;
    const estimatedTokens = Math.ceil(chars / 4);

    console.log(`\x1b[33m--- [SECTION] ${sectionTitle.toUpperCase()} (~${estimatedTokens} tokens) ---\x1b[0m`);
    console.log(cleanContent);
    console.log(`\x1b[33m------------------------------------------------------------\x1b[0m\n`);

    this.sections.push({ title: sectionTitle, chars, tokens: estimatedTokens });
    this.totalChars += chars;
  }

  emitSummary() {
    const totalTokens = Math.ceil(this.totalChars / 4);
    console.log(`\x1b[32m✔ Context assembled: ${this.sections.length} sections, ~${this.totalChars} chars (~${totalTokens} tokens)\x1b[0m`);
  }

  static readTextSafe(filePath, maxChars = null) {
    if (!filePath || !fs.existsSync(filePath)) return null;
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      if (maxChars && content.length > maxChars) {
        content = content.slice(0, maxChars) + `\n\n[... truncated at ${maxChars} characters ...]`;
      }
      return content;
    } catch (e) {
      return null;
    }
  }

  static findFirstExisting(candidates) {
    for (const c of candidates) {
      if (c && fs.existsSync(c)) return c;
    }
    return null;
  }

  static resolveCascadingCanon(cwd = process.cwd()) {
    const layers = [];
    // 1. Book-level canon
    const bookCanon = ContextPacker.findFirstExisting([
      path.join(cwd, 'stages', '02_planning', 'output', 'canon.md'),
      path.join(cwd, 'canon.md'),
      path.join(cwd, '00_Story_Bible', 'canon.md')
    ]);
    if (bookCanon) layers.push({ level: 'Book Canon', path: bookCanon });

    // 2. Series-level canon
    const seriesCanon = ContextPacker.findFirstExisting([
      path.join(cwd, '..', 'series', 'series_canon.md'),
      path.join(cwd, '..', 'series_canon.md'),
      path.join(cwd, 'series', 'series_canon.md')
    ]);
    if (seriesCanon) layers.push({ level: 'Series Canon', path: seriesCanon });

    // 3. World-level canon
    const worldCanon = ContextPacker.findFirstExisting([
      path.join(cwd, '..', '..', 'world', 'world_canon.md'),
      path.join(cwd, '..', 'world', 'world_canon.md'),
      path.join(cwd, 'world', 'world_canon.md')
    ]);
    if (worldCanon) layers.push({ level: 'World Universe Canon', path: worldCanon });

    return layers;
  }
}

