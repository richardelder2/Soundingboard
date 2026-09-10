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
}
