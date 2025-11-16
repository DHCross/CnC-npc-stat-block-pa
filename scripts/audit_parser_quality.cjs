#!/usr/bin/env node

/**
 * Parser Quality Audit Script
 * 
 * Analyzes canonical.json for data quality issues:
 * - Bold/emphasis formatting in titles
 * - Non-stat-block entries (missing required fields)
 * - Duplicate titles with case variations
 * - Truncated or suspicious names
 * - Entries without valid parentheticals
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CANONICAL_FILE = path.join(__dirname, '../data/mouths-of-madness/entities.canonical.json');
const OUTPUT_FILE = path.join(__dirname, '../data/mouths-of-madness/parser_audit_report.json');

// Required fields for valid stat block
const REQUIRED_FIELDS = ['hp', 'ac'];
const RECOMMENDED_FIELDS = ['hd', 'xp', 'raceClass'];

/**
 * Load canonical data
 */
function loadCanonical() {
  if (!fs.existsSync(CANONICAL_FILE)) {
    console.error(`❌ Canonical file not found: ${CANONICAL_FILE}`);
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(CANONICAL_FILE, 'utf8'));
  console.log(`✅ Loaded ${data.length} entries from canonical.json`);
  return data;
}

/**
 * Check if title has markdown formatting
 */
function hasMarkdownFormatting(title) {
  const patterns = [
    /\*\*.*\*\*/,           // Bold: **text**
    /\*[^*]+\*/,            // Emphasis: *text*
    /_[^_]+_/,              // Underscore emphasis: _text_
    /^\*\*.*:\*\*\s*_?$/,   // Bold label ending: **Label:** _
  ];
  
  return patterns.some(p => p.test(title));
}

/**
 * Check if entry is a valid stat block
 */
function validateStatBlock(entry) {
  const issues = [];
  
  // Check for required fields in canonicalData
  const data = entry.canonicalData || {};
  REQUIRED_FIELDS.forEach(field => {
    if (!data[field] || data[field] === '') {
      issues.push(`missing_${field}`);
    }
  });
  
  // Check for recommended fields
  RECOMMENDED_FIELDS.forEach(field => {
    if (!data[field] || data[field] === '') {
      issues.push(`missing_${field}_recommended`);
    }
  });
  
  // Check for suspiciously short titles
  if (entry.title.length < 3) {
    issues.push('title_too_short');
  }
  
  // Check for fragment patterns
  const fragmentPatterns = [
    /^\d+-\d+$/,              // "86-90" (table reference)
    /^\).*_$/,                 // ")** _" (parse error)
    /^\(.*\)$/,                // "(text)" (descriptor only)
  ];
  
  if (fragmentPatterns.some(p => p.test(entry.title))) {
    issues.push('likely_fragment');
  }
  
  return issues;
}

/**
 * Find duplicate titles (case-insensitive)
 */
function findDuplicates(entries) {
  const titleMap = new Map();
  const duplicates = [];
  
  entries.forEach((entry, idx) => {
    const normalized = entry.title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    
    if (titleMap.has(normalized)) {
      duplicates.push({
        normalized,
        entries: [
          { index: titleMap.get(normalized), title: entries[titleMap.get(normalized)].title },
          { index: idx, title: entry.title }
        ]
      });
    } else {
      titleMap.set(normalized, idx);
    }
  });
  
  return duplicates;
}

/**
 * Check for truncated names
 */
function checkTruncation(title) {
  const suspiciousPatterns = [
    /\sx\s*$/,                     // Ends with " x" (missing count)
    /\s+$/,                         // Trailing whitespace
    /,\s*$/,                        // Ends with comma
    /^\s*$/,                        // Empty/whitespace only
  ];
  
  return suspiciousPatterns.some(p => p.test(title));
}

/**
 * Analyze entry quality
 */
function analyzeEntry(entry, index) {
  const analysis = {
    index,
    title: entry.title,
    sourceIndex: entry.sourceIndex,
    issues: []
  };
  
  // Check markdown formatting
  if (hasMarkdownFormatting(entry.title)) {
    analysis.issues.push({
      type: 'markdown_formatting',
      severity: 'critical',
      message: 'Title contains markdown formatting'
    });
  }
  
  // Validate stat block
  const statBlockIssues = validateStatBlock(entry);
  statBlockIssues.forEach(issue => {
    const severity = issue.includes('recommended') ? 'medium' : 
                     issue === 'likely_fragment' ? 'critical' : 'high';
    analysis.issues.push({
      type: issue,
      severity,
      message: `Validation issue: ${issue}`
    });
  });
  
  // Check truncation
  if (checkTruncation(entry.title)) {
    analysis.issues.push({
      type: 'possible_truncation',
      severity: 'medium',
      message: 'Title may be truncated or malformed'
    });
  }
  
  // Check for empty canonical parenthetical
  if (!entry.canonicalParenthetical || entry.canonicalParenthetical.trim() === '') {
    analysis.issues.push({
      type: 'empty_canonical',
      severity: 'high',
      message: 'Canonical parenthetical is empty'
    });
  }
  
  return analysis;
}

/**
 * Generate summary statistics
 */
function generateSummary(entries, analyses, duplicates) {
  const summary = {
    total_entries: entries.length,
    entries_with_issues: analyses.filter(a => a.issues.length > 0).length,
    issues_by_severity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    issues_by_type: {},
    duplicates_found: duplicates.length
  };
  
  // Count issues
  analyses.forEach(analysis => {
    analysis.issues.forEach(issue => {
      summary.issues_by_severity[issue.severity]++;
      summary.issues_by_type[issue.type] = (summary.issues_by_type[issue.type] || 0) + 1;
    });
  });
  
  return summary;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Starting Parser Quality Audit\n');
  
  // Load data
  const entries = loadCanonical();
  
  // Analyze each entry
  console.log('📊 Analyzing entries...');
  const analyses = entries.map((entry, idx) => analyzeEntry(entry, idx));
  
  // Find duplicates
  console.log('🔎 Checking for duplicates...');
  const duplicates = findDuplicates(entries);
  
  // Generate summary
  const summary = generateSummary(entries, analyses, duplicates);
  
  // Filter to only problematic entries
  const problematicEntries = analyses.filter(a => a.issues.length > 0);
  
  // Build report
  const report = {
    generated: new Date().toISOString(),
    summary,
    duplicates,
    problematic_entries: problematicEntries
  };
  
  // Write report
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  console.log(`\n✅ Audit report written to: ${OUTPUT_FILE}`);
  
  // Print summary to console
  console.log('\n📈 SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total entries: ${summary.total_entries}`);
  console.log(`Entries with issues: ${summary.entries_with_issues}`);
  console.log(`\nIssues by severity:`);
  console.log(`  Critical: ${summary.issues_by_severity.critical}`);
  console.log(`  High: ${summary.issues_by_severity.high}`);
  console.log(`  Medium: ${summary.issues_by_severity.medium}`);
  console.log(`  Low: ${summary.issues_by_severity.low}`);
  console.log(`\nDuplicates found: ${summary.duplicates_found}`);
  
  if (Object.keys(summary.issues_by_type).length > 0) {
    console.log(`\nTop issues by type:`);
    const sortedIssues = Object.entries(summary.issues_by_type)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    sortedIssues.forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  }
  
  if (duplicates.length > 0) {
    console.log(`\n⚠️  Duplicate title groups:`);
    duplicates.forEach(dup => {
      console.log(`  "${dup.entries[0].title}" ≈ "${dup.entries[1].title}"`);
    });
  }
  
  console.log('\n' + '═'.repeat(60));
  
  // Return exit code based on critical issues
  if (summary.issues_by_severity.critical > 0) {
    console.log(`\n❌ ${summary.issues_by_severity.critical} critical issues found`);
    process.exit(1);
  } else if (summary.issues_by_severity.high > 0) {
    console.log(`\n⚠️  ${summary.issues_by_severity.high} high-priority issues found`);
    process.exit(0);
  } else {
    console.log('\n✅ No critical issues found');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { analyzeEntry, validateStatBlock, findDuplicates };
