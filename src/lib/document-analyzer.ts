import { processDumpWithValidation, ProcessedNPC, ValidationResult, ValidationWarning } from './npc-parser';

export interface DocumentStatBlock {
  npc: ProcessedNPC;
  pageNumber?: number;
  contextBefore?: string;
  contextAfter?: string;
  lineStart: number;
  lineEnd: number;
}

export interface DocumentComplianceReport {
  documentName: string;
  totalStatBlocks: number;
  totalCharacters: number;
  averageCompliance: number;
  statBlocks: DocumentStatBlock[];
  overallIssues: {
    errors: number;
    warnings: number;
    infos: number;
  };
  commonIssues: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  complianceDistribution: {
    excellent: number; // 90-100%
    good: number;      // 70-89%
    poor: number;      // 0-69%
  };
  recommendations: string[];
}

const STAT_BLOCK_PATTERNS = [
  // Bolded names
  /^\s*\*\*[^*\n]+\*\*\s*$/,
  // Title prefixes
  /^\s*(Sir|Lady|Lord|Dame|Master|Mistress|Captain|Commander|General|Admiral|Duke|Duchess|Count|Countess|Baron|Baroness|Knight|Ser)\s+/,
  // Field patterns
  /^\s*(Disposition|Race & Class|Hit Points|Armor Class|Primary attributes|Equipment|Spells|Mount|Background):/,
  // Unit roster patterns
  /^\s*[A-Z][a-z\s]+ x\d+/,
  // Monster stat patterns
  /^\s*(HD|AC|MOVE|ATTACKS|SPECIAL|SAVES|TYPE|TREASURE|XP):/i
];

export function analyzeDocument(documentText: string, documentName: string = 'Untitled Document'): DocumentComplianceReport {
  const lines = documentText.split(/\r?\n/);
  const statBlocks = extractStatBlocksFromDocument(documentText);

  if (statBlocks.length === 0) {
    return {
      documentName,
      totalStatBlocks: 0,
      totalCharacters: 0,
      averageCompliance: 0,
      statBlocks: [],
      overallIssues: { errors: 0, warnings: 0, infos: 0 },
      commonIssues: [],
      complianceDistribution: { excellent: 0, good: 0, poor: 0 },
      recommendations: [
        'No stat blocks detected in this document',
        'Ensure stat blocks follow C&C formatting conventions',
        'Use **Name** format for NPC names',
        'Include standard fields like Disposition, Race & Class, HP, AC'
      ]
    };
  }

  const allWarnings = statBlocks.flatMap(sb => sb.npc.validation.warnings);
  const averageCompliance = Math.round(
    statBlocks.reduce((sum, sb) => sum + sb.npc.validation.complianceScore, 0) / statBlocks.length
  );

  const overallIssues = {
    errors: allWarnings.filter(w => w.type === 'error').length,
    warnings: allWarnings.filter(w => w.type === 'warning').length,
    infos: allWarnings.filter(w => w.type === 'info').length
  };

  const issueCategories = new Map<string, number>();
  allWarnings.forEach(w => {
    issueCategories.set(w.category, (issueCategories.get(w.category) || 0) + 1);
  });

  const commonIssues = Array.from(issueCategories.entries())
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / allWarnings.length) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const complianceDistribution = {
    excellent: statBlocks.filter(sb => sb.npc.validation.complianceScore >= 90).length,
    good: statBlocks.filter(sb => sb.npc.validation.complianceScore >= 70 && sb.npc.validation.complianceScore < 90).length,
    poor: statBlocks.filter(sb => sb.npc.validation.complianceScore < 70).length
  };

  const recommendations = generateDocumentRecommendations(statBlocks, commonIssues, complianceDistribution);

  return {
    documentName,
    totalStatBlocks: statBlocks.length,
    totalCharacters: documentText.length,
    averageCompliance,
    statBlocks,
    overallIssues,
    commonIssues,
    complianceDistribution,
    recommendations
  };
}

function extractStatBlocksFromDocument(documentText: string): DocumentStatBlock[] {
  const lines = documentText.split(/\r?\n/);
  const statBlocks: DocumentStatBlock[] = [];
  let currentBlock = '';
  let blockStartLine = -1;
  let inStatBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isStatBlockLine = isLinePartOfStatBlock(line, lines, i);

    if (isStatBlockLine && !inStatBlock) {
      // Start of new stat block
      inStatBlock = true;
      blockStartLine = i;
      currentBlock = line;
    } else if (isStatBlockLine && inStatBlock) {
      // Continuation of current stat block
      currentBlock += '\n' + line;
    } else if (inStatBlock && !isStatBlockLine) {
      // End of current stat block
      try {
        const processed = processDumpWithValidation(currentBlock);
        if (processed.length > 0) {
          const contextBefore = lines.slice(Math.max(0, blockStartLine - 2), blockStartLine).join('\n').trim();
          const contextAfter = lines.slice(i, Math.min(lines.length, i + 3)).join('\n').trim();

          statBlocks.push({
            npc: processed[0],
            lineStart: blockStartLine + 1,
            lineEnd: i,
            contextBefore: contextBefore || undefined,
            contextAfter: contextAfter || undefined
          });
        }
      } catch (error) {
        // Skip malformed stat blocks
      }

      inStatBlock = false;
      currentBlock = '';
      blockStartLine = -1;
    }
  }

  // Handle case where document ends with a stat block
  if (inStatBlock && currentBlock.trim()) {
    try {
      const processed = processDumpWithValidation(currentBlock);
      if (processed.length > 0) {
        const contextBefore = lines.slice(Math.max(0, blockStartLine - 2), blockStartLine).join('\n').trim();

        statBlocks.push({
          npc: processed[0],
          lineStart: blockStartLine + 1,
          lineEnd: lines.length,
          contextBefore: contextBefore || undefined
        });
      }
    } catch (error) {
      // Skip malformed stat blocks
    }
  }

  return statBlocks;
}

function isLinePartOfStatBlock(line: string, allLines: string[], index: number): boolean {
  const trimmed = line.trim();

  // Empty lines might be part of a stat block if surrounded by stat block content
  if (!trimmed) {
    const prevLine = index > 0 ? allLines[index - 1].trim() : '';
    const nextLine = index < allLines.length - 1 ? allLines[index + 1].trim() : '';

    // Allow empty lines between stat block components
    if (STAT_BLOCK_PATTERNS.some(pattern => pattern.test(prevLine)) ||
        STAT_BLOCK_PATTERNS.some(pattern => pattern.test(nextLine))) {
      return true;
    }
    return false;
  }

  // Check if line matches any stat block pattern
  if (STAT_BLOCK_PATTERNS.some(pattern => pattern.test(line))) {
    return true;
  }

  // Check for parenthetical stat blocks like "(HP 59, AC 13)"
  if (/\(.*(?:HP|AC|HD)\s*\d+.*\)/.test(line)) {
    return true;
  }

  // Check for prose descriptions that might contain stat info
  if (/(?:he|she|they)\s+(?:is|are)\s+(?:a\s+)?(?:lawful|chaotic|neutral|good|evil)/i.test(line)) {
    return true;
  }

  // Check if it's a continuation line (starts with lowercase or contains equipment-like terms)
  if (/^[a-z]/.test(trimmed) || /\b(?:carries|wields|equipped with|magic|spell|mount|horse)\b/i.test(line)) {
    // Only consider it part of stat block if previous line was also part of one
    const prevLine = index > 0 ? allLines[index - 1].trim() : '';
    return STAT_BLOCK_PATTERNS.some(pattern => pattern.test(prevLine));
  }

  return false;
}

function generateDocumentRecommendations(
  statBlocks: DocumentStatBlock[],
  commonIssues: Array<{category: string; count: number; percentage: number}>,
  distribution: {excellent: number; good: number; poor: number}
): string[] {
  const recommendations: string[] = [];
  const total = statBlocks.length;

  // Overall compliance recommendations
  if (distribution.poor > total * 0.3) {
    recommendations.push('Focus on basic compliance: ensure all NPCs have Disposition, Race & Class, HP, and AC fields');
  }

  if (distribution.excellent < total * 0.5) {
    recommendations.push('Use the Auto-Correction feature to fix common formatting issues across all stat blocks');
  }

  // Specific issue recommendations
  const topIssues = commonIssues.slice(0, 3);
  topIssues.forEach(issue => {
    switch (issue.category) {
      case 'Disposition':
        recommendations.push('Convert alignment terminology: use "law/good" instead of "Lawful Good"');
        break;
      case 'Race & Class':
        recommendations.push('Ensure all NPCs specify both race and class with level (e.g., "human, 5th level fighter")');
        break;
      case 'Hit Points (HP)':
        recommendations.push('Include HP values for all NPCs, even if estimated');
        break;
      case 'Primary attributes':
        recommendations.push('Specify primary attributes using full names (strength, wisdom) instead of abbreviations');
        break;
      case 'Name Formatting':
        recommendations.push('Bold all NPC names using **double asterisks** for consistency');
        break;
    }
  });

  // Add general recommendations if none were added
  if (recommendations.length === 0) {
    recommendations.push('Document appears to be in good compliance with C&C conventions');
    recommendations.push('Consider using italics for magic items and spells');
    recommendations.push('Ensure shield types are specified (e.g., "medium steel shield")');
  }

  // Add document-specific recommendations
  if (total > 20) {
    recommendations.push('Consider creating an index of NPCs by role/location for easy reference');
  }

  if (total > 50) {
    recommendations.push('Large document detected: consider splitting into sections by chapter or encounter area');
  }

  return recommendations.slice(0, 8); // Limit to 8 recommendations
}

export function generateDocumentReport(report: DocumentComplianceReport): string {
  const { documentName, totalStatBlocks, averageCompliance, overallIssues, commonIssues, complianceDistribution } = report;

  let output = `# Document Compliance Report: ${documentName}\n\n`;

  // Summary section
  output += `## Summary\n`;
  output += `- **Total NPCs/Monsters**: ${totalStatBlocks}\n`;
  output += `- **Average Compliance**: ${averageCompliance}%\n`;
  output += `- **Total Issues**: ${overallIssues.errors + overallIssues.warnings + overallIssues.infos}\n`;
  output += `  - Errors: ${overallIssues.errors}\n`;
  output += `  - Warnings: ${overallIssues.warnings}\n`;
  output += `  - Info: ${overallIssues.infos}\n\n`;

  // Compliance distribution
  output += `## Compliance Distribution\n`;
  output += `- **Excellent (90-100%)**: ${complianceDistribution.excellent} NPCs\n`;
  output += `- **Good (70-89%)**: ${complianceDistribution.good} NPCs\n`;
  output += `- **Needs Work (0-69%)**: ${complianceDistribution.poor} NPCs\n\n`;

  // Common issues
  if (commonIssues.length > 0) {
    output += `## Most Common Issues\n`;
    commonIssues.forEach((issue, index) => {
      output += `${index + 1}. **${issue.category}**: ${issue.count} occurrences (${issue.percentage}%)\n`;
    });
    output += '\n';
  }

  // Recommendations
  output += `## Recommendations\n`;
  report.recommendations.forEach((rec, index) => {
    output += `${index + 1}. ${rec}\n`;
  });
  output += '\n';

  // Detailed results
  output += `## Detailed Results\n`;
  report.statBlocks.forEach((sb, index) => {
    const npcName = sb.npc.converted.split('(')[0].trim().replace(/^\*\*|\*\*$/g, '');
    const hasIssues = sb.npc.validation.warnings.length > 0;
    const complianceIcon = sb.npc.validation.complianceScore >= 90 ? '✅' :
                          sb.npc.validation.complianceScore >= 70 ? '⚠️' : '❌';

    output += `### ${index + 1}. ${npcName} ${complianceIcon}\n`;
    output += `- **Location**: Lines ${sb.lineStart}-${sb.lineEnd}\n`;
    output += `- **Compliance**: ${sb.npc.validation.complianceScore}%\n`;

    if (hasIssues) {
      const errors = sb.npc.validation.warnings.filter(w => w.type === 'error');
      const warnings = sb.npc.validation.warnings.filter(w => w.type === 'warning');
      const infos = sb.npc.validation.warnings.filter(w => w.type === 'info');

      if (errors.length > 0) {
        output += `- **Errors**: ${errors.map(e => e.category).join(', ')}\n`;
      }
      if (warnings.length > 0) {
        output += `- **Warnings**: ${warnings.map(w => w.category).join(', ')}\n`;
      }
      if (infos.length > 0) {
        output += `- **Info**: ${infos.map(i => i.category).join(', ')}\n`;
      }
    } else {
      output += `- **Status**: Fully compliant ✅\n`;
    }
    output += '\n';
  });

  return output;
}