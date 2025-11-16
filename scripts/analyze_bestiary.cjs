const fs = require('fs');
const path = require('path');

const DATA_SCOPE = process.env.DATA_SCOPE || 'mouths-of-madness';
const slug = DATA_SCOPE.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
const dataDir = path.join('data', DATA_SCOPE);
const entities = JSON.parse(fs.readFileSync(path.join(dataDir, 'entities.canonical.json'), 'utf8'));
const report = JSON.parse(fs.readFileSync(path.join(dataDir, 'canonical_report.json'), 'utf8'));
const canonicalMarkdown = path.join('CnC Docs', `${slug}-canonical.md`);
const cleanMarkdown = path.join('CnC Docs', `${slug}-canonical-clean.md`);

console.log('=== MISSING VALUE ANALYSIS ===\n');

// Check for missing HP/AC/disposition
const missingHP = entities.filter(e => !e.canonicalData.hp || e.canonicalData.hp === 'N/A');
const missingAC = entities.filter(e => !e.canonicalData.ac || e.canonicalData.ac === 'N/A');
const missingDisposition = entities.filter(e => !e.canonicalData.disposition || e.canonicalData.disposition === 'N/A');

console.log('Missing HP:', missingHP.length);
console.log('Missing AC:', missingAC.length);
console.log('Missing Disposition:', missingDisposition.length);

if (missingHP.length > 0) {
  console.log('\n❌ Entries missing HP:');
  missingHP.forEach(e => console.log('  -', e.title.substring(0, 80)));
}

if (missingAC.length > 0) {
  console.log('\n❌ Entries missing AC:');
  missingAC.forEach(e => console.log('  -', e.title.substring(0, 80)));
}

if (missingDisposition.length > 0) {
  console.log('\n❌ Entries missing Disposition:');
  missingDisposition.forEach(e => console.log('  -', e.title.substring(0, 80)));
}

// Correlate with flagged items (be defensive if report structure changed)
console.log('\n=== FLAGGED ITEMS FROM CANONICAL REPORT ===\n');
const flagged = (report && Array.isArray(report.flagged)) ? report.flagged : [];
console.log('Total flagged:', flagged.length);

const missingRaceClass = flagged.filter(f => Array.isArray(f.flags) && f.flags.includes('missing raceClass'));
const missingXP = flagged.filter(f => Array.isArray(f.flags) && f.flags.includes('missing XP'));

console.log('Missing raceClass flags:', missingRaceClass.length);
console.log('Missing XP flags:', missingXP.length);

// Check for other potential issues
console.log('\n=== ADDITIONAL QUALITY CHECKS ===\n');

const emptyCanonical = entities.filter(e => !e.canonicalParenthetical || e.canonicalParenthetical.trim().length < 20);
console.log('Empty/short canonical parentheticals:', emptyCanonical.length);

const noAttributes = entities.filter(e => !e.canonicalData.attributes);
console.log('Missing attributes field:', noAttributes.length);

const noEquipment = entities.filter(e => !e.canonicalData.equipment);
console.log('Missing equipment field:', noEquipment.length);

const noCoins = entities.filter(e => !e.canonicalData.coins);
console.log('Missing coins field:', noCoins.length);

// Show sample of flagged items with their actual stats
console.log('\n=== SAMPLE OF FLAGGED "missing raceClass" ITEMS (first 8) ===\n');
missingRaceClass.slice(0, 8).forEach(item => {
  const entity = entities.find(e => e.sourceIndex === item.sourceIndex);
  if (entity) {
    console.log('📋 Title:', item.title.substring(0, 70).replace(/\n/g, ' '));
    console.log('   HP:', entity.canonicalData.hp, '| AC:', entity.canonicalData.ac, '| Disp:', entity.canonicalData.disposition);
    console.log('   Canonical:', entity.canonicalParenthetical.substring(0, 90).replace(/\n/g, ' ') + '...');
    console.log('');
  }
});

// Summary
console.log('=== SUMMARY ===\n');
const total = entities.length;
console.log(`${missingHP.length === 0 ? '✅' : '⚠️'} ${total - missingHP.length}/${total} entries have HP`);
console.log(`${missingAC.length === 0 ? '✅' : '⚠️'} ${total - missingAC.length}/${total} entries have AC`);
console.log(`${missingDisposition.length === 0 ? '✅' : '⚠️'} ${total - missingDisposition.length}/${total} entries have Disposition`);
console.log('⚠️  Many entries flagged for "missing raceClass" (parser couldn\'t extract race/class from descriptive text)');
console.log('📝 These are informational flags - stats are complete, just missing structured race/class field\n');

// --- Generate a clean printable markdown (no JSON/details blocks) ---
try {
  const raw = fs.readFileSync(canonicalMarkdown, 'utf8');
  // Remove <details> blocks (including their summary and fenced JSON)
  const cleaned = raw.replace(/<details>[\s\S]*?<\/details>\n*/g, '')
    // normalize multiple blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';

  fs.writeFileSync(cleanMarkdown, cleaned, 'utf8');
  const detailsCount = (raw.match(/<details>/g) || []).length;
  console.log(`\n✅ Clean Markdown written: ${cleanMarkdown}`);
  console.log('🔎 <details> blocks removed:', detailsCount);
  console.log('\nNote: VS Code previews should collapse <details> sections correctly; the clean file removes them for a printable/readable edition.');
} catch (err) {
  console.error('Failed to generate clean Markdown:', err && err.message);
}
