import fs from 'fs';
import path from 'path';
import { analyzeFullDocument } from '@/lib/full-document-pipeline';

async function main() {
  const cwd = process.cwd();
  
  // Load canonical data if available
  const canonicalPath = path.join(cwd, 'data', 'mouths-of-madness', 'entities.canonical.json');
  let canonicalData: any[] = [];
  if (fs.existsSync(canonicalPath)) {
    try {
      canonicalData = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
      console.log(`Loaded ${canonicalData.length} canonical entries from entities.canonical.json`);
    } catch (err) {
      console.warn('Failed to load canonical data:', err);
    }
  }
  
  // Load canonical report for accurate validation metrics
  const reportPath = path.join(cwd, 'data', 'mouths-of-madness', 'canonical_report.json');
  let canonicalReport: any = null;
  if (fs.existsSync(reportPath)) {
    try {
      canonicalReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      console.log(`Loaded canonical report with ${canonicalReport.flagged?.length || 0} flagged items`);
    } catch (err) {
      console.warn('Failed to load canonical report:', err);
    }
  }
  
  // Try to find the mouths-of-madness canonical file in 'CnC Docs' folder
  // Prefer mouths-of-madness-canonical-clean.md without date suffix
  const docsDirCandidates = [path.join(cwd, 'CnC Docs'), path.join(cwd, 'CnC-Docs'), path.join(cwd, 'CnC Docs/')];
  let filePath = '';
  for (const dir of docsDirCandidates) {
    if (!fs.existsSync(dir)) continue;
    // Try exact match first
    const preferredFile = path.join(dir, 'mouths-of-madness-canonical-clean.md');
    if (fs.existsSync(preferredFile)) {
      filePath = preferredFile;
      break;
    }
    // Fall back to any canonical file
    const files = fs.readdirSync(dir);
    const candidate = files.find(f => f.startsWith('mouths-of-madness-canonical') && !f.includes('.11.14'));
    if (candidate) {
      filePath = path.join(dir, candidate);
      break;
    }
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(cwd, 'CnC Docs', 'mouths-of-madness-canonical-clean.md');
  }

  if (!fs.existsSync(filePath)) {
    console.error('Cannot find mouths-of-madness-canonical*.md in CnC Docs. Abort.');
    process.exit(2);
  }

  const md = fs.readFileSync(filePath, 'utf8');

  console.log('Running full-document pipeline on:', filePath);
  const analysis = analyzeFullDocument(md, 'Mouths of Madness', 'enhanced');
  
  // Merge canonical data into creatures
  if (canonicalData.length > 0 && analysis.creatures) {
    console.log(`Merging canonical data into ${analysis.creatures.length} creatures`);
    
    // Build a map of flagged entries from canonical report
    const flaggedMap = new Map<string, string[]>();
    if (canonicalReport?.flagged) {
      for (const item of canonicalReport.flagged) {
        if (item.title && item.flags) {
          flaggedMap.set(item.title, item.flags);
        }
      }
    }
    
    for (let i = 0; i < analysis.creatures.length && i < canonicalData.length; i++) {
      const creature = analysis.creatures[i];
      const canonical = canonicalData[i];
      
      if (canonical.canonicalParenthetical) {
        creature.converted = creature.converted.replace(
          /\*[^*]+\*\s*$/,
          `*${canonical.canonicalParenthetical}*`
        );
      }
      
      // Also add the canonical data to the creature object for reference
      if (canonical.canonicalData) {
        creature.canonicalData = canonical.canonicalData;
      }
      
      // Update validation based on canonical report
      const flags = flaggedMap.get(canonical.title);
      if (flags && flags.length > 0) {
        // This creature is flagged - lower compliance score
        creature.validation = {
          warnings: flags.map(flag => ({
            type: 'warning' as const,
            category: 'Canonical Analysis',
            message: flag,
          })),
          complianceScore: 80,
        };
      } else {
        // This creature passed canonical validation - high compliance
        creature.validation = {
          warnings: [],
          complianceScore: 95,
        };
      }
    }
  }
  
  // If we have classification results, merge them into the analysis for Storybook use
  const classificationPath = path.join(process.cwd(), 'data', 'mouths-of-madness', 'creature-classifications.json');
  if (fs.existsSync(classificationPath)) {
    try {
      const classifications = JSON.parse(fs.readFileSync(classificationPath, 'utf8'));
      if (Array.isArray(classifications) && analysis.creatures) {
        const byEntry = new Map<number, any>();
        for (const c of classifications) {
          if (typeof c.entryNumber === 'number') byEntry.set(c.entryNumber, c);
        }

        for (const creature of analysis.creatures) {
          const c = byEntry.get(creature.entryNumber);
          if (c) {
            creature.classification = {
              type: c.type,
              subtype: c.subtype,
              confidence: c.confidence,
              reasoning: c.reasoning,
              warnings: c.warnings,
            } as any;
          } else {
            creature.classification = null;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to attach classification data to Storybook mock', err);
    }
  }
  
  // Override validation report with canonical report data
  if (canonicalReport && analysis.validationReport) {
    console.log('Replacing validation report with canonical analyzer results');
    const flaggedCount = canonicalReport.flagged?.length || 0;
    const totalEntries = canonicalData.length || analysis.creatures?.length || 0;
    
    // Calculate compliance based on entries without critical flags
    const compliance = totalEntries > 0 
      ? Math.round(((totalEntries - flaggedCount) / totalEntries) * 100)
      : 100;
    
    analysis.validationReport = {
      totalValidationScore: compliance,
      perCreatureScores: analysis.creatures?.map(() => compliance) || [],
      crossEntryIssues: [],
      statisticalAnomalies: [],
      recommendations: [
        ...(compliance < 70 ? ['Overall compliance is below 70% - consider using auto-correction features'] : []),
        ...(flaggedCount > 0 ? [`${flaggedCount} entries flagged in canonical report - review for completeness`] : []),
      ],
      totalIssues: flaggedCount,
      criticalIssues: flaggedCount,
    };
  }

  // Sanitize the object: remove circular or complex data if needed
  const out = JSON.stringify(analysis, null, 2);

  const destDir = path.join(cwd, 'src', 'components', 'mocks');
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, 'mouths-of-madness.mock.ts');

  const content = `/* This file is auto-generated by scripts/generate-mouths-mock.ts */\nexport const mouthsOfMadnessAnalysis = ${out} as const;\n`;
  fs.writeFileSync(dest, content, 'utf8');

  console.log('Wrote mock to', dest);
}

main().catch((err) => {
  console.error('Error generating mock:', err);
  process.exit(1);
});
