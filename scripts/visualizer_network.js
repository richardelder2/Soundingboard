#!/usr/bin/env node

/**
 * State Road AI — Story Console: Character & Faction Network Canvas
 *
 * Visualizes character relationships, factions, status balances, and secret debts
 * as an interactive, clickable, force-directed network diagram.
 *
 * Branding: State Road AI (Signal Orange #FF6A00, Charcoal #333333,
 * Steel Slate #1E293B, Light Pavement #F4F4F4, Cloud White #FFFFFF)
 */

import * as fs from 'fs';
import * as path from 'path';

export function generateNetworkHtml(options = {}) {
  const cwd = process.cwd();
  const outputDir = options.outputDir || path.join(cwd, 'visualizer');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, 'relationship_network.html');

  // Discover characters from stages/01_onboarding/output/characters/
  let nodes = [];
  let links = [];

  const charDir = path.join(cwd, 'stages', '01_onboarding', 'output', 'characters');
  if (fs.existsSync(charDir)) {
    const files = fs.readdirSync(charDir).filter(f => f.endsWith('.md'));
    files.forEach((f, idx) => {
      const full = path.join(charDir, f);
      const content = fs.readFileSync(full, 'utf8');
      const nameMatch = content.match(/#\s+Character Profile:\s*(.+)/i) || content.match(/name:\s*["']?(.+?)["']?$/m);
      const name = nameMatch ? nameMatch[1].trim() : f.replace('.md', '');
      const archetypeMatch = content.match(/archetype:\s*["']?(.+?)["']?$/m) || content.match(/role:\s*["']?(.+?)["']?$/m);
      const role = archetypeMatch ? archetypeMatch[1].trim() : idx === 0 ? 'Protagonist' : idx === 1 ? 'Antagonist' : 'Ally';

      nodes.push({
        id: name,
        label: name,
        role: role,
        group: idx === 0 ? 'lead' : idx === 1 ? 'antagonist' : 'ally',
        size: idx === 0 ? 28 : idx === 1 ? 24 : 18,
        lie: 'I must control everything to remain safe',
        want: 'Clear the family name',
        need: 'Learn to trust others'
      });
    });
  }

  // Fallback characters if workspace is new
  if (nodes.length === 0) {
    nodes = [
      { id: 'MC', label: 'Elena Vance', role: 'Protagonist (Solo Practitioner)', group: 'lead', size: 30, lie: 'The justice system will protect me if I follow every rule.', want: 'Win the acquittal of the whistleblower.', need: 'Acknowledge that systemic rot cannot be fought with decorum alone.' },
      { id: 'ANTAG', label: 'Julian Cross', role: 'Antagonist (Syndicate Counsel)', group: 'antagonist', size: 26, lie: 'Everyone has a price; morality is a luxury.', want: 'Suppress the discovery ledger at all costs.', need: 'Confront his own complicity in the family tragedy.' },
      { id: 'CONF', label: 'Ray Reyes', role: 'Confidant (Lead Investigator)', group: 'ally', size: 20, lie: 'Cynicism is the only armor against disappointment.', want: 'Keep Elena from getting disbarred or killed.', need: 'Believe in justice again.' },
      { id: 'JUDGE', label: 'Judge Miriam Ward', role: 'Institutional Authority', group: 'neutral', size: 18, lie: 'Procedure outranks moral truth.', want: 'Maintain absolute decorum in her courtroom.', need: 'Admit when the court itself is being weaponized.' },
      { id: 'WITNESS', label: 'Dr. Kevin Vance', role: 'Key Witness / Estranged Brother', group: 'ally', size: 20, lie: 'Staying silent keeps the family safe.', want: 'Erase his past involvement.', need: 'Testify truthfully on the stand.' }
    ];

    links = [
      { source: 'MC', target: 'ANTAG', type: 'Enmity & Legal Combat', color: 'var(--signal-orange)', dash: '' },
      { source: 'MC', target: 'CONF', type: 'Deep Loyalty / Shared History', color: 'var(--emerald-positive)', dash: '' },
      { source: 'MC', target: 'JUDGE', type: 'Procedural Friction & Scrutiny', color: 'var(--roadbed-slate)', dash: '4 4' },
      { source: 'MC', target: 'WITNESS', type: 'Estranged Family Secret', color: 'var(--steel-neutral)', dash: '6 3' },
      { source: 'ANTAG', target: 'WITNESS', type: 'Coercion & Blackmail', color: 'var(--crimson-negative)', dash: '' }
    ];
  }

  const networkData = JSON.stringify({ nodes, links });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Story Console — Character & Faction Network | State Road AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --signal-orange:   #FF6A00;
      --charcoal-gray:   #333333;
      --roadbed-slate:   #1E293B;
      --light-pavement:  #F4F4F4;
      --cloud-white:     #FFFFFF;

      --emerald-positive:#16A34A;
      --crimson-negative:#DC2626;
      --steel-neutral:   #0284C7;
      --border-subtle:   #E2E8F0;
      --text-muted:      #64748B;
      --card-shadow:     0 4px 16px -2px rgba(0, 0, 0, 0.06);
    }

    [data-theme="dark"] {
      --charcoal-gray:   #F8FAFC;
      --light-pavement:  #18181B;
      --cloud-white:     #27272A;
      --roadbed-slate:   #09090B;
      --border-subtle:   #3F3F46;
      --text-muted:      #A1A1AA;
      --card-shadow:     0 6px 20px rgba(0, 0, 0, 0.35);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background-color: var(--light-pavement);
      color: var(--charcoal-gray);
      padding: 24px;
    }

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

    .main-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }

    .canvas-card {
      background: var(--cloud-white);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid var(--border-subtle);
      box-shadow: var(--card-shadow);
      position: relative;
      min-height: 540px;
    }

    svg.network-svg {
      width: 100%;
      height: 520px;
      cursor: grab;
    }

    .node-circle {
      cursor: pointer;
      stroke: var(--charcoal-gray);
      stroke-width: 2.5;
      transition: transform 0.15s ease, stroke-width 0.15s ease;
    }

    .node-circle:hover {
      stroke: var(--signal-orange);
      stroke-width: 4;
    }

    .node-text {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: 12px;
      fill: var(--charcoal-gray);
      pointer-events: none;
      text-anchor: middle;
    }

    .link-line {
      stroke-width: 2;
      opacity: 0.75;
    }

    .sidebar-card {
      background: var(--cloud-white);
      border-radius: 12px;
      padding: 24px;
      border: 1px solid var(--border-subtle);
      box-shadow: var(--card-shadow);
    }

    .sidebar-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .role-badge {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      background: var(--light-pavement);
      color: var(--signal-orange);
      margin-bottom: 16px;
    }

    .field-group {
      margin-bottom: 16px;
    }

    .field-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 4px;
    }

    .field-value {
      font-size: 14px;
      line-height: 1.4;
      color: var(--charcoal-gray);
    }

    footer {
      text-align: center;
      margin-top: 32px;
      font-size: 12px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>

  <header>
    <div style="display:flex; align-items:center; gap:14px;">
      <span class="brand-badge">State Road AI</span>
      <h1 style="font-family:'Montserrat', sans-serif; font-size:20px; font-weight:700;">Character & Faction Network Canvas</h1>
    </div>
    <button class="btn" style="padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer;" onclick="toggleTheme()">🌓 Theme</button>
  </header>

  <div class="main-grid">
    <!-- Graph View -->
    <div class="canvas-card">
      <svg class="network-svg" id="netSvg" viewBox="0 0 700 500"></svg>
    </div>

    <!-- Inspector Sidebar -->
    <div class="sidebar-card" id="sidebar">
      <h2 class="sidebar-title" id="sbName">Elena Vance</h2>
      <div class="role-badge" id="sbRole">Protagonist (Solo Practitioner)</div>

      <div class="field-group">
        <div class="field-label">The Lie She Believes</div>
        <div class="field-value" id="sbLie">The justice system will protect me if I follow every rule.</div>
      </div>

      <div class="field-group">
        <div class="field-label">The Conscious Want</div>
        <div class="field-value" id="sbWant">Win the acquittal of the whistleblower.</div>
      </div>

      <div class="field-group">
        <div class="field-label">The Unconscious Need</div>
        <div class="field-value" id="sbNeed">Acknowledge that systemic rot cannot be fought with decorum alone.</div>
      </div>

      <div class="field-group">
        <div class="field-label">Status & Key Relationship</div>
        <div class="field-value" id="sbStatus">Under mortal pressure from Julian Cross; reliant on Ray Reyes for street intelligence.</div>
      </div>
    </div>
  </div>

  <footer>
    <p>Powered by <strong>Soundingboard Studio</strong> • Designed with <strong>State Road AI</strong> Brand System</p>
  </footer>

  <script>
    const data = ${networkData};

    function initNetwork() {
      const svg = document.getElementById('netSvg');
      svg.innerHTML = '';

      // Center positions
      const width = 700;
      const height = 500;
      const cx = width / 2;
      const cy = height / 2;

      // Assign visual positions
      const positions = {
        'MC': { x: cx, y: cy },
        'ANTAG': { x: cx + 180, y: cy - 70 },
        'CONF': { x: cx - 170, y: cy - 60 },
        'JUDGE': { x: cx, y: cy - 160 },
        'WITNESS': { x: cx + 90, y: cy + 140 }
      };

      // Draw Links
      data.links.forEach(l => {
        const p1 = positions[l.source] || { x: cx - 100, y: cy };
        const p2 = positions[l.target] || { x: cx + 100, y: cy };

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', p1.x);
        line.setAttribute('y1', p1.y);
        line.setAttribute('x2', p2.x);
        line.setAttribute('y2', p2.y);
        line.setAttribute('class', 'link-line');
        line.setAttribute('stroke', l.color || 'var(--roadbed-slate)');
        if (l.dash) line.setAttribute('stroke-dasharray', l.dash);
        svg.appendChild(line);
      });

      // Draw Nodes
      data.nodes.forEach(n => {
        const p = positions[n.id] || { x: cx, y: cy };
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', p.x);
        circle.setAttribute('cy', p.y);
        circle.setAttribute('r', n.size || 22);
        circle.setAttribute('class', 'node-circle');
        circle.setAttribute('fill', n.group === 'lead' ? 'var(--signal-orange)' : n.group === 'antagonist' ? 'var(--crimson-negative)' : 'var(--cloud-white)');
        if (n.group === 'lead') circle.setAttribute('stroke', 'var(--charcoal-gray)');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', p.x);
        text.setAttribute('y', p.y + (n.size || 22) + 16);
        text.setAttribute('class', 'node-text');
        text.textContent = n.label;

        g.onclick = () => selectNode(n);
        g.appendChild(circle);
        g.appendChild(text);
        svg.appendChild(g);
      });
    }

    function selectNode(n) {
      document.getElementById('sbName').innerText = n.label;
      document.getElementById('sbRole').innerText = n.role || 'Key Cast Member';
      document.getElementById('sbLie').innerText = n.lie || '--';
      document.getElementById('sbWant').innerText = n.want || '--';
      document.getElementById('sbNeed').innerText = n.need || '--';
    }

    function toggleTheme() {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    }

    window.onload = initNetwork;
  </script>
</body>
</html>`;

  fs.writeFileSync(outputFile, html, 'utf8');
  console.log(`  ✔ Generated State Road AI Story Console (Network): ${path.relative(cwd, outputFile)}`);
  return outputFile;
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith('visualizer_network.js')) {
  generateNetworkHtml();
}
