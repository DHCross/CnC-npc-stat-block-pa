#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { extractParentheticalData, buildCanonicalParenthetical, isUnitHeading, expandShorthandForClassed, normalizePrimaryAttributesForMonsters, canonicalizeShields, repositionMagicItemBonuses, normalizeEquipmentVerbs, deduplicateEquipment } from '../src/lib/enhanced-parser.ts';
import { classifyCreature, extractPreCheckData, getFormattingRules } from '../src/lib/classification-rules.ts';
import type { CanonicalData } from '../src/lib/canonical-data-mapper.ts';

const DATA_SCOPE = process.env.DATA_SCOPE || 'mouths-of-madness';
const DATA_DIR = path.join(process.cwd(), 'data', DATA_SCOPE);
const CANDIDATES = path.join(DATA_DIR, 'entities.candidates.json');
const OUT_CANON = path.join(DATA_DIR, 'entities.canonical.json');
const OUT_REPORT = path.join(DATA_DIR, 'canonical_report.json');

function safeReadJson(file: string) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return JSON.parse(fs.readFileSync(file, 'utf8')) as any[];
}

function safeWriteJson(file: string, obj: any) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
}

const parseFirstNumber = (value?: string | null): number | null => {
  if (!value) return null;
  const match = String(value).match(/-?\d+/);
  return match ? Number(match[0]) : null;
};

function buildCanonicalDataFromParenthetical(title: string, data: any): CanonicalData {
  return {
    name: title,
    level: data.level ?? null,
    hd: data.hd ?? null,
    hp: parseFirstNumber(data.hp),
    ac: parseFirstNumber(data.ac),
    disposition: data.disposition ?? null,
    primaryAttributes: data.attributes ?? data.significantAttributes ?? null,
    equipment: data.equipment ?? null,
    coins: data.coins ?? null,
    notes: data.significantAttributes ? [data.significantAttributes] : undefined,
  };
}

function analyzeAndCanonicalize() {
  const candidates = safeReadJson(CANDIDATES);
  const canonical: any[] = [];
  const report: any = {
    total: candidates.length,
    processed: 0,
    canonicalBuilt: 0,
    flagged: [],
    sample: []
  };

  for (const item of candidates) {
    try {
      const label =
        (item.inlineLabel && String(item.inlineLabel).trim()) ||
        (item.titleLine && String(item.titleLine).trim()) ||
        (item.title && String(item.title).trim()) ||
        '';
      const title = label || `Entry@${item.start ?? 'unknown'}`;
      const isUnit = isUnitHeading(title) || /\bx\s*\d+/i.test(title) || /\b(each|each of)\b/i.test(item.parenthetical || '');

      // Use authoritative extractor
      const data = extractParentheticalData(item.parenthetical || '', isUnit, title);

      // Ensure raw points back
      data.raw = item.parenthetical;

      // Fall back to parsed raceClass if extractor didn't find it
      if (!data.raceClass && item.raceClass) {
        data.raceClass = item.raceClass;
      }

      const canonicalData = buildCanonicalDataFromParenthetical(title, data);
      const preCheck = extractPreCheckData(title, canonicalData);
      const classification = classifyCreature(title, canonicalData);
      const formattingRules = classification ? getFormattingRules(classification, preCheck) : undefined;

      let canonicalParenthetical = buildCanonicalParenthetical(
        data,
        isUnit,
        false,
        true,
        title,
        formattingRules,
      );

      // Ensure equipment fields are normalized before canonical build so the
      // canonical outputs match the behavior in `npc-parser` and Storybook.
      if (data.equipment) {
        let equipment = data.equipment;
        equipment = canonicalizeShields(equipment);
        equipment = repositionMagicItemBonuses(equipment);
        equipment = normalizeEquipmentVerbs(equipment);
        equipment = deduplicateEquipment(equipment);
        data.equipment = equipment;
      }

      if (classification?.type === 'classed') {
        canonicalParenthetical = expandShorthandForClassed(canonicalParenthetical);
      } else if (classification?.type === 'monster') {
        canonicalParenthetical = normalizePrimaryAttributesForMonsters(canonicalParenthetical, false);
      }

      const out = {
        sourceIndex: item.start ?? null,
        title: title || null,
        labels: {
          inline: item.inlineLabel || null,
          titleLine: item.titleLine || null
        },
        isUnit,
        parsed: item,
        canonicalData: data,
        canonicalParenthetical
      };

      canonical.push(out);
      report.processed += 1;
      if (canonicalParenthetical && canonicalParenthetical.length > 0) report.canonicalBuilt += 1;

      // Flag common issues
      const flags: string[] = [];
      if (!data.hp && !data.ac) flags.push('missing HP and AC');
      if (!data.hp && data.ac) flags.push('missing HP');
      if (!data.ac && data.hp) flags.push('missing AC');
      if (!data.raceClass) flags.push('missing raceClass');
      if (!data.xp && !/XP[:\s]/i.test(item.parenthetical || '')) flags.push('missing XP');

      if (flags.length > 0) {
        report.flagged.push({ title: title || item.snippet || '', start: item.start, flags });
      }

      if (report.sample.length < 5) report.sample.push(out);
    } catch (err: any) {
      report.flagged.push({ title: item.titleLine || '', start: item.start, error: err.message });
    }
  }

  safeWriteJson(OUT_CANON, canonical);
  safeWriteJson(OUT_REPORT, report);

  console.log(`Processed ${report.processed} candidates. Built ${report.canonicalBuilt} canonical parentheticals.`);
  console.log(`Wrote ${OUT_CANON}`);
  console.log(`Wrote ${OUT_REPORT}`);
}

// Run
try {
  analyzeAndCanonicalize();
} catch (err: any) {
  console.error('Error:', err?.message || err);
  process.exit(2);
}
