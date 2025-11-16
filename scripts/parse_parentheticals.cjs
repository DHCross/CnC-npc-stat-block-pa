const fs = require('fs');
const path = require('path');

const DATA_SCOPE = process.env.DATA_SCOPE || 'mouths-of-madness';
const baseDir = path.resolve(__dirname, '../data', DATA_SCOPE);
const inPath = path.join(baseDir, 'entities.full.json');
const outPath = path.join(baseDir, 'entities.parsed.json');
const reportPath = path.join(baseDir, 'parse_report.json');

function extractNumber(match){
  if(!match) return null;
  const n = parseInt(match,10);
  return Number.isNaN(n)?null:n;
}

function parseEntry(entry){
  const text = entry.parenthetical || '';
  const p = text;

  const hpMatch = p.match(/HP\s*[:]?\s*(\d+)/i);
  const acMatch = p.match(/AC\s*[:]?\s*(\d+)/i);
  const hdMatch = p.match(/HD\s*[:]?\s*([0-9]+d[0-9+\-\s]*)/i) || p.match(/HD\s*[:]?\s*([0-9]+)/i);
  const xpMatch = p.match(/XP\s*[:]?\s*([0-9]+(?:\+[0-9]+)?)/i);
  const levelMatch = p.match(/(\d+)(?:st|nd|rd|th)?\s*level/i) || p.match(/They are\s*(\d+)(?:st|nd|rd|th)?\s*level/i);

  // race/class: heuristic — take leading clause when phrase contains 'They are' or ends with creature name before 'vital stats' or 'vital'
  let raceClass = null;
  const rc1 = p.match(/They are\s*([^)\.;]+?)(?:whose|whose vital|whose primary|whose special|whose|\)|\.|;)/i);
  if(rc1) raceClass = rc1[1].trim();
  else {
    const rc2 = p.match(/([^\(\)]+?)'s vital stats|([^\(\)]+?) vital stats/i);
    if(rc2) raceClass = (rc2[1]||rc2[2]||'').trim();
  }

  // fallback: try to capture common creature keywords
  if(!raceClass){
    const creatureRegex = /(ape|bandit|bandit lieutenant|bear|boar|brigand|bugbear|bat|batrachianoid|gnoll|goblin|griffon|hobgoblin|kobold|lion|owlbear|ghoul|orc|lizardfolk|elf|elf, wood|brigan|pirate|raven)/i;
    const r = p.match(creatureRegex);
    if(r) raceClass = (r[0]||'').trim();
  }

  const remaining = p;

  return {
    parenthetical: text,
    start: entry.start,
    end: entry.end,
    startLine: entry.startLine,
    endLine: entry.endLine,
    titleLineNum: entry.titleLineNum,
    titleLine: entry.titleLine,
    inlineLabel: entry.inlineLabel || null,
    inlineContext: entry.inlineContext || null,
    lineText: entry.lineText || null,
    snippet: entry.snippet,
    hp: hpMatch ? extractNumber(hpMatch[1]) : null,
    ac: acMatch ? extractNumber(acMatch[1]) : null,
    hd: hdMatch ? hdMatch[1].replace(/\s+/g,'') : null,
    xp: xpMatch ? xpMatch[1] : null,
    level: levelMatch ? Number(levelMatch[1]) : null,
    raceClass: raceClass,
    notes: remaining
  };
}

function summarize(parsed){
  const missingBoth = parsed.filter(p=>p.hp===null && p.ac===null);
  const missingXP = parsed.filter(p=>!p.xp);
  return {
    total: parsed.length,
    missingBothCount: missingBoth.length,
    missingXPCount: missingXP.length,
    sampleMissingBoth: missingBoth.slice(0,10).map(e=>({startLine:e.startLine,parenthetical:e.parenthetical})),
    sampleMissingXP: missingXP.slice(0,10).map(e=>({startLine:e.startLine,parenthetical:e.parenthetical}))
  };
}

try{
  const raw = fs.readFileSync(inPath,'utf8');
  const arr = JSON.parse(raw);
  const parsed = arr.map(parseEntry);
  fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2), 'utf8');
  const report = summarize(parsed);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Parsed', parsed.length, 'entries. Wrote', outPath);
  console.log('Report written to', reportPath);
}catch(err){
  console.error('Error during parsing:', err && err.stack || err);
  process.exit(1);
}
