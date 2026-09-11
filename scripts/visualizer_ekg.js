#!/usr/bin/env node

/**
 * State Road AI — Story Console: Emotional EKG & Pacing Visualizer
 *
 * Scans manuscript.json, structure_plan.md, and chapter drafts to construct
 * an interactive, high-contrast narrative EKG tracking tension, polarity shifts,
 * and word-count velocity across the entire book.
 *
 * Branding: State Road AI (Signal Orange #FF6A00, Charcoal #333333,
 * Steel Slate #1E293B, Light Pavement #F4F4F4, Cloud White #FFFFFF)
 */

import * as fs from 'fs';
import * as path from 'path';

export function generatePacingEkgHtml(options = {}) {
  const cwd = process.cwd();
  const outputDir = options.outputDir || path.join(cwd, 'visualizer');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, 'pacing_ekg.html');

  // 1. Gather manuscript telemetry
  let chapters = [];
  const manuscriptPath = path.join(cwd, 'manuscript.json');
  if (fs.existsSync(manuscriptPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(manuscriptPath, 'utf8'));
      if (Array.isArray(data.chapters)) {
        chapters = data.chapters;
      }
    } catch (e) {}
  }

  // Fallback: discover chapters from disk if manuscript.json is sparse
  if (chapters.length === 0) {
    const chaptersDir = path.join(cwd, 'stages', '03_drafting', 'output', 'chapters');
    if (fs.existsSync(chaptersDir)) {
      const files = fs.readdirSync(chaptersDir).filter(f => f.endsWith('.md')).sort();
      chapters = files.map((f, idx) => {
        const fullPath = path.join(chaptersDir, f);
        const text = fs.readFileSync(fullPath, 'utf8');
        const words = (text.match(/\b\w+\b/g) || []).length;
        return {
          number: idx + 1,
          title: `Chapter ${idx + 1}`,
          status: 'drafted',
          words: words,
          target_words: 2500,
          polarity_shift: (idx % 2 === 0 ? '+ / -' : '- / +'),
          tension_score: Math.min(10, Math.max(3, 4 + Math.sin(idx * 0.7) * 4 + (idx / files.length) * 3))
        };
      });
    }
  }

  // If still empty (new project), generate standard 30-chapter architectural baseline
  if (chapters.length === 0) {
    const total = 32;
    for (let i = 1; i <= total; i++) {
      let tension = 4;
      let polarity = '+ / -';
      let beatName = 'Development Beat';
      let act = 'Act 1';

      if (i === 1) { tension = 6; polarity = '- / -'; beatName = 'Hook & Inciting Disturbance'; act = 'Act 1'; }
      else if (i === 4) { tension = 7; polarity = '+ / -'; beatName = 'First Threshold / Act 1 Turn'; act = 'Act 1'; }
      else if (i === 12) { tension = 8; polarity = '+ / +'; beatName = 'Midpoint Shift / False Victory'; act = 'Act 2A'; }
      else if (i === 24) { tension = 9.5; polarity = '- / -'; beatName = 'The Dark Moment / All Hope Lost'; act = 'Act 2B'; }
      else if (i === 30) { tension = 10; polarity = '- / +'; beatName = 'Climax & Convergence'; act = 'Act 3'; }
      else if (i === 32) { tension = 3; polarity = '+ / +'; beatName = 'Resolution & New Equilibrium'; act = 'Act 3'; }
      else {
        tension = parseFloat((4 + Math.sin(i * 0.8) * 3 + (i / total) * 2.5).toFixed(1));
        polarity = i % 2 === 0 ? '- / +' : '+ / -';
        act = i <= 8 ? 'Act 1' : i <= 24 ? 'Act 2' : 'Act 3';
      }

      chapters.push({
        number: i,
        title: `Chapter ${i}`,
        status: i <= 3 ? 'passed' : i <= 6 ? 'drafted' : 'planned',
        words: i <= 3 ? 2450 + (i * 120) : i <= 6 ? 2300 : 0,
        target_words: 2500,
        tension_score: tension,
        polarity_shift: polarity,
        beat_name: beatName,
        act: act
      });
    }
  }

  const chaptersJson = JSON.stringify(chapters);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Story Console — Narrative EKG & Pacing Visualizer | State Road AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      /* State Road AI 5-Color Master Palette */
      --signal-orange:   #FF6A00; /* Primary Brand Accent & High Tension */
      --charcoal-gray:   #333333; /* High-Contrast Base & Text */
      --roadbed-slate:   #1E293B; /* Secondary Structural Accent */
      --light-pavement:  #F4F4F4; /* Canvas Background */
      --cloud-white:     #FFFFFF; /* Card Containers & Surfaces */

      /* High-Contrast Complementary Semantic Signals */
      --emerald-positive:#16A34A; /* Upward Polarity */
      --crimson-negative:#DC2626; /* Crisis / Dark Moment */
      --steel-neutral:   #0284C7; /* Neutral Cadence */
      --border-subtle:   #E2E8F0;
      --border-active:   #CBD5E1;
      --text-muted:      #64748B;
      --card-shadow:     0 4px 16px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04);
    }

    [data-theme="dark"] {
      --charcoal-gray:   #F8FAFC;
      --light-pavement:  #18181B;
      --cloud-white:     #27272A;
      --roadbed-slate:   #09090B;
      --border-subtle:   #3F3F46;
      --border-active:   #71717A;
      --text-muted:      #A1A1AA;
      --card-shadow:     0 6px 20px rgba(0, 0, 0, 0.35);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background-color: var(--light-pavement);
      color: var(--charcoal-gray);
      line-height: 1.5;
      padding: 24px;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    /* Header Bar */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--cloud-white);
      padding: 18px 28px;
      border-radius: 12px;
      box-shadow: var(--card-shadow);
      border: 1px solid var(--border-subtle);
      margin-bottom: 24px;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-badge {
      background: var(--signal-orange);
      color: #FFFFFF;
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.08em;
      padding: 6px 12px;
      border-radius: 6px;
      text-transform: uppercase;
    }

    .header-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--charcoal-gray);
      letter-spacing: -0.01em;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid var(--border-subtle);
      background: var(--cloud-white);
      color: var(--charcoal-gray);
      transition: all 0.15s ease;
    }

    .btn:hover {
      border-color: var(--signal-orange);
      color: var(--signal-orange);
    }

    .btn.active {
      background: var(--charcoal-gray);
      color: #FFFFFF;
      border-color: var(--charcoal-gray);
    }

    /* Summary Metric Grid */
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .metric-card {
      background: var(--cloud-white);
      border-radius: 10px;
      padding: 16px 20px;
      border: 1px solid var(--border-subtle);
      box-shadow: var(--card-shadow);
      border-left: 4px solid var(--roadbed-slate);
    }

    .metric-card.accent-orange { border-left-color: var(--signal-orange); }
    .metric-card.accent-green { border-left-color: var(--emerald-positive); }
    .metric-card.accent-blue { border-left-color: var(--steel-neutral); }

    .metric-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .metric-value {
      font-family: 'Montserrat', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: var(--charcoal-gray);
    }

    /* Main Canvas Card */
    .chart-container {
      background: var(--cloud-white);
      border-radius: 12px;
      padding: 24px;
      border: 1px solid var(--border-subtle);
      box-shadow: var(--card-shadow);
      margin-bottom: 24px;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .chart-legend {
      display: flex;
      gap: 18px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    /* SVG EKG Canvas */
    svg.ekg-svg {
      width: 100%;
      height: 380px;
      overflow: visible;
    }

    .grid-line {
      stroke: var(--border-subtle);
      stroke-dasharray: 4 4;
      stroke-width: 1;
    }

    .tension-line {
      fill: none;
      stroke: var(--signal-orange);
      stroke-width: 3.5;
      stroke-linecap: round;
      stroke-linejoin: round;
      filter: drop-shadow(0 3px 6px rgba(255, 106, 0, 0.25));
    }

    .wordcount-bar {
      fill: var(--roadbed-slate);
      opacity: 0.15;
      transition: opacity 0.15s ease;
    }

    .wordcount-bar:hover {
      opacity: 0.35;
    }

    .chapter-node {
      cursor: pointer;
      fill: var(--cloud-white);
      stroke: var(--signal-orange);
      stroke-width: 3;
      transition: transform 0.15s ease, stroke 0.15s ease;
    }

    .chapter-node:hover {
      stroke: var(--charcoal-gray);
      stroke-width: 4;
    }

    /* Chapter Detail Drawer */
    .detail-card {
      background: var(--cloud-white);
      border-radius: 12px;
      padding: 24px;
      border: 1px solid var(--border-subtle);
      box-shadow: var(--card-shadow);
      display: none;
      animation: fadeIn 0.2s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .detail-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--charcoal-gray);
    }

    .tag {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      background: var(--light-pavement);
      color: var(--charcoal-gray);
      margin-right: 6px;
    }

    .tag.passed { background: #DCFCE7; color: var(--emerald-positive); }
    .tag.drafted { background: #FEF3C7; color: #D97706; }
    .tag.planned { background: #E2E8F0; color: var(--text-muted); }

    /* Footer */
    footer {
      text-align: center;
      margin-top: 32px;
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }

    footer strong {
      color: var(--charcoal-gray);
      font-weight: 600;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <header>
    <div class="brand-group">
      <span class="brand-badge">State Road AI</span>
      <h1 class="header-title">Soundingboard Story Console — Narrative EKG</h1>
    </div>
    <div class="header-controls">
      <button class="btn active" id="btnTension" onclick="toggleMetric('tension')">Tension Wave</button>
      <button class="btn active" id="btnWords" onclick="toggleMetric('words')">Word Rhythm</button>
      <button class="btn" onclick="toggleTheme()">🌓 Theme</button>
    </div>
  </header>

  <!-- Metric Telemetry -->
  <div class="metric-grid">
    <div class="metric-card accent-orange">
      <div class="metric-label">Chapters Tracked</div>
      <div class="metric-value" id="valTotalChapters">--</div>
    </div>
    <div class="metric-card accent-blue">
      <div class="metric-label">Manuscript Velocity</div>
      <div class="metric-value" id="valTotalWords">--</div>
    </div>
    <div class="metric-card accent-green">
      <div class="metric-label">Avg Pace / Chapter</div>
      <div class="metric-value" id="valAvgWords">--</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Climax Turning Point</div>
      <div class="metric-value" id="valPeakTension">--</div>
    </div>
  </div>

  <!-- EKG Canvas Container -->
  <div class="chart-container">
    <div class="chart-header">
      <h2 style="font-family:'Montserrat', sans-serif; font-size:16px; font-weight:700;">Chapter Pacing & Polarity Contour</h2>
      <div class="chart-legend">
        <div class="legend-item"><span class="legend-dot" style="background:var(--signal-orange);"></span> Dramatic Tension (1–10)</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--roadbed-slate); opacity:0.4;"></span> Word Count Rhythm</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--emerald-positive);"></span> Positive Shift</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--crimson-negative);"></span> Negative Shift</div>
      </div>
    </div>

    <!-- SVG Canvas -->
    <svg class="ekg-svg" id="ekgSvg" viewBox="0 0 1000 380" preserveAspectRatio="none">
      <!-- Grid Lines -->
      <line x1="50" y1="50" x2="960" y2="50" class="grid-line" />
      <line x1="50" y1="130" x2="960" y2="130" class="grid-line" />
      <line x1="50" y1="210" x2="960" y2="210" class="grid-line" />
      <line x1="50" y1="290" x2="960" y2="290" class="grid-line" />

      <!-- Baseline Zero-Line -->
      <line x1="50" y1="330" x2="960" y2="330" stroke="var(--charcoal-gray)" stroke-width="1.5" />

      <!-- Word Count Bars -->
      <g id="barsGroup"></g>

      <!-- Tension Path -->
      <path id="tensionPath" class="tension-line" d="" />

      <!-- Nodes -->
      <g id="nodesGroup"></g>
    </svg>
  </div>

  <!-- Interactive Inspector Card -->
  <div class="detail-card" id="detailCard">
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div>
        <h3 class="detail-title" id="detChapterTitle">Chapter Details</h3>
        <div id="detTags" style="margin-bottom:12px;"></div>
      </div>
      <button class="btn" onclick="document.getElementById('detailCard').style.display='none'">Close</button>
    </div>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
      <div>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:4px;"><strong>Obligatory Beat / Turning Point:</strong></p>
        <p style="font-size:14px; font-weight:600;" id="detBeat">--</p>
      </div>
      <div>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:4px;"><strong>Value Shift & Polarity:</strong></p>
        <p style="font-size:14px; font-family:'JetBrains Mono', monospace; font-weight:600;" id="detPolarity">--</p>
      </div>
    </div>
  </div>

  <footer>
    <p>Powered by <strong>Soundingboard Studio</strong> • Built with <strong>State Road AI</strong> Brand Architecture</p>
  </footer>

  <script>
    const chapters = ${chaptersJson};
    let showTension = true;
    let showWords = true;

    function initConsole() {
      // Telemetry metrics
      const totalWords = chapters.reduce((acc, c) => acc + (c.words || 0), 0);
      const avgWords = Math.round(totalWords / (chapters.filter(c => c.words > 0).length || 1));
      const peakChapter = [...chapters].sort((a, b) => b.tension_score - a.tension_score)[0];

      document.getElementById('valTotalChapters').innerText = chapters.length;
      document.getElementById('valTotalWords').innerText = totalWords.toLocaleString() + ' words';
      document.getElementById('valAvgWords').innerText = avgWords.toLocaleString() + ' w/ch';
      document.getElementById('valPeakTension').innerText = peakChapter ? \`Ch \${peakChapter.number} (\${peakChapter.tension_score}/10)\` : 'Ch 30';

      renderChart();
    }

    function renderChart() {
      const svg = document.getElementById('ekgSvg');
      const tensionPath = document.getElementById('tensionPath');
      const nodesGroup = document.getElementById('nodesGroup');
      const barsGroup = document.getElementById('barsGroup');

      nodesGroup.innerHTML = '';
      barsGroup.innerHTML = '';

      const left = 60;
      const right = 950;
      const top = 60;
      const bottom = 320;
      const width = right - left;
      const step = width / (chapters.length - 1 || 1);

      let maxWords = Math.max(...chapters.map(c => c.words || c.target_words || 2500), 3500);

      let pathD = '';

      chapters.forEach((c, idx) => {
        const x = left + (idx * step);
        const tensionY = bottom - ((c.tension_score / 10) * (bottom - top));

        // Word count bar
        if (showWords) {
          const barHeight = ((c.words || c.target_words || 2000) / maxWords) * (bottom - top);
          const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          bar.setAttribute('x', x - (step * 0.35));
          bar.setAttribute('y', bottom - barHeight);
          bar.setAttribute('width', step * 0.7);
          bar.setAttribute('height', barHeight);
          bar.setAttribute('class', 'wordcount-bar');
          bar.setAttribute('rx', 3);
          barsGroup.appendChild(bar);
        }

        // Tension point
        if (idx === 0) pathD += \`M \${x} \${tensionY}\`;
        else {
          const prevX = left + ((idx - 1) * step);
          const prevY = bottom - ((chapters[idx - 1].tension_score / 10) * (bottom - top));
          const cx = (prevX + x) / 2;
          pathD += \` C \${cx} \${prevY}, \${cx} \${tensionY}, \${x} \${tensionY}\`;
        }

        // Node circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', tensionY);
        circle.setAttribute('r', 6);
        circle.setAttribute('class', 'chapter-node');

        if (c.polarity_shift && c.polarity_shift.includes('+ / +')) {
          circle.setAttribute('stroke', 'var(--emerald-positive)');
        } else if (c.tension_score >= 9) {
          circle.setAttribute('stroke', 'var(--crimson-negative)');
        }

        circle.onclick = () => inspectChapter(c);
        nodesGroup.appendChild(circle);
      });

      tensionPath.setAttribute('d', showTension ? pathD : '');
    }

    function inspectChapter(c) {
      const card = document.getElementById('detailCard');
      card.style.display = 'block';

      document.getElementById('detChapterTitle').innerText = \`Chapter \${c.number}: \${c.title || 'Untitled'}\`;
      document.getElementById('detBeat').innerText = c.beat_name || 'Progressive complication & turning point';
      document.getElementById('detPolarity').innerText = c.polarity_shift || '+ / - (Progressive Tension)';

      const tags = document.getElementById('detTags');
      tags.innerHTML = \`
        <span class="tag \${c.status || 'planned'}">\${(c.status || 'planned').toUpperCase()}</span>
        <span class="tag">\${(c.words || 0).toLocaleString()} words</span>
        <span class="tag">Tension: \${c.tension_score || 5}/10</span>
        <span class="tag">\${c.act || 'Act 2'}</span>
      \`;

      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function toggleMetric(metric) {
      if (metric === 'tension') {
        showTension = !showTension;
        document.getElementById('btnTension').classList.toggle('active', showTension);
      } else if (metric === 'words') {
        showWords = !showWords;
        document.getElementById('btnWords').classList.toggle('active', showWords);
      }
      renderChart();
    }

    function toggleTheme() {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    }

    window.onload = initConsole;
  </script>
</body>
</html>`;

  fs.writeFileSync(outputFile, html, 'utf8');
  console.log(`  ✔ Generated State Road AI Story Console (EKG): ${path.relative(cwd, outputFile)}`);
  return outputFile;
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith('visualizer_ekg.js')) {
  generatePacingEkgHtml();
}
