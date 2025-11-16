#!/usr/bin/env node

/**
 * Parser Cleanup Script
 * 
 * Fixes identified data quality issues in canonical.json:
 * 1. Strip markdown formatting from titles
 * 2. Remove non-stat-block fragments
 * 3. Deduplicate identical entries
 * 4. Normalize case variations for duplicates
 * 
 * Creates: entities.canonical.clean.json
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CANONICAL_FILE = path.join(__dirname, '../data/mouths-of-madness/entities.canonical.json');
const CLEAN_FILE = path.join(__dirname, '../data/mouths-of-madness/entities.canonical.clean.json');

// Critical issues to auto-fix
const FRAGMENT_PATTERNS = [
  /^\d+-\d+$/,              // "86-90" (table reference)
  /^\).*_$/,                 // ")** _" (parse error)
];

/**
 * Strip markdown formatting from title
 */
function cleanTitle(title) {
  let cleaned = title;
  
  // Remove bold markers: **text** -> text
  cleaned = cleaned.replace(/\*\*/g, '');
  
  // Remove emphasis markers: *text* -> text or _text_ -> text
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
  
  // Remove trailing underscore emphasis patterns: text*: _ -> text:
  cleaned = cleaned.replace(/\*:\s*_?$/g, ':');
  
  // Remove standalone trailing symbols
  cleaned = cleaned.replace(/:\s*_?$/g, '');
  
  // Remove any remaining standalone asterisks
  cleaned = cleaned.replace(/\*/g, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.trim().replace(/\s+/g, ' ');
  
  return cleaned;
}

/**
 * Check if entry is a fragment that should be removed
 */
function isFragment(entry) {
  const title = entry.title;
  
  // Check fragment patterns
  if (FRAGMENT_PATTERNS.some(p => p.test(title))) {
    return true;
  }
  
  // Check for missing critical data
  const data = entry.canonicalData || {};
  const hasCriticalData = data.hp && data.ac;
  
  if (!hasCriticalData && title.length < 5) {
    return true;
  }
  
  return false;
}

/**
 * Normalize title for duplicate detection
 */
function normalizeForComparison(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deduplicate entries
 * - If exact match (after normalization), keep first
 * - If case variation, prefer title-case over lowercase
 */
function deduplicateEntries(entries) {
  const seen = new Map();
  const deduplicated = [];
  
  entries.forEach((entry, idx) => {
    const normalized = normalizeForComparison(entry.title);
    
    if (seen.has(normalized)) {
      const existingIdx = seen.get(normalized);
      const existing = entries[existingIdx];
      
      console.log(`  Duplicate found:`);
      console.log(`    #${existingIdx}: "${existing.title}"`);
      console.log(`    #${idx}: "${entry.title}" (removing)`);
      
      // Keep the one with better formatting (prefer title with capitals)
      const hasMoreCaps = (entry.title.match(/[A-Z]/g) || []).length >
                          (existing.title.match(/[A-Z]/g) || []).length;
      
      if (hasMoreCaps) {
        // Replace existing with current
        deduplicated[seen.get(normalized)] = entry;
        console.log(`    → Keeping #${idx} (better formatting)`);
      }
    } else {
      seen.set(normalized, deduplicated.length);
      deduplicated.push(entry);
    }
  });
  
  return deduplicated;
}

/**
 * Main cleanup function
 */
function cleanupCanonical() {
  console.log('🧹 Starting Parser Cleanup\n');
  
  // Load data
  if (!fs.existsSync(CANONICAL_FILE)) {
    console.error(`❌ Canonical file not found: ${CANONICAL_FILE}`);
    process.exit(1);
  }
  
  const entries = JSON.parse(fs.readFileSync(CANONICAL_FILE, 'utf8'));
  console.log(`✅ Loaded ${entries.length} entries\n`);
  
  let cleanedCount = 0;
  let removedCount = 0;
  let deduplicatedCount = 0;
  
  // Step 1: Clean titles and filter fragments
  console.log('Step 1: Cleaning titles and removing fragments...');
  let cleaned = entries.map(entry => {
    const originalTitle = entry.title;
    const cleanedTitle = cleanTitle(originalTitle);
    
    if (originalTitle !== cleanedTitle) {
      console.log(`  Cleaned: "${originalTitle}" → "${cleanedTitle}"`);
      cleanedCount++;
    }
    
    return {
      ...entry,
      title: cleanedTitle,
      originalTitle: originalTitle !== cleanedTitle ? originalTitle : undefined
    };
  }).filter(entry => {
    if (isFragment(entry)) {
      console.log(`  ❌ Removing fragment: "${entry.title}"`);
      removedCount++;
      return false;
    }
    return true;
  });
  
  console.log(`\n  Titles cleaned: ${cleanedCount}`);
  console.log(`  Fragments removed: ${removedCount}\n`);
  
  // Step 2: Deduplicate
  console.log('Step 2: Deduplicating entries...');
  const beforeDedup = cleaned.length;
  cleaned = deduplicateEntries(cleaned);
  deduplicatedCount = beforeDedup - cleaned.length;
  console.log(`\n  Duplicates removed: ${deduplicatedCount}\n`);
  
  // Step 3: Sort by sourceIndex for consistency
  console.log('Step 3: Sorting by sourceIndex...');
  cleaned.sort((a, b) => a.sourceIndex - b.sourceIndex);
  
  // Write clean file
  fs.writeFileSync(CLEAN_FILE, JSON.stringify(cleaned, null, 2));
  console.log(`\n✅ Clean data written to: ${CLEAN_FILE}`);
  
  // Summary
  console.log('\n📊 CLEANUP SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Original entries: ${entries.length}`);
  console.log(`Titles cleaned: ${cleanedCount}`);
  console.log(`Fragments removed: ${removedCount}`);
  console.log(`Duplicates removed: ${deduplicatedCount}`);
  console.log(`Final entries: ${cleaned.length}`);
  console.log('═'.repeat(60));
  
  // Quality check
  const remainingIssues = cleaned.filter(e => {
    return cleanTitle(e.title) !== e.title || isFragment(e);
  });
  
  if (remainingIssues.length > 0) {
    console.log(`\n⚠️  ${remainingIssues.length} entries still have issues`);
    process.exit(1);
  } else {
    console.log('\n✅ All identified issues resolved');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  cleanupCanonical();
}

module.exports = { cleanTitle, isFragment, deduplicateEntries };
