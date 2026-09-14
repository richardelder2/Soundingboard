#!/usr/bin/env node
/**
 * Soundingboard 2.0 - Thread Lane Visualizer (SB2-P3-02)
 * Zero runtime dependencies; built-in Node only.
 *
 * Core Mandates (PRD §16.4):
 * 1. Dual Renderers:
 *    - Instant Terminal ASCII View: Dense, high-legibility CLI rendering.
 *    - Standalone Interactive HTML Lane View: Zero external CDN, self-contained interactive SVG/HTML
 *      displaying cumulative word count X-axis, vertical polarity (+1 / 0 / -1),
 *      braid points, and dormancy silence gaps.
 * 2. Visual Reporting (Never Scoring):
 *    - Horizontal axis: Cumulative word count (words, not arbitrary scene intervals).
 *    - Vertical position in lane: Value polarity (+1 positive turn, 0 neutral, -1 negative turn).
 *    - Unknown shift distinct mark: Clear visual indication for scenes with unrecorded value shift.
 *    - Braid points marked: Explicit glyph when multiple threads converge in a single scene.
 *    - Dormancy gaps highlighted: Visual shading for gaps exceeding the threshold.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  loadThreadTracker,
  loadOrderedScenes,
  evaluateOrphanScenes,
  evaluateThreadDormancy,
  evaluatePolarityTurns,
  formatThreadAsciiLanes,
  parsePolarity,
  DEFAULT_DORMANCY_THRESHOLD
} from './threads.js';

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Builds the standalone interactive HTML Thread Lane Visualizer.
 * @param {object} [options]
 * @param {string} [options.rootDir=process.cwd()]
 * @param {number} [options.threshold]
 * @param {string} [options.outputDir]
 * @returns {string} Absolute path to generated HTML file
 */
export function generateThreadLaneHtml(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const outputDir = options.outputDir || path.join(rootDir, 'stages', '04_diagnostics_edits', 'output', 'reports');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, 'thread_lanes.html');

  const tracker = loadThreadTracker(rootDir);
  const scenes = loadOrderedScenes(rootDir);
  const globalThreshold = options.threshold || tracker.dormancyThresholdWords || DEFAULT_DORMANCY_THRESHOLD;

  const totalWords = scenes.length > 0 ? scenes[scenes.length - 1].cumEnd : 0;
  const orphanResult = evaluateOrphanScenes(scenes);

  // Ensure all threads present in scenes are represented
  const allThreads = [...tracker.threads];
  const knownIds = new Set(allThreads.map(t => t.id));
  scenes.forEach(sc => {
    if (Array.isArray(sc.threads)) {
      sc.threads.forEach(thId => {
        if (!knownIds.has(thId)) {
          knownIds.add(thId);
          allThreads.push({
            id: thId,
            name: `Subplot ${thId}`,
            type: 'subplot',
            spine: false,
            valueSpectrum: 'Unspecified',
            dormancyThreshold: null,
            status: 'open'
          });
        }
      });
    }
  });

  // Compute diagnostics per thread
  const threadData = allThreads.map(t => {
    const dormancy = evaluateThreadDormancy(t, scenes, globalThreshold);
    const polarity = evaluatePolarityTurns(t, scenes);

    // Collect scene occurrences for this thread
    const appearances = [];
    scenes.forEach(sc => {
      if (sc.threads && sc.threads.includes(t.id)) {
        const polIn = parsePolarity(sc.value_in);
        const polOut = parsePolarity(sc.value_out);
        const pol = polOut !== null ? polOut : polIn;
        const isBraid = sc.threads.length >= 2;

        appearances.push({
          sceneId: sc.id,
          chapter: sc.chapter,
          title: sc.id,
          wordCount: sc.wordCount,
          cumStart: sc.cumStart,
          cumEnd: sc.cumEnd,
          midWord: Math.floor((sc.cumStart + sc.cumEnd) / 2),
          valueIn: sc.value_in,
          valueOut: sc.value_out,
          polarity: pol, // 1, -1, 0, or null
          isBraid,
          threads: sc.threads
        });
      }
    });

    return {
      thread: t,
      dormancy,
      polarity,
      appearances
    };
  });

  // Calculate layout coordinates
  const svgWidth = 1100;
  const laneHeight = 120;
  const laneHeaderWidth = 260;
  const chartWidth = svgWidth - laneHeaderWidth - 40;
  const totalLanes = Math.max(1, threadData.length);
  const svgHeight = totalLanes * laneHeight + 80;

  function wordToX(w) {
    if (totalWords <= 0) return laneHeaderWidth;
    return laneHeaderWidth + Math.round((w / totalWords) * chartWidth);
  }

  // Generate SVG Lane Content
  const svgElements = [];

  // 1. Background Grid & Vertical Word Count Ticks
  const tickCount = 6;
  for (let i = 0; i <= tickCount; i++) {
    const tickWord = Math.round((i / tickCount) * totalWords);
    const x = wordToX(tickWord);
    svgElements.push(`
      <line x1="${x}" y1="30" x2="${x}" y2="${svgHeight - 40}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3" />
      <text x="${x}" y="${svgHeight - 20}" font-size="11" fill="#64748b" text-anchor="middle" font-family="monospace">${tickWord.toLocaleString()}w</text>
    `);
  }

  // 2. Render Each Thread Lane
  threadData.forEach((td, idx) => {
    const t = td.thread;
    const yTop = idx * laneHeight + 40;
    const yMid = yTop + (laneHeight - 20) / 2;
    const yPositive = yMid - 30;
    const yNegative = yMid + 30;

    const isSpine = t.spine;
    const laneBg = isSpine ? '#f8fafc' : '#ffffff';

    // Lane Box & Header
    svgElements.push(`
      <g class="thread-lane" data-thread="${escapeHtml(t.id)}">
        <!-- Lane Background -->
        <rect x="10" y="${yTop}" width="${svgWidth - 20}" height="${laneHeight - 20}" rx="6" fill="${laneBg}" stroke="#cbd5e1" stroke-width="1" />
        
        <!-- Lane Label -->
        <text x="25" y="${yTop + 24}" font-size="14" font-weight="bold" fill="${isSpine ? '#0f172a' : '#334155'}" font-family="sans-serif">
          ${escapeHtml(t.id)} ${isSpine ? '<tspan fill="#f97316" font-size="11">[SPINE]</tspan>' : ''}
        </text>
        <text x="25" y="${yTop + 42}" font-size="12" fill="#475569" font-family="sans-serif">
          ${escapeHtml(t.name)}
        </text>
        <text x="25" y="${yTop + 60}" font-size="11" fill="#64748b" font-family="sans-serif">
          Value: ${escapeHtml(t.valueSpectrum || 'Unspecified')}
        </text>
        <text x="25" y="${yTop + 78}" font-size="11" fill="${td.dormancy.isDormant ? '#ef4444' : '#10b981'}" font-weight="bold" font-family="sans-serif">
          ${td.dormancy.isDormant ? '⚠️ DORMANT SUBPLOT' : '✔ Active Thread'}
        </text>

        <!-- Lane Center Baseline -->
        <line x1="${laneHeaderWidth}" y1="${yMid}" x2="${laneHeaderWidth + chartWidth}" y2="${yMid}" stroke="#cbd5e1" stroke-width="1" />
        
        <!-- Subtle Polarity Polarity Guidemarks -->
        <text x="${laneHeaderWidth - 10}" y="${yPositive + 4}" font-size="9" fill="#10b981" text-anchor="end" font-family="monospace">(+)</text>
        <text x="${laneHeaderWidth - 10}" y="${yMid + 3}" font-size="9" fill="#94a3b8" text-anchor="end" font-family="monospace">(0)</text>
        <text x="${laneHeaderWidth - 10}" y="${yNegative + 4}" font-size="9" fill="#f43f5e" text-anchor="end" font-family="monospace">(-)</text>
    `);

    // Highlight Dormancy Gaps
    if (td.dormancy.gaps && td.dormancy.gaps.length > 0) {
      td.dormancy.gaps.filter(g => g.exceedsThreshold).forEach(g => {
        const fromSc = scenes.find(s => s.id === g.fromScene);
        const toSc = scenes.find(s => s.id === g.toScene) || scenes[scenes.length - 1];
        const startW = fromSc ? fromSc.cumEnd : 0;
        const endW = toSc ? toSc.cumStart : totalWords;
        const x1 = wordToX(startW);
        const x2 = wordToX(endW);
        const width = Math.max(6, x2 - x1);
        const gapWords = typeof g.words === 'number' ? g.words : 0;
        svgElements.push(`
          <rect x="${x1}" y="${yTop + 4}" width="${width}" height="${laneHeight - 28}" fill="rgba(239, 68, 68, 0.12)" stroke="rgba(239, 68, 68, 0.3)" stroke-dasharray="2,2">
            <title>Dormancy Gap: ${gapWords.toLocaleString()}w between ${g.fromScene} and ${g.toScene}</title>
          </rect>
        `);
      });
    }

    // Connect trajectory line between appearances
    if (td.appearances.length > 1) {
      const points = td.appearances.map(a => {
        const x = wordToX(a.midWord);
        const y = a.polarity === 1 ? yPositive : a.polarity === -1 ? yNegative : yMid;
        return `${x},${y}`;
      }).join(' ');

      svgElements.push(`
        <polyline points="${points}" fill="none" stroke="${isSpine ? '#f97316' : '#6366f1'}" stroke-width="2" opacity="0.75" />
      `);
    }

    // Render Marks for Each Scene
    td.appearances.forEach(app => {
      const x = wordToX(app.midWord);
      const isNullShift = app.polarity === null;
      const y = app.polarity === 1 ? yPositive : app.polarity === -1 ? yNegative : yMid;
      const fillColor = app.polarity === 1 ? '#10b981' : app.polarity === -1 ? '#f43f5e' : (isNullShift ? '#94a3b8' : '#3b82f6');
      const radius = app.isBraid ? 8 : 6;

      const tooltip = `Scene: ${app.sceneId} (${app.chapter})\nWords: ${app.cumStart.toLocaleString()}w - ${app.cumEnd.toLocaleString()}w\nValue Shift: ${app.valueIn || 'null'} ➔ ${app.valueOut || 'null'}\nPolarity: ${app.polarity === 1 ? 'Positive (+)' : app.polarity === -1 ? 'Negative (-)' : app.polarity === 0 ? 'Neutral (0)' : 'UNRECORDED (Coverage Gap)'}${app.isBraid ? '\nBraid Point: Bound to ' + app.threads.join(', ') : ''}`;

      if (app.isBraid) {
        // Braid point: Star polygon
        svgElements.push(`
          <g class="scene-node" tabindex="0">
            <title>${escapeHtml(tooltip)}</title>
            <polygon points="${x},${y-7} ${x+2},${y-2} ${x+7},${y-2} ${x+3},${y+2} ${x+5},${y+7} ${x},${y+4} ${x-5},${y+7} ${x-3},${y+2} ${x-7},${y-2} ${x-2},${y-2}" fill="${fillColor}" stroke="#1e293b" stroke-width="1.5" />
          </g>
        `);
      } else if (isNullShift) {
        // Unrecorded shift: Hollow square
        svgElements.push(`
          <g class="scene-node" tabindex="0">
            <title>${escapeHtml(tooltip)}</title>
            <rect x="${x-5}" y="${y-5}" width="10" height="10" fill="#ffffff" stroke="#94a3b8" stroke-width="2" stroke-dasharray="2,2" />
          </g>
        `);
      } else {
        // Standard circle
        svgElements.push(`
          <g class="scene-node" tabindex="0">
            <title>${escapeHtml(tooltip)}</title>
            <circle cx="${x}" cy="${y}" r="${radius}" fill="${fillColor}" stroke="#ffffff" stroke-width="1.5" />
          </g>
        `);
      }
    });

    svgElements.push('</g>');
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Soundingboard 2.0 — Thread Lane Visualizer</title>
<style>
  :root {
    --bg: #0f172a;
    --card-bg: #1e293b;
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --border: #334155;
    --spine: #f97316;
    --pos: #10b981;
    --neg: #f43f5e;
    --braid: #a855f7;
    --null-mark: #cbd5e1;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
  }
  header {
    max-width: 1140px;
    margin: 0 auto 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid var(--border);
    padding-bottom: 1rem;
  }
  h1 { margin: 0; font-size: 1.6rem; font-weight: 700; }
  .subtitle { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.3rem; }
  .badge { display: inline-block; padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
  .badge-health { background: rgba(16, 185, 129, 0.2); color: var(--pos); border: 1px solid var(--pos); }
  .badge-alert { background: rgba(244, 63, 94, 0.2); color: var(--neg); border: 1px solid var(--neg); }

  .summary-cards {
    max-width: 1140px;
    margin: 0 auto 1.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }
  .card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
  }
  .card-label { font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600; }
  .card-val { font-size: 1.5rem; font-weight: 700; margin-top: 0.4rem; font-family: monospace; }

  .legend-panel {
    max-width: 1140px;
    margin: 0 auto 1.5rem;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.8rem 1.2rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.5rem;
    font-size: 0.85rem;
  }
  .legend-item { display: flex; align-items: center; gap: 0.5rem; }
  .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
  .dot-pos { background: var(--pos); }
  .dot-neg { background: var(--neg); }
  .dot-braid { color: #f97316; font-size: 1.2rem; line-height: 1; }
  .dot-null { width: 10px; height: 10px; border: 2px dashed #94a3b8; background: #ffffff; border-radius: 2px; }

  .chart-wrapper {
    max-width: 1140px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    overflow-x: auto;
  }
  svg { display: block; }
  .scene-node { cursor: pointer; transition: transform 0.15s ease; outline: none; }
  .scene-node:hover { transform: scale(1.4); }

  footer {
    max-width: 1140px;
    margin: 2rem auto 0;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.85rem;
  }
</style>
</head>
<body>

<header>
  <div>
    <h1>Thread Lane Visualizer (PRD §16.4)</h1>
    <div class="subtitle">Multi-Thread Narrative Trajectory & Dormancy Sentry</div>
  </div>
  <div>
    <span class="badge ${orphanResult.passed ? 'badge-health' : 'badge-alert'}">
      ${orphanResult.passed ? '✔ Orphan Guard Clean' : '❌ Orphan Scenes Detected'}
    </span>
  </div>
</header>

<div class="summary-cards">
  <div class="card">
    <div class="card-label">Total Word Count</div>
    <div class="card-val">${totalWords.toLocaleString()}w</div>
  </div>
  <div class="card">
    <div class="card-label">Active Threads</div>
    <div class="card-val">${tracker.threads.length}</div>
  </div>
  <div class="card">
    <div class="card-label">Total Scenes Examined</div>
    <div class="card-val">${scenes.length}</div>
  </div>
  <div class="card">
    <div class="card-label">Dormancy Threshold</div>
    <div class="card-val">${globalThreshold.toLocaleString()}w</div>
  </div>
</div>

<div class="legend-panel">
  <div class="legend-item"><span class="dot dot-pos"></span> Positive Polarity Turn (+)</div>
  <div class="legend-item"><span class="dot dot-neg"></span> Negative Polarity Turn (-)</div>
  <div class="legend-item"><span class="dot-braid">★</span> Braid Point (Multiple Threads)</div>
  <div class="legend-item"><span class="dot-null"></span> Unrecorded Value Shift (Coverage Gap)</div>
  <div class="legend-item" style="color: #ef4444;"><span style="display:inline-block; width:14px; height:10px; background:rgba(239, 68, 68, 0.3); border:1px dashed #ef4444;"></span> Dormancy Silence Gap (&gt; ${globalThreshold.toLocaleString()}w)</div>
</div>

<div class="chart-wrapper">
  <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
    ${svgElements.join('\n')}
  </svg>
</div>

<footer>
  <p>Soundingboard 2.0 Studio Console • Ground Truth in Frontmatter • Zero Runtime Dependencies</p>
</footer>

</body>
</html>
`;

  fs.writeFileSync(outputFile, html, 'utf8');
  return outputFile;
}

/**
 * CLI Runner for Thread Visualizer
 * @param {object} [options]
 */
export function runThreadVisualizerCli(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const tracker = loadThreadTracker(rootDir);
  const scenes = loadOrderedScenes(rootDir);

  console.log('\n========================================');
  console.log('   Soundingboard Thread Lane Visualizer (SB2-P3-02)');
  console.log('========================================\n');

  // 1. Render ASCII View in Terminal
  console.log(formatThreadAsciiLanes(tracker.threads, scenes));

  // 2. Generate Interactive HTML View
  const htmlPath = generateThreadLaneHtml(options);
  console.log(`\x1b[32m✔ Interactive HTML Thread Lane View generated:\x1b[0m ${htmlPath}`);
  console.log('  Open in browser to inspect interactive trajectories, braid points, and value shifts.\n');

  return { htmlPath };
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith('thread_visualizer.js')) {
  const args = process.argv.slice(2);
  const thresholdArg = args.find(a => a.startsWith('--threshold='));
  const threshold = thresholdArg ? parseInt(thresholdArg.split('=')[1], 10) : undefined;
  runThreadVisualizerCli({ threshold });
}
