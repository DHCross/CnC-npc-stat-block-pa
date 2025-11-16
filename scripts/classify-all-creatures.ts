#!/usr/bin/env tsx
/**
 * Classify all 129 creatures using the deterministic rule-tree
 * Outputs classification decisions to JSON and CSV
 */

import fs from 'fs';
import path from 'path';
import { extractCreatureEntries } from '../src/lib/full-document-pipeline';
import { processDumpWithValidation } from '../src/lib/npc-parser';
import { classifyCreature, getFormattingRules, extractPreCheckData } from '../src/lib/classification-rules';

const DOC = path.join(process.cwd(), 'CnC Docs', 'mouths-of-madness-canonical-clean.md');
const OUT_JSON = path.join(process.cwd(), 'data', 'mouths-of-madness', 'creature-classifications.json');
const OUT_CSV = path.join(process.cwd(), 'data', 'mouths-of-madness', 'creature-classifications.csv');

interface ClassificationRecord {
  entryNumber: number;
  creatureName: string;
  type: string;
  subtype?: string;
  confidence: string;
  reasoning: string;
  warnings: string[];
  formattingRules: {
    pronounTrack: string;
    pronounThis: string;
    attributePhrasing: string;
    showLevel: boolean;
    showHD: boolean;
  };
  rawData: {
    hasHP: boolean;
    hasHD: boolean;
    hasLevel: boolean;
    raceClass?: string;
  };
}

function main() {
  if (!fs.existsSync(DOC)) {
    console.error(`Missing source doc at ${DOC}`);
    process.exit(1);
  }

  const md = fs.readFileSync(DOC, 'utf8');
  const entries = extractCreatureEntries(md);
  const records: ClassificationRecord[] = [];

  console.log(`\n${'='.repeat(80)}`);
  console.log('CANONICAL CLASSIFICATION SYSTEM - RULE-TREE EXECUTION');
  console.log(`${'='.repeat(80)}\n`);

  for (const entry of entries) {
    const parsedArr = processDumpWithValidation(entry.rawMarkdown, true, 'monster');
    if (!parsedArr || parsedArr.length === 0) {
      console.log(`⚠️  ${entry.entryNumber}. ${entry.creatureName} - PARSE FAILED`);
      continue;
    }

    const parsed = parsedArr[0];
    const canonicalData = parsed.canonicalData;
    
    if (!canonicalData) {
      console.log(`⚠️  ${entry.entryNumber}. ${entry.creatureName} - NO CANONICAL DATA`);
      continue;
    }

    // Run classification
    const classification = classifyCreature(entry.creatureName, canonicalData);
    const preCheck = extractPreCheckData(entry.creatureName, canonicalData);
    const formatting = getFormattingRules(classification, preCheck);

    // Build record
    const record: ClassificationRecord = {
      entryNumber: entry.entryNumber,
      creatureName: entry.creatureName,
      type: classification.type,
      subtype: classification.subtype,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      warnings: classification.warnings,
      formattingRules: {
        pronounTrack: formatting.pronounTrack,
        pronounThis: formatting.pronounThis,
        attributePhrasing: formatting.attributePhrasing,
        showLevel: formatting.showLevel,
        showHD: formatting.showHD
      },
      rawData: {
        hasHP: Boolean(canonicalData.hp),
        hasHD: Boolean(canonicalData.hd),
        hasLevel: Boolean(canonicalData.level),
        raceClass: preCheck.raceClass
      }
    };

    records.push(record);

    // Print to console
    const icon = classification.type === 'classed' ? '👤' : 
                 classification.type === 'monster' ? '👹' : '❓';
    const confidenceBadge = classification.confidence === 'high' ? '✓' :
                           classification.confidence === 'medium' ? '~' : '?';
    
    console.log(`${icon} ${confidenceBadge} ${entry.entryNumber}. ${entry.creatureName}`);
    console.log(`   Type: ${classification.type.toUpperCase()}${classification.subtype ? ` (${classification.subtype})` : ''}`);
    console.log(`   Confidence: ${classification.confidence}`);
    console.log(`   Reasoning: ${classification.reasoning}`);
    if (classification.warnings.length > 0) {
      classification.warnings.forEach(w => console.log(`   ⚠️  ${w}`));
    }
    console.log();
  }

  // Write JSON
  fs.writeFileSync(OUT_JSON, JSON.stringify(records, null, 2));
  console.log(`\n✅ Wrote ${records.length} classifications to ${OUT_JSON}`);

  // Write CSV
  const csvLines = [
    'Entry,Creature Name,Type,Subtype,Confidence,Has HP,Has HD,Has Level,Pronoun Track,Attribute Phrasing,Reasoning,Warnings'
  ];

  for (const r of records) {
    const escapeCsv = (s: string) => {
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    csvLines.push([
      r.entryNumber,
      escapeCsv(r.creatureName),
      r.type,
      r.subtype || '',
      r.confidence,
      r.rawData.hasHP ? 'YES' : 'NO',
      r.rawData.hasHD ? 'YES' : 'NO',
      r.rawData.hasLevel ? 'YES' : 'NO',
      r.formattingRules.pronounTrack,
      r.formattingRules.attributePhrasing,
      escapeCsv(r.reasoning),
      escapeCsv(r.warnings.join('; '))
    ].join(','));
  }

  fs.writeFileSync(OUT_CSV, csvLines.join('\n'));
  console.log(`✅ Wrote CSV to ${OUT_CSV}`);

  // Summary statistics
  const stats = {
    total: records.length,
    classed: records.filter(r => r.type === 'classed').length,
    monster: records.filter(r => r.type === 'monster').length,
    ambiguous: records.filter(r => r.type === 'ambiguous').length,
    highConfidence: records.filter(r => r.confidence === 'high').length,
    mediumConfidence: records.filter(r => r.confidence === 'medium').length,
    lowConfidence: records.filter(r => r.confidence === 'low').length,
    withWarnings: records.filter(r => r.warnings.length > 0).length
  };

  console.log(`\n${'='.repeat(80)}`);
  console.log('CLASSIFICATION SUMMARY');
  console.log(`${'='.repeat(80)}`);
  console.log(`Total creatures: ${stats.total}`);
  console.log(`  Classed NPCs: ${stats.classed} (${((stats.classed/stats.total)*100).toFixed(1)}%)`);
  console.log(`  Monsters: ${stats.monster} (${((stats.monster/stats.total)*100).toFixed(1)}%)`);
  console.log(`  Ambiguous: ${stats.ambiguous} (${((stats.ambiguous/stats.total)*100).toFixed(1)}%)`);
  console.log();
  console.log(`Confidence distribution:`);
  console.log(`  High: ${stats.highConfidence} (${((stats.highConfidence/stats.total)*100).toFixed(1)}%)`);
  console.log(`  Medium: ${stats.mediumConfidence} (${((stats.mediumConfidence/stats.total)*100).toFixed(1)}%)`);
  console.log(`  Low: ${stats.lowConfidence} (${((stats.lowConfidence/stats.total)*100).toFixed(1)}%)`);
  console.log();
  console.log(`Entries with warnings: ${stats.withWarnings} (${((stats.withWarnings/stats.total)*100).toFixed(1)}%)`);
  console.log(`${'='.repeat(80)}\n`);
}

main();
