#!/usr/bin/env node

/**
 * Canonical Monster Index Builder
 * 
 * Transforms encounter extraction into Gold Standard monster index:
 * - Strips quantity suffixes (x 3, x 30, x 3-6)
 * - Removes population descriptors (males, females, guards, warriors)
 * - Filters NPC entries (proper names)
 * - Deduplicates mechanically identical variants
 * - Preserves mechanical variants (different stats)
 * 
 * Input: entities.canonical.clean.json (123 encounter entries)
 * Output: entities.canonical.index.json (~50 unique stat blocks)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CLEAN_FILE = path.join(__dirname, '../data/mouths-of-madness/entities.canonical.clean.json');
const INDEX_FILE = path.join(__dirname, '../data/mouths-of-madness/entities.canonical.index.json');

// Population descriptor patterns to remove
const POPULATION_DESCRIPTORS = [
  /\s+males?\s*$/i,
  /\s+females?\s*$/i,
  /\s+guards?\s*$/i,
  /\s+sentries\s*$/i,
  /\s+sentry\s*$/i,
  /\s+warriors?\s*$/i,
  /\s+scouts?\s*$/i,
  /\s+bodyguards?\s*$/i,
  /\s+serjeants?\s*$/i,
  /\s+patrol\s+warriors?\s*$/i,
  /\s+sub-chiefs?\s*$/i,
  /\s+chieftain'?s?\s+mate\s*$/i,
];

// NPC name patterns (proper names without creature descriptors)
const NPC_PATTERNS = [
  /^[A-Z][a-z]+\s+[A-Z][a-z]+$/, // "Robert Cooper"
  /^"[^"]+"$/,                    // "Charlie"
  /^Prisoner\s+#?\d+/i,           // "Prisoner #2"
  /^Children\s+x/i,               // "Children x 3-6"
];

// Quantity patterns to strip
const QUANTITY_PATTERNS = [
  /\s+x\s*\d+(-\d+)?$/,           // " x 3", " x 3-6"
  /\s+x\s*\d+\s+or\s+\d+$/,        // " x 2 or 4"
  /\s+x\s*$/,                      // " x" (incomplete)
];

/**
 * Check if entry is an NPC (not a monster)
 */
function isNPC(title, entry) {
  // Keep named unique creatures/bosses FIRST
  if (/\((Chieftain|King|Leader|Shaman)\)|Giant of the|Ogre|Werewolf/i.test(title)) {
    return false;
  }
  
  // Keep creature types even if they have "The" prefix
  if (/^The\s+(Ogre|Werewolf|Harpy)/i.test(title)) {
    return false;
  }
  
  // Check NPC patterns
  if (NPC_PATTERNS.some(p => p.test(title))) {
    return true;
  }
  
  // Check for level indicators (NPCs typically have class levels)
  const hasClassLevel = entry.parsed?.level || 
                       /\d+(st|nd|rd|th)\s+level/i.test(entry.parsed?.parenthetical || '');
  
  // Proper names with class levels are NPCs (but not if they're leaders)
  if (hasClassLevel && /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+/.test(title) && !/leader|chieftain/i.test(title)) {
    return true;
  }
  
  // "Wood Elf" patterns with class levels are NPCs
  if (/^Wood Elf\s+(bowman|spearman|swordsman)/i.test(title)) {
    return true;
  }
  
  return false;
}

/**
 * Normalize creature name to base form
 * PRESERVES type descriptors (raider, leader, poisonous, giant)
 * STRIPS population descriptors (males, females, guards, x N)
 */
function normalizeCreatureName(title) {
  let normalized = title;
  
  // Strip quantity suffixes FIRST
  QUANTITY_PATTERNS.forEach(pattern => {
    normalized = normalized.replace(pattern, '');
  });
  
  // Strip population descriptors ONLY if they're generic roles
  // Keep creature-defining descriptors like "poisonous", "giant", "deadly"
  const genericRoles = [
    /\s+males?\s*$/i,
    /\s+females?\s*$/i,
    /\s+guards?\s*$/i,
    /\s+sentries\s*$/i,
    /\s+sentry\s*$/i,
    /\s+warriors?\s*$/i,
    /\s+scouts?\s*$/i,
    /\s+bodyguards?\s*$/i,
    /\s+serjeants?\s*$/i,
    /\s+patrol\s+warriors?\s*$/i,
    /\s+sub-chiefs?\s*$/i,
    /\s+chieftain'?s?\s+mate\s*$/i,
    /\s+prisoner$/i,              // "Goblin prisoner" → "Goblin"
    /\s+patrol$/i,                // "Goblin patrol" → "Goblin"
  ];
  
  genericRoles.forEach(pattern => {
    normalized = normalized.replace(pattern, '');
  });
  
  // Normalize plural creature names to singular
  // Only for actual creature names, not descriptors
  normalized = normalized
    .replace(/\bWolves\b/g, 'Wolf')
    .replace(/\bGoblins\b/g, 'Goblin')
    .replace(/\bOrcs\b/g, 'Orc')
    .replace(/\bSnakes\b/g, 'Snake')
    .replace(/\bZombies\b/g, 'Zombie')
    .replace(/\bSkeletons\b/g, 'Skeleton')
    .replace(/\bStirges\b/g, 'Stirge')
    .replace(/\bNixies\b/g, 'Nixie')
    .replace(/\bCentipedes\b/g, 'Centipede')
    .replace(/\bRats\b/g, 'Rat')
    .replace(/\bBatrachianoids\b/g, 'Batrachianoid')
    .replace(/\bBugbears\b/g, 'Bugbear');
  
  return normalized.trim();
}

/**
 * Generate comparison key for deduplication
 */
function getComparisonKey(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two entries have mechanically different stats
 * HP variation alone is not enough - must have different HD, AC, or abilities
 */
function haveDifferentStats(entry1, entry2) {
  const data1 = entry1.canonicalData || {};
  const data2 = entry2.canonicalData || {};
  
  // Compare structural stats (not HP, which varies per instance)
  if (data1.ac !== data2.ac) return true;
  if (data1.hd !== data2.hd) return true;
  
  // Compare disposition
  if (data1.disposition !== data2.disposition) return true;
  
  // Compare race/class (indicates different variant)
  if (data1.raceClass !== data2.raceClass) return true;
  
  return false;
}

/**
 * Build canonical monster index
 */
function buildIndex(cleanEntries) {
  console.log('🏗️  Building Canonical Monster Index\n');
  
  const stats = {
    total: cleanEntries.length,
    filtered_npcs: 0,
    filtered_duplicates: 0,
    normalized: 0,
    unique_stat_blocks: 0
  };
  
  // Step 1: Normalize names and filter NPCs
  console.log('Step 1: Normalizing creature names and filtering NPCs...');
  let normalized = cleanEntries.map(entry => {
    const normalizedTitle = normalizeCreatureName(entry.title);
    
    if (normalizedTitle !== entry.title) {
      console.log(`  Normalized: "${entry.title}" → "${normalizedTitle}"`);
      stats.normalized++;
    }
    
    return {
      ...entry,
      title: normalizedTitle,
      originalTitle: entry.title
    };
  }).filter(entry => {
    if (isNPC(entry.title, entry)) {
      console.log(`  ❌ Filtered NPC: "${entry.title}"`);
      stats.filtered_npcs++;
      return false;
    }
    return true;
  });
  
  console.log(`\n  Names normalized: ${stats.normalized}`);
  console.log(`  NPCs filtered: ${stats.filtered_npcs}`);
  
  // Step 2: Deduplicate by normalized name
  console.log('\nStep 2: Deduplicating mechanically identical entries...');
  const indexMap = new Map();
  
  normalized.forEach((entry, idx) => {
    const key = getComparisonKey(entry.title);
    
    if (indexMap.has(key)) {
      const existing = indexMap.get(key);
      
      // Check if mechanically different
      if (haveDifferentStats(entry, existing)) {
        console.log(`  ⚠️  Mechanical variant detected:`);
        console.log(`      "${existing.title}" vs "${entry.title}"`);
        console.log(`      HP: ${existing.canonicalData?.hp} vs ${entry.canonicalData?.hp}`);
        console.log(`      Keeping both as separate entries`);
        
        // Add suffix to distinguish variants
        const variantTitle = `${entry.title} (variant ${indexMap.size + 1})`;
        indexMap.set(`${key}_variant_${idx}`, { ...entry, title: variantTitle });
      } else {
        console.log(`  Duplicate: "${entry.title}" (same as existing "${existing.title}")`);
        stats.filtered_duplicates++;
      }
    } else {
      indexMap.set(key, entry);
    }
  });
  
  console.log(`\n  Duplicates removed: ${stats.filtered_duplicates}`);
  
  // Step 3: Convert to array and sort
  console.log('\nStep 3: Building final index...');
  const index = Array.from(indexMap.values())
    .sort((a, b) => a.title.localeCompare(b.title));
  
  stats.unique_stat_blocks = index.length;
  
  return { index, stats };
}

/**
 * Validate index quality
 */
function validateIndex(index) {
  console.log('\n🔍 Validating Gold Standard Compliance...\n');
  
  const issues = [];
  
  index.forEach(entry => {
    const title = entry.title;
    
    // Check for quantity patterns
    if (/\s+x\s*\d+/i.test(title)) {
      issues.push({ entry: title, issue: 'Contains quantity suffix' });
    }
    
    // Check for population descriptors
    if (/\b(males?|females?|guards?|warriors?|scouts?)\b/i.test(title)) {
      issues.push({ entry: title, issue: 'Contains population descriptor' });
    }
    
    // Check for markdown artifacts
    if (/[\*_]{2,}/.test(title)) {
      issues.push({ entry: title, issue: 'Contains markdown formatting' });
    }
  });
  
  if (issues.length === 0) {
    console.log('  ✅ All Gold Standard criteria passed');
    return true;
  } else {
    console.log(`  ⚠️  ${issues.length} validation issues found:\n`);
    issues.forEach(({ entry, issue }) => {
      console.log(`    "${entry}": ${issue}`);
    });
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('📚 Canonical Monster Index Builder\n');
  console.log('═'.repeat(60));
  
  // Load clean data
  if (!fs.existsSync(CLEAN_FILE)) {
    console.error(`❌ Clean file not found: ${CLEAN_FILE}`);
    process.exit(1);
  }
  
  const cleanEntries = JSON.parse(fs.readFileSync(CLEAN_FILE, 'utf8'));
  console.log(`\n✅ Loaded ${cleanEntries.length} clean entries\n`);
  
  // Build index
  const { index, stats } = buildIndex(cleanEntries);
  
  // Validate
  const isValid = validateIndex(index);
  
  // Write index
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
  console.log(`\n✅ Index written to: ${INDEX_FILE}`);
  
  // Summary
  console.log('\n📊 INDEX BUILD SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Input entries (clean): ${stats.total}`);
  console.log(`Names normalized: ${stats.normalized}`);
  console.log(`NPCs filtered: ${stats.filtered_npcs}`);
  console.log(`Duplicates removed: ${stats.filtered_duplicates}`);
  console.log(`Unique stat blocks: ${stats.unique_stat_blocks}`);
  console.log('═'.repeat(60));
  
  // Quality assessment
  const reduction = ((stats.total - stats.unique_stat_blocks) / stats.total * 100).toFixed(1);
  console.log(`\nReduction: ${reduction}% (${stats.total} → ${stats.unique_stat_blocks})`);
  
  if (isValid) {
    console.log('✅ Gold Standard Index: PASS');
    process.exit(0);
  } else {
    console.log('⚠️  Gold Standard Index: Issues detected');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { buildIndex, normalizeCreatureName, isNPC };
