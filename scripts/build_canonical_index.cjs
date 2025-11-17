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
  /^[A-Z][a-z]+\s+[A-Z][a-z]+$/,              // "Robert Cooper"
  /^Prisoner\s+#?\d+/i,                        // "Prisoner #2"
  /^Children$/i,                               // "Children"
  /^\([^)]+\)$/,                               // "(fisherman/hunter/...)"
  /^Elf,\s+Wood,\s+(bowman|spearman|swordsman)$/i, // Classed NPCs
  /^(Bandit|Brigand|Rivermen|Thieves)$/i,     // Generic human NPCs
  /^(Bandit|Brigand),?\s*(Lieutenant|Serjeant|crossbowmen|flailmen)?$/i, // Classed bandits
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
  // Keep named unique creatures/bosses FIRST (these are special monsters)
  if (/\((Chieftain|King|Leader|Shaman)\)|Giant of the/i.test(title)) {
    return false;
  }
  
  // Keep unique named monsters with quotes (special encounters)
  if (/^"[^"]+".*?(Ogre|Owlbear|Werewolf)$/i.test(title)) {
    return false;
  }
  
  // Keep "The [Monster]" patterns
  if (/^The\s+(Little\s+Hillwood\s+)?Werewolf$/i.test(title)) {
    return false;
  }
  
  // Filter NPC patterns
  if (NPC_PATTERNS.some(p => p.test(title))) {
    return true;
  }
  
  // Filter entries with class levels that aren't boss monsters
  const hasClassLevel = entry.parsed?.level || 
                       /\d+(st|nd|rd|th)\s+level/i.test(entry.parsed?.parenthetical || '');
  
  if (hasClassLevel && !/\((Chieftain|King|Leader|Shaman)\)/i.test(title)) {
    // Proper names with class levels are NPCs
    if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)+/.test(title)) {
      return true;
    }
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
  // Keep rank/type descriptors when they appear with comma (", serjeant")
  const genericRoles = [
    /\s+males?\s*$/i,
    /\s+females?\s*$/i,
    /\s+guards?\s*$/i,
    /\s+sentries\s*$/i,
    /\s+sentry\s*$/i,
    /\s+warriors?\s*$/i,
    /\s+scouts?\s*$/i,
    /\s+bodyguards?\s*$/i,
    /\s+sub-chiefs?\s*$/i,
    /\s+chieftain'?s?\s+mate\s*$/i,
    /\s+prisoner$/i,              // "Goblin prisoner" → "Goblin"
    /\s+patrol$/i,                // "Goblin patrol" → "Goblin"
  ];
  
  // Do NOT strip serjeant/lieutenant if they appear after comma (those are types)
  // Only strip them if they're standalone (like "serjeant x 1")
  if (!/,\s*(serjeant|lieutenant)/i.test(normalized)) {
    genericRoles.push(/\s+serjeants?\s*$/i);
  }
  
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

/**\n * Check if two entries have mechanically different stats\n * Per OGL: Only Level (die type, stored in 'hd' field) and AC define different stat blocks\n * HP rolls don't create variants - same Level = same creature\n */
function haveDifferentStats(entry1, entry2) {
  const data1 = entry1.canonicalData || {};
  const data2 = entry2.canonicalData || {};
  
  // Primary mechanical differences
  if (data1.hd !== data2.hd) return true;
  if (data1.ac !== data2.ac) return true;
  
  // Secondary: disposition changes are meaningful
  if (data1.disposition !== data2.disposition) return true;
  
  // HP differences alone don't matter (same Level = same stat block)
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
      
      // Check if mechanically different (Level/AC based, not HP)
      if (haveDifferentStats(entry, existing)) {
        console.log(`  ⚠️  Mechanical variant detected:`);\n        console.log(`      Existing: \"${existing.title}\"`);\n        console.log(`        Level: ${existing.canonicalData?.hd}, AC: ${existing.canonicalData?.ac}`);\n        console.log(`      New: \"${entry.title}\"`);\n        console.log(`        Level: ${entry.canonicalData?.hd}, AC: ${entry.canonicalData?.ac}`);
        console.log(`      → Keeping as separate entry\n`);
        
        // Keep the more descriptive title (longer = more specific)
        if (entry.title.length > existing.title.length) {
          // Replace existing with more specific variant
          indexMap.set(key, entry);
          console.log(`      Replaced less specific entry with more descriptive one`);
        } else {
          // Add as new variant with unique key
          const variantKey = `${key}_${entry.canonicalData?.hd}_${entry.canonicalData?.ac}`.replace(/\s+/g, '_');
          indexMap.set(variantKey, entry);
        }
      } else {
        console.log(`  Duplicate: "${entry.title}" (same Level/AC as "${existing.title}")`);
        stats.filtered_duplicates++;
        
        // Keep the more descriptive title if it's longer
        if (entry.title.length > existing.title.length && 
            !entry.title.includes('variant') &&
            (entry.title.includes(',') || entry.title.includes('('))) {
          console.log(`    → Replacing with more descriptive title: "${entry.title}"`);
          indexMap.set(key, entry);
        }
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
