import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DRAFTS_DIR = path.resolve(__dirname, '../stages/03_drafting/output/chapters');
const REPORT_DIR = path.resolve(__dirname, '../stages/04_diagnostics_edits/output');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function auditAudiobookCadence(filePath) {
  if (!fs.existsSync(filePath)) return { error: 'File not found: ' + filePath };
  const rawText = fs.readFileSync(filePath, 'utf8');
  const text = rawText.replace(/^#+\s+.*$/gm, '').replace(/[*_`]/g, '');
  const words = text.match(/\b[A-Za-z0-9'-]+\b/g) || [];
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z"“])/g) || [];
  const findings = {
    breathRunOns: [],
    attributionLags: [],
    sibilanceHotspots: [],
    tongueTwisters: []
  };

  for (const sent of sentences) {
    const raw = sent.trim();
    if (!raw) continue;
    const breathSegments = raw.split(/[,;:—–-]|\.\.\./);
    for (const seg of breathSegments) {
      const segWords = seg.match(/\b[A-Za-z0-9'-]+\b/g) || [];
      if (segWords.length > 32) {
        findings.breathRunOns.push({ wordCount: segWords.length, snippet: seg.trim().slice(0, 100) });
      }
    }
    const letters = raw.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (letters.length > 35) {
      const sibilants = (letters.match(/[sz]|sh|ch/g) || []).length;
      if (sibilants / letters.length > 0.18 && sibilants >= 8) {
        findings.sibilanceHotspots.push({
          ratio: ((sibilants / letters.length) * 100).toFixed(1) + '%',
          count: sibilants,
          sentence: raw.slice(0, 120)
        });
      }
    }
    const wList = raw.match(/\b[A-Za-z]+\b/g) || [];
    for (let w = 0; w < wList.length - 2; w++) {
      const a = wList[w].toLowerCase();
      const b = wList[w + 1].toLowerCase();
      const c = wList[w + 2].toLowerCase();
      if (a[0] === b[0] && b[0] === c[0] && ['p', 'b', 't', 'd', 'k', 'g', 's', 'f'].includes(a[0])) {
        findings.tongueTwisters.push({
          cluster: wList[w] + ' ' + wList[w + 1] + ' ' + wList[w + 2],
          sentence: raw.slice(0, 120)
        });
      }
    }
  }

  const diagRegex = /["“]([^"”]+)["”]([\s\S]{0,80})/g;
  let m;
  while ((m = diagRegex.exec(text)) !== null) {
    const spoken = m[1].trim();
    const tag = m[2].trim();
    const spkWords = spoken.match(/\b[A-Za-z0-9'-]+\b/g) || [];
    if (spkWords.length > 28 && /\b(said|asked|whispered|growled|replied|muttered|snapped|shouted|yelled|hissed|laughed)\b/i.test(tag)) {
      findings.attributionLags.push({ wordCount: spkWords.length, dialogue: spoken.slice(0, 80) });
    }
  }

  const penalty = (findings.breathRunOns.length * 6) +
                  (findings.attributionLags.length * 5) +
                  (findings.sibilanceHotspots.length * 3) +
                  (findings.tongueTwisters.length * 4);
  const acousticScore = Math.max(20, Math.min(100, 100 - penalty));
  return { file: path.basename(filePath), totalWords: words.length, acousticScore, findings };
}

export function runAudioDiagnostic(targetPath) {
  let targetFiles = [];
  if (targetPath) {
    const p = path.resolve(targetPath);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      targetFiles = fs.readdirSync(p).filter(f => f.endsWith('.md')).map(f => path.join(p, f));
    } else if (fs.existsSync(p)) {
      targetFiles = [p];
    }
  } else if (fs.existsSync(DRAFTS_DIR)) {
    targetFiles = fs.readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.md')).map(f => path.join(DRAFTS_DIR, f));
  }

  if (targetFiles.length === 0) {
    console.log('No draft chapters found for audiobook acoustic scan.');
    return;
  }

  ensureDir(REPORT_DIR);
  console.log('\n=== Soundingboard Studio: Audiobook Acoustic & Breath Cadence Audit ===');
  console.log('Evaluating voice-actor performance flow, mic safety, and breath rhythm...\n');

  let md = '# Audiobook Acoustic & Breath Cadence Diagnostic Report\n\n';
  md += '| Chapter | Words | Acoustic Score | Breath Hazards | Attribution Lags | Sibilance Traps | Tongue Trips |\n';
  md += '| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n';

  for (const f of targetFiles) {
    const res = auditAudiobookCadence(f);
    if (res.error) continue;
    const col = res.acousticScore >= 85 ? '\x1b[32m' : res.acousticScore >= 70 ? '\x1b[33m' : '\x1b[31m';
    console.log('[' + res.file + '] Words: ' + res.totalWords + ' | Acoustic Score: ' + col + res.acousticScore + '/100\x1b[0m');
    if (res.findings.breathRunOns.length) console.log('  ▲ Breath Hazards (>32w unpunctuated): ' + res.findings.breathRunOns.length);
    if (res.findings.attributionLags.length) console.log('  ▲ Dialogue Attribution Lags (>28w before tag): ' + res.findings.attributionLags.length);
    if (res.findings.sibilanceHotspots.length) console.log('  ▲ Sibilance Clusters: ' + res.findings.sibilanceHotspots.length);
    if (res.findings.tongueTwisters.length) console.log('  ▲ Plosive/Consonant Triads: ' + res.findings.tongueTwisters.length);
    console.log('');
    md += '| [' + res.file + '](file:///./stages/03_drafting/output/chapters/' + res.file + ') | ' + res.totalWords + ' | **' + res.acousticScore + '/100** | ' + res.findings.breathRunOns.length + ' | ' + res.findings.attributionLags.length + ' | ' + res.findings.sibilanceHotspots.length + ' | ' + res.findings.tongueTwisters.length + ' |\n';
  }

  const outPath = path.join(REPORT_DIR, 'audiobook_acoustic_report.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log('✔ Detailed audiobook audit report written to: ' + outPath + '\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  runAudioDiagnostic(process.argv[2]);
}
