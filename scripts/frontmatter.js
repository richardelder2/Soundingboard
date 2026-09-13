/**
 * Soundingboard 2.0 - Universal Frontmatter Module
 * Zero-dependency YAML frontmatter parser, stringifier, stripper, and splitter.
 *
 * Implements the strict Soundingboard YAML subset:
 * - Scalars (strings, booleans, integers, null)
 * - Quoted scalars (single and double quotes)
 * - Block scalars (folded `>` and literal `|`)
 * - Flow sequences (`[a, b, c]`)
 * - One level of nested maps (e.g. `commandments:`)
 *
 * Rejects unsupported constructs loudly with typed FrontmatterError.
 */

export class FrontmatterError extends Error {
  /**
   * @param {string} message
   * @param {{ file?: string|null, line?: number|null, construct?: string|null }} [options]
   */
  constructor(message, { file = null, line = null, construct = null } = {}) {
    let prefix = 'Frontmatter error';
    if (file) prefix += ` in ${file}`;
    if (line !== null) prefix += ` at line ${line}`;
    if (construct) prefix += ` (${construct})`;
    super(`${prefix}: ${message}`);
    this.name = 'FrontmatterError';
    this.file = file;
    this.line = line;
    this.construct = construct;
  }
}

/**
 * Strips leading UTF-8 BOM if present.
 * @param {string} text
 * @returns {string}
 */
export function stripBOM(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/^\uFEFF/, '');
}

/**
 * Strips frontmatter block from text, returning the body.
 * @param {string} text
 * @returns {string}
 */
export function strip(text) {
  const clean = stripBOM(text);
  const match = clean.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (!match) return clean;
  return clean.slice(match[0].length);
}

/**
 * Parses scalar string value into JS primitive.
 * @param {string} raw
 * @returns {any}
 */
function parseScalar(raw) {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === '~') {
    return null;
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Quoted string
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  // Integer
  if (/^-?\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }

  // Float vs version string:
  // Numbers with a single dot like 2.0 or 1.2.0:
  // In Soundingboard schema: "2.0" is preserved as string "2.0" if it looks like a version or float string.
  // Wait, if it's standard float like 3.14:
  if (/^-?\d+\.\d+$/.test(trimmed)) {
    // If it's a version-like string e.g. "2.0", preserve as string so it round-trips as "2.0"
    return trimmed;
  }

  return trimmed;
}

/**
 * Parses a bracketed flow sequence like `[sc-0042, sc-0043]`.
 * @param {string} raw
 * @param {number} lineNum
 * @param {string|null} file
 * @returns {any[]}
 */
function parseFlowSequence(raw, lineNum, file) {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
    throw new FrontmatterError(`Unclosed flow sequence: expected ']'`, {
      file,
      line: lineNum,
      construct: 'flow_sequence'
    });
  }
  const inner = trimmed.slice(1, -1).trim();
  if (inner === '') return [];

  // Split by commas, taking quotes into account
  const items = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < inner.length; i++) {
    const char = inner[i];
    if ((char === '"' || char === "'") && (i === 0 || inner[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
      }
      current += char;
    } else if (char === ',' && !inQuotes) {
      items.push(parseScalar(current));
      current = '';
    } else {
      current += char;
    }
  }

  if (inQuotes) {
    throw new FrontmatterError(`Unclosed quote in flow sequence`, {
      file,
      line: lineNum,
      construct: 'flow_sequence'
    });
  }

  if (current.trim() !== '') {
    items.push(parseScalar(current));
  }

  return items;
}

/**
 * Parses YAML frontmatter into a plain JavaScript object.
 * @param {string} text
 * @param {string|null} [file=null]
 * @returns {Record<string, any>}
 */
export function parse(text, file = null) {
  const clean = stripBOM(text);
  const match = clean.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const lines = match[1].split(/\r?\n/);
  /** @type {Record<string, any>} */
  const result = {};

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const lineNum = i + 2; // line 1 is initial ---
    const line = rawLine.replace(/\s+$/, '');

    // Skip blank lines or comments
    if (line.trim() === '' || line.trim().startsWith('#')) {
      i++;
      continue;
    }

    // Top-level line must not have indentation
    if (/^\s/.test(line)) {
      throw new FrontmatterError(`Unexpected indentation at top level`, {
        file,
        line: lineNum,
        construct: 'indentation'
      });
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      throw new FrontmatterError(`Missing colon separator: "${line}"`, {
        file,
        line: lineNum,
        construct: 'key_value'
      });
    }

    const key = line.slice(0, colonIdx).trim();
    let valStr = line.slice(colonIdx + 1).trim();

    // Check for folded block scalar (>) or literal (|)
    if (valStr.startsWith('>') || valStr.startsWith('|')) {
      const isFolded = valStr.startsWith('>');
      const blockLines = [];
      let nextIdx = i + 1;
      let baseIndent = -1;

      while (nextIdx < lines.length) {
        const nextRaw = lines[nextIdx];
        const nextLineNum = nextIdx + 2;

        // Check if line is empty (empty lines in block scalars are valid)
        if (nextRaw.trim() === '') {
          blockLines.push('');
          nextIdx++;
          continue;
        }

        // Check for tabs in block scalar
        if (nextRaw.includes('\t')) {
          throw new FrontmatterError(`Folded/literal block scalar cannot contain tabs`, {
            file,
            line: nextLineNum,
            construct: 'block_scalar'
          });
        }

        const indentMatch = nextRaw.match(/^(\s+)/);
        if (!indentMatch) {
          // Block ended
          break;
        }

        const indentLen = indentMatch[1].length;
        if (baseIndent === -1) {
          baseIndent = indentLen;
        } else if (indentLen < baseIndent) {
          // Indentation decreased below base indent
          break;
        }

        blockLines.push(nextRaw.slice(baseIndent));
        nextIdx++;
      }

      i = nextIdx;

      let scalarValue = '';
      if (isFolded) {
        // Folded: lines joined by spaces, double newlines preserved
        let currentPara = [];
        const paragraphs = [];
        for (const bl of blockLines) {
          if (bl.trim() === '') {
            if (currentPara.length > 0) {
              paragraphs.push(currentPara.join(' '));
              currentPara = [];
            }
          } else {
            currentPara.push(bl.trim());
          }
        }
        if (currentPara.length > 0) {
          paragraphs.push(currentPara.join(' '));
        }
        scalarValue = paragraphs.join('\n\n') + '\n';
      } else {
        // Literal: newlines preserved
        scalarValue = blockLines.join('\n') + '\n';
      }

      result[key] = scalarValue;
      continue;
    }

    // Check for flow sequence: starts with `[`
    if (valStr.startsWith('[')) {
      // Check if it closes on the same line
      if (valStr.includes(']')) {
        result[key] = parseFlowSequence(valStr, lineNum, file);
        i++;
        continue;
      }

      // Multi-line flow sequence
      let seqStr = valStr;
      let nextIdx = i + 1;
      let closed = false;
      while (nextIdx < lines.length) {
        const nextRaw = lines[nextIdx];
        seqStr += ' ' + nextRaw.trim();
        if (nextRaw.includes(']')) {
          closed = true;
          nextIdx++;
          break;
        }
        nextIdx++;
      }

      if (!closed) {
        throw new FrontmatterError(`Unclosed flow sequence`, {
          file,
          line: lineNum,
          construct: 'flow_sequence'
        });
      }

      result[key] = parseFlowSequence(seqStr, lineNum, file);
      i = nextIdx;
      continue;
    }

    // Check for nested map or block sequence if valStr is empty
    if (valStr === '') {
      // Look ahead at next line
      if (i + 1 < lines.length && /^\s{2,}\S/.test(lines[i + 1])) {
        // Nested block
        const nextRaw = lines[i + 1];
        if (nextRaw.trim().startsWith('-')) {
          // Block sequence
          const listItems = [];
          let nextIdx = i + 1;
          while (nextIdx < lines.length) {
            const nl = lines[nextIdx];
            if (nl.trim() === '' || nl.trim().startsWith('#')) {
              nextIdx++;
              continue;
            }
            const matchItem = nl.match(/^\s+-\s+(.*)$/);
            if (!matchItem) {
              if (/^\S/.test(nl)) break;
              throw new FrontmatterError(`Invalid list item syntax in sequence`, {
                file,
                line: nextIdx + 2,
                construct: 'sequence'
              });
            }
            listItems.push(parseScalar(matchItem[1]));
            nextIdx++;
          }
          result[key] = listItems;
          i = nextIdx;
          continue;
        } else {
          // Nested map (one level)
          /** @type {Record<string, any>} */
          const nestedMap = {};
          let nextIdx = i + 1;
          let mapBaseIndent = -1;

          while (nextIdx < lines.length) {
            const nl = lines[nextIdx];
            const nlNum = nextIdx + 2;

            if (nl.trim() === '' || nl.trim().startsWith('#')) {
              nextIdx++;
              continue;
            }

            if (/^\S/.test(nl)) {
              // Exited nested map
              break;
            }

            const indentMatch = nl.match(/^(\s+)/);
            const indentLen = indentMatch ? indentMatch[1].length : 0;

            if (mapBaseIndent === -1) {
              mapBaseIndent = indentLen;
            } else if (indentLen > mapBaseIndent) {
              // Two levels of nesting detected - reject loudly!
              throw new FrontmatterError(`Unsupported YAML: more than one level of map nesting is not allowed`, {
                file,
                line: nlNum,
                construct: 'nested_map'
              });
            } else if (indentLen < mapBaseIndent) {
              break;
            }

            const subColon = nl.indexOf(':');
            if (subColon === -1) {
              throw new FrontmatterError(`Invalid key-value pair in nested map`, {
                file,
                line: nlNum,
                construct: 'nested_map'
              });
            }

            const subKey = nl.slice(0, subColon).trim();
            const subValStr = nl.slice(subColon + 1).trim();
            nestedMap[subKey] = parseScalar(subValStr);
            nextIdx++;
          }

          result[key] = nestedMap;
          i = nextIdx;
          continue;
        }
      } else {
        // Just an empty scalar
        result[key] = null;
        i++;
        continue;
      }
    }

    // Standard scalar
    result[key] = parseScalar(valStr);
    i++;
  }

  return result;
}

/**
 * Splits a document into frontmatter data object and body text.
 * @param {string} text
 * @param {string|null} [file=null]
 * @returns {{ data: Record<string, any>, body: string }}
 */
export function split(text, file = null) {
  return {
    data: parse(text, file),
    body: strip(text)
  };
}

/**
 * Wraps text into lines of at most maxLen characters at word boundaries.
 * @param {string} text
 * @param {number} maxLen
 * @returns {string[]}
 */
function wrapWords(text, maxLen = 72) {
  const words = text.trim().split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxLen) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

/**
 * Serializes data object and optional body into Markdown with YAML frontmatter.
 * @param {Record<string, any>} data
 * @param {string} [body='']
 * @returns {string}
 */
export function stringify(data, body = '') {
  if (!data || Object.keys(data).length === 0) {
    return body;
  }

  const lines = ['---'];

  for (const [key, value] of Object.entries(data)) {
    if (value === null) {
      lines.push(`${key}: null`);
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'number') {
      lines.push(`${key}: ${value}`);
    } else if (Array.isArray(value)) {
      // Flow sequence serialization
      const items = value.map(v => (v === null ? 'null' : String(v))).join(', ');
      lines.push(`${key}: [${items}]`);
    } else if (typeof value === 'object') {
      // Nested map (one level)
      lines.push(`${key}:`);
      for (const [subKey, subVal] of Object.entries(value)) {
        if (subVal === null) {
          lines.push(`  ${subKey}: null`);
        } else if (typeof subVal === 'boolean' || typeof subVal === 'number') {
          lines.push(`  ${subKey}: ${subVal}`);
        } else {
          lines.push(`  ${subKey}: ${subVal}`);
        }
      }
    } else if (typeof value === 'string') {
      // Check if string should be serialized as folded scalar (contains newline and wraps)
      if (value.includes('\n')) {
        lines.push(`${key}: >`);
        const clean = value.replace(/\r\n/g, '\n').trim();
        const paragraphs = clean.split(/\n\n+/);
        for (let p = 0; p < paragraphs.length; p++) {
          const wrapped = wrapWords(paragraphs[p], 72);
          for (const wl of wrapped) {
            lines.push(`  ${wl}`);
          }
          if (p < paragraphs.length - 1) {
            lines.push('');
          }
        }
      } else {
        lines.push(`${key}: ${value}`);
      }
    } else {
      lines.push(`${key}: ${String(value)}`);
    }
  }

  lines.push('---');
  const frontmatterStr = lines.join('\n') + '\n';
  return frontmatterStr + (body || '');
}
