'use client';

// App component
import { useState } from 'react';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DictionaryStats } from '@/components/DictionaryStats';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { Copy, Download, Upload, AlertCircle, Trash, FileText, AlertTriangle as Warning, Info, CheckCircle, ChevronDown, ChevronRight, Wand2 as Wand, Sparkle, ArrowRight, Clipboard, FileCode as FileHtml, FileCheck, Users, Skull } from 'lucide-react';
import { generateNPCTemplate, generateBatchTemplate, processDumpWithValidation, ProcessedNPC, ValidationWarning, CorrectionFix, generateAutoCorrectionFixes, applyCorrectionFix, applyAllHighConfidenceFixes, convertToHtml, ValidationResult } from '@/lib/npc-parser';
import type { DictionaryCounts } from '@/lib/dictionary-counts';
import { formatVersionString } from '@/lib/version';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

// Optional: ordinal superscript plugin
import { visit } from 'unist-util-visit';
function remarkOrdinals() {
  return (tree) => {
    visit(tree, 'text', (node, idx, parent) => {
      const text = String(node.value);

      // Handle both formats: 1st/2nd/3rd/4th and ^th^/^st^/^nd^/^rd^
      const parts = text.split(/(\b\d{1,3}(?:st|nd|rd|th)\b|\d{1,3}\^(?:st|nd|rd|th)\^)/);
      if (parts.length === 1) return;

      const newChildren = parts.flatMap((seg) => {
        // Handle standard ordinals (1st, 2nd, 3rd, 4th)
        const standardMatch = seg.match(/^(\d{1,3})(st|nd|rd|th)$/);
        if (standardMatch) {
          return [
            { type: 'text', value: standardMatch[1] },
            { type: 'sup', children: [{ type: 'text', value: standardMatch[2] }], data: { hName: 'sup' } }
          ];
        }

        // Handle caret ordinals (1^st^, 2^nd^, 3^rd^, 4^th^)
        const caretMatch = seg.match(/^(\d{1,3})\^(st|nd|rd|th)\^$/);
        if (caretMatch) {
          return [
            { type: 'text', value: caretMatch[1] },
            { type: 'sup', children: [{ type: 'text', value: caretMatch[2] }], data: { hName: 'sup' } }
          ];
        }

        return [{ type: 'text', value: seg }];
      });
      parent.children.splice(idx, 1, ...newChildren);
    });
  };
}

// Custom sanitize schema to allow <sup>, <b>, <i>, <br> and className on div/span
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'sup', 'b', 'i', 'br'],
  attributes: {
    ...(defaultSchema.attributes || {}),
    div: ['className'],
    span: ['className'],
  },
} as const;

const getWarningIcon = (type: ValidationWarning['type']) => {
  switch (type) {
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-300" />;
    case 'warning':
      return <Warning className="h-4 w-4 text-amber-300" />;
    case 'info':
      return <Info className="h-4 w-4 text-sky-300" />;
    default:
      return <Info className="h-4 w-4 text-foreground/70" />;
  }
};

const getComplianceColor = (score: number) => {
  if (score >= 90) return 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100';
  if (score >= 70) return 'border-amber-400/60 bg-amber-400/20 text-amber-100';
  return 'border-rose-500/60 bg-rose-500/20 text-rose-100';
};

type ValidationWarningsProps = {
  validation: ValidationResult;
  npcIndex: number;
};

function ValidationWarnings({ validation, npcIndex }: ValidationWarningsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = `validation-panel-${npcIndex}`;

  if (validation.warnings.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 shadow-inner shadow-emerald-500/20">
        <CheckCircle className="h-4 w-4 text-emerald-300" />
        <span className="text-emerald-100">Fully compliant with C&C conventions</span>
        <Badge variant="outline" className="ml-auto normal-case border-emerald-400/50 bg-emerald-500/15 text-emerald-100">
          {validation.complianceScore}%
        </Badge>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-white/10"
          aria-controls={panelId}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="text-sm font-medium">Validation Results</span>
            <Badge variant="outline" className={`normal-case ${getComplianceColor(validation.complianceScore)}`}>
              {validation.complianceScore}%
            </Badge>
          </div>
          <div className="flex gap-1">
            {validation.warnings.filter((w: ValidationWarning) => w.type === 'error').length > 0 && (
              <Badge variant="destructive" className="text-xs normal-case border-red-500/50 bg-red-500/20 text-red-100">
                {validation.warnings.filter((w: ValidationWarning) => w.type === 'error').length} errors
              </Badge>
            )}
            {validation.warnings.filter((w: ValidationWarning) => w.type === 'warning').length > 0 && (
              <Badge variant="outline" className="text-xs normal-case border-amber-400/50 bg-amber-400/20 text-amber-100">
                {validation.warnings.filter((w: ValidationWarning) => w.type === 'warning').length} warnings
              </Badge>
            )}
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent id={panelId}>
        <div className="space-y-3 border-t border-white/10 pt-3">
          {validation.warnings.map((warning: ValidationWarning, idx: number) => (
            <div
              key={idx}
              className={`rounded-xl border p-3 text-sm shadow-inner shadow-black/20 backdrop-blur ${
                warning.type === 'error'
                  ? 'border-red-500/40 bg-red-500/15 text-red-100'
                  : warning.type === 'warning'
                  ? 'border-amber-400/40 bg-amber-400/15 text-amber-100'
                  : 'border-sky-400/40 bg-sky-500/15 text-sky-100'
              }`}
            >
              <div className="flex items-start gap-2">
                {getWarningIcon(warning.type)}
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
                      {warning.category}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] normal-case border-white/40 bg-white/10 text-white"
                    >
                      {warning.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-white">
                    {warning.message}
                  </p>
                  {warning.suggestion && (
                    <p className="mt-1 text-xs text-white/70">
                      Suggestion: {warning.suggestion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Preview({ markdown, id }: { markdown: string; id: string }) {
  return (
    <div id={id} className="prose prose-sm prose-invert max-w-none text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkOrdinals]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={{
          strong: (p) => <b {...p} />,
          em: (p) => <i {...p} />,
          sup: (p) => <sup {...p} />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
import { toast } from 'sonner';
// Use localStorage-backed KV to avoid requiring Spark runtime in repo context
import { useKV } from '@/hooks/use-kv';
import { Switch } from '@/components/ui/switch';
import { initializePreloadedDictionaries, getDictionaryCounts } from '@/data';
import { DocumentAnalyzer } from '@/components/DocumentAnalyzer';
import { SpellConverter } from '@/components/SpellConverter';

const EXAMPLE_TEXT = `**The Right Honorable President Counselor of Yggsburgh, His Supernal Devotion Victor Oldham, High Priest of the Grand Temple**

Disposition: law/good
Race & Class: human, 16th level cleric
Hit Points (HP): 59
Armor Class (AC): 13/22
Primary attributes: strength, wisdom, charisma
Equipment: pectoral of armor +3, full plate mail, large steel shield, staff of striking, mace
Spells: 0–6, 1st–6, 2nd–5, 3rd–5, 4th–4, 5th–4, 6th–3, 7th–3, 8th–2
Mount: heavy war horse`;

const ALTERNATIVE_EXAMPLE = `**Hector Markle, Secretary Counselor**
human, 1st level scholar
Disposition: law/neutral
Hit Points (HP): 5
Armor Class (AC): 10
Primary attributes: intelligence
Equipment: nobleman’s clothing

**Guard Captain Miller**
Disposition: law/good
Race & Class: human, 5th level fighter
Hit Points (HP): 35
Armor Class (AC): 18
Primary attributes: strength, constitution
Equipment: longsword +1, plate mail, medium steel shield`;

const VALIDATION_EXAMPLE = `**Sir Marcus: the Bold Knight**
Alignment: lawful good
Race & Class: 5th level human fighter/2nd level cleric  
Hit Points (HP): 4d10+8
Armor Class (AC): 18 (+1 from dex, +7 from plate, +2 from shield)
Prime Attributes (PA): Str, Con, Wis
Equipment: +1 longsword, plate mail, heavy steel shield, 500 gp, pectoral of protection +2, staff of striking
Gear: backpack, rope
Spells: cure light wounds, bless, protection from evil
Special Abilities: improved grab, darkvision, spell resistance
Vision: infravision 60 feet
Mount: warhorse
Gender: he leads his troops
Background: This sixteenth level fighter serves as captain`;

function App() {
  const COMMIT = process.env.NEXT_PUBLIC_COMMIT_HASH ?? 'dev';
  const BUILT = process.env.NEXT_PUBLIC_BUILD_DATE ?? 'local';

  const [appliedFixes, setAppliedFixes] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<ProcessedNPC[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedResults, setSavedResults, deleteSavedResults] = useKV<string[]>('npc-parser-results', []);
  const [showValidation, setShowValidation] = useState(true);
  const [availableFixes, setAvailableFixes] = useState<CorrectionFix[]>([]);
  const [normalizeInput, setNormalizeInput] = useState(true);
  const [dictEnabled, setDictEnabled] = useState(true);
  const [formatterMode, setFormatterMode] = useState<'enhanced' | 'npc' | 'monster'>('enhanced');
  const [dictCounts, setDictCounts] = useState<DictionaryCounts>(() => getDictionaryCounts());

  // Initialize pre-loaded dictionaries on component mount
  React.useEffect(() => {
    initializePreloadedDictionaries();
    setDictCounts(getDictionaryCounts());
  }, []);

  const processInput = (
    text: string,
    overrides?: { normalizeInput?: boolean; dictionaryEnabled?: boolean; formatterMode?: 'enhanced' | 'npc' | 'monster' },
  ) => {
    if (!text.trim()) {
      setResults([]);
      setError(null);
      setAvailableFixes([]);
      return;
    }

    try {
      const shouldNormalize = overrides?.normalizeInput ?? normalizeInput;
      const dictionariesActive = overrides?.dictionaryEnabled ?? dictEnabled;
      const mode = overrides?.formatterMode ?? formatterMode;
      const correctionOptions = { enableDictionarySuggestions: dictionariesActive };

      const toParse = shouldNormalize
        ? applyAllHighConfidenceFixes(text, correctionOptions)
        : text;

      // Use enhanced parser for 'enhanced' mode, regular for 'npc' and 'monster'
      const useEnhanced = mode === 'enhanced';
      const processed = processDumpWithValidation(toParse, useEnhanced, mode);

      const fixes = generateAutoCorrectionFixes(text, correctionOptions);
      setAvailableFixes(fixes);

      if (processed.length === 0) {
        setError('No valid NPC stat blocks found. Paste a name line followed by either labeled lines (Disposition, Race & Class, HP, AC, Primary attributes, Equipment, Spells, Mount) or a parenthetical abbreviated block. Partial data is OK.');
        setResults([]);
      } else {
        setResults(processed);
        setError(null);
      }
    } catch (err) {
      console.error('Parser error:', err);
      setError('Error parsing stat blocks. Please check your formatting and try again.');
      setResults([]);
      setAvailableFixes([]);
    }
  };

  const handleInputChange = (value: string) => {
    setInputText(value);
    processInput(value);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy text to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyHtmlToClipboard = async (text: string, index?: number) => {
    // Prefer the exact HTML rendered in the preview for this NPC
    let html = '';
    if (typeof index === 'number') {
      const el = document.getElementById(`preview-${index}`);
      if (el) html = el.innerHTML;
    }
    if (!html) {
      html = convertToHtml(text);
    }
    try {
      type ClipboardCapableWindow = Window & { ClipboardItem?: typeof ClipboardItem };
      type ClipboardWithWrite = Clipboard & { write?: (items: ClipboardItem[]) => Promise<void> };

      const clipboardWindow = window as ClipboardCapableWindow;
      const clipboard = navigator.clipboard as ClipboardWithWrite;

      if (clipboardWindow.ClipboardItem && clipboard && typeof clipboard.write === 'function') {
        const blob = new Blob([html], { type: 'text/html' });
        const clipboardItem = new clipboardWindow.ClipboardItem({ 'text/html': blob });
        await clipboard.write([clipboardItem]);
        toast.success('Copied as rich text (HTML)');
        return;
      }
      throw new Error('ClipboardItem not available');
    } catch (error) {
      try {
        await navigator.clipboard.writeText(html);
        toast.success('Copied as rich text (fallback)');
      } catch (fallbackError) {
        console.error('Failed to copy HTML to clipboard:', error, fallbackError);
        toast.error('Failed to copy as rich text.');
      }
    }
  };

  const copyNPCWithReport = async (result: ProcessedNPC, index: number) => {
    const npcWithReport = result.converted + generateSingleNPCReport(result, index);
    try {
      await navigator.clipboard.writeText(npcWithReport);
      const hasIssues = result.validation.warnings.length > 0;
      toast.success(`Copied NPC${hasIssues ? ' with validation report' : ' (fully compliant)'}`);
    } catch (error) {
      console.error('Failed to copy NPC report to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyAllWithReport = async () => {
    if (results.length === 0) return;
    const allText = results.map(r => r.converted).join('\n\n');
    const validationReport = generateValidationReport(results);
    const fullText = allText + validationReport;
    try {
      await navigator.clipboard.writeText(fullText);
      const totalIssues = results.reduce((sum, r) => sum + r.validation.warnings.length, 0);
      toast.success(`Copied ${results.length} NPCs${totalIssues > 0 ? ' with validation report' : ' (all compliant)'}`);
    } catch (error) {
      console.error('Failed to copy NPC batch report to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const generateSingleNPCReport = (result: ProcessedNPC, _index: number): string => {
    const npcName = result.converted.split('(')[0].trim().replace(/^\*\*|\*\*$/g, '');
    const warnings = result.validation.warnings;
    
    if (warnings.length === 0) {
      return `\n\n--- VALIDATION REPORT ---\n✅ ${npcName} is fully compliant with C&C conventions (${result.validation.complianceScore}% compliance)\nNo issues detected.`;
    }
    
    let report = `\n\n--- VALIDATION REPORT ---`;
    report += `\n🎭 NPC: ${npcName}`;
    report += `\n📈 Compliance Score: ${result.validation.complianceScore}%`;
    report += `\n⚠️  Total Issues: ${warnings.length}`;
    
    const errors = warnings.filter(w => w.type === 'error');
    const warns = warnings.filter(w => w.type === 'warning');
    const infos = warnings.filter(w => w.type === 'info');
    
    if (errors.length > 0) {
      report += `\n\n❌ ERRORS (${errors.length}):`;
      errors.forEach(error => {
        report += `\n• ${error.category}: ${error.message}`;
        if (error.suggestion) {
          report += `\n  💡 ${error.suggestion}`;
        }
      });
    }
    
    if (warns.length > 0) {
      report += `\n\n⚠️  WARNINGS (${warns.length}):`;
      warns.forEach(warning => {
        report += `\n• ${warning.category}: ${warning.message}`;
        if (warning.suggestion) {
          report += `\n  💡 ${warning.suggestion}`;
        }
      });
    }
    
    if (infos.length > 0) {
      report += `\n\nℹ️  INFORMATION (${infos.length}):`;
      infos.forEach(info => {
        report += `\n• ${info.category}: ${info.message}`;
      });
    }
    
    return report;
  };

  const generateValidationReport = (results: ProcessedNPC[]): string => {
    if (results.length === 0) return '';
    
    const totalWarnings = results.reduce((sum, r) => sum + r.validation.warnings.length, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.validation.warnings.filter(w => w.type === 'error').length, 0);
    const avgCompliance = Math.round(results.reduce((sum, r) => sum + r.validation.complianceScore, 0) / results.length);
    
    if (totalWarnings === 0) {
      return `\n\n--- VALIDATION REPORT ---\n✅ All ${results.length} NPC${results.length > 1 ? 's' : ''} fully compliant with C&C conventions (${avgCompliance}% average compliance)\nNo issues detected.`;
    }
    
    let report = `\n\n--- VALIDATION REPORT ---`;
    report += `\n📊 Summary: ${results.length} NPC${results.length > 1 ? 's' : ''} processed`;
    report += `\n📈 Average Compliance: ${avgCompliance}%`;
    report += `\n⚠️  Total Issues: ${totalWarnings} (${totalErrors} errors, ${totalWarnings - totalErrors} warnings)`;
    report += `\n\n--- DETAILED ISSUES ---`;
    
    results.forEach((result, index) => {
      const npcName = result.converted.split('(')[0].trim().replace(/^\*\*|\*\*$/g, '');
      const warnings = result.validation.warnings;
      
      if (warnings.length > 0) {
        report += `\n\n🎭 NPC ${index + 1}: ${npcName}`;
        report += `\n   Compliance: ${result.validation.complianceScore}%`;
        
        const errors = warnings.filter(w => w.type === 'error');
        const warns = warnings.filter(w => w.type === 'warning');
        const infos = warnings.filter(w => w.type === 'info');
        
        if (errors.length > 0) {
          report += `\n   ❌ ERRORS (${errors.length}):`;
          errors.forEach(error => {
            report += `\n      • ${error.category}: ${error.message}`;
            if (error.suggestion) {
              report += `\n        💡 ${error.suggestion}`;
            }
          });
        }
        
        if (warns.length > 0) {
          report += `\n   ⚠️  WARNINGS (${warns.length}):`;
          warns.forEach(warning => {
            report += `\n      • ${warning.category}: ${warning.message}`;
            if (warning.suggestion) {
              report += `\n        💡 ${warning.suggestion}`;
            }
          });
        }
        
        if (infos.length > 0) {
          report += `\n   ℹ️  INFO (${infos.length}):`;
          infos.forEach(info => {
            report += `\n      • ${info.category}: ${info.message}`;
          });
        }
      }
    });
    
    // Add common issue summary
    const allWarnings = results.flatMap(r => r.validation.warnings);
    const issueCategories = new Map<string, number>();
    allWarnings.forEach(w => {
      issueCategories.set(w.category, (issueCategories.get(w.category) || 0) + 1);
    });
    
    if (issueCategories.size > 0) {
      report += `\n\n--- COMMON ISSUES ---`;
      Array.from(issueCategories.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          report += `\n• ${category}: ${count} occurrence${count > 1 ? 's' : ''}`;
        });
    }
    
    report += `\n\n--- RECOMMENDATIONS ---`;
    report += `\n• Use the "Auto-Correction" feature to automatically fix common formatting issues`;
    report += `\n• Review each NPC's validation details for specific guidance`;
    report += `\n• For non-core or encounter-critical items, include a brief mechanical note; otherwise rely on PHB/Monsters & Treasure`;
    report += `\n• Use disposition nouns (law/good) instead of adjectives (lawful good)`;
    report += `\n• Use superscripts for level numbers (e.g., 16ᵗʰ level). Do not bold levels inside abbreviated stat blocks.`;
    
    return report;
  };



  const saveResults = () => {
    if (results.length === 0) return;
    const converted = results.map(r => r.converted);
    setSavedResults((current) => [...current, ...converted]);
    toast.success(`Saved ${results.length} NPC${results.length > 1 ? 's' : ''}`);
  };

  const clearSaved = () => {
    deleteSavedResults();
    toast.success('Cleared saved NPCs');
  };

  const downloadResults = () => {
    if (results.length === 0) return;
    const content = results.map(r => r.converted).join('\n\n');
    const validationReport = generateValidationReport(results);
    const fullContent = content + validationReport;
    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'npc-stat-blocks-with-validation.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const totalIssues = results.reduce((sum, r) => sum + r.validation.warnings.length, 0);
    toast.success(`Downloaded NPCs${totalIssues > 0 ? ' with validation report' : ' (all compliant)'}`);
  };

  const loadExample = () => {
    setInputText(EXAMPLE_TEXT);
    processInput(EXAMPLE_TEXT);
  };

  const loadAlternativeExample = () => {
    setInputText(ALTERNATIVE_EXAMPLE);
    processInput(ALTERNATIVE_EXAMPLE);
  };

  const loadValidationExample = () => {
    setInputText(VALIDATION_EXAMPLE);
    processInput(VALIDATION_EXAMPLE);
  };

  const applyFix = (fix: CorrectionFix) => {
    const correctedText = applyCorrectionFix(inputText, fix);
    setInputText(correctedText);
    processInput(correctedText);
    setAppliedFixes(prev => [...prev, fix.description]);
    toast.success(`Applied fix: ${fix.description}`);
  };

  const applyAllFixes = () => {
    const correctedText = applyAllHighConfidenceFixes(inputText, {
      enableDictionarySuggestions: dictEnabled,
    });
    setInputText(correctedText);
    processInput(correctedText);
    const highConfidenceCount = availableFixes.filter(f => f.confidence === 'high').length;
    toast.success(`Applied ${highConfidenceCount} automatic fixes`);
  };

  const loadTemplate = () => {
    const template = generateNPCTemplate();
    setInputText(template);
    processInput(template);
  };

  const loadBatchTemplate = () => {
    const template = generateBatchTemplate();
    setInputText(template);
    processInput(template);
  };

  const getFixConfidenceColor = (confidence: CorrectionFix['confidence']) => {
    switch (confidence) {
      case 'high': return 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100';
      case 'medium': return 'border-amber-400/60 bg-amber-400/20 text-amber-100';
      case 'low': return 'border-slate-400/50 bg-slate-500/20 text-slate-200';
      default: return 'border-slate-400/50 bg-slate-500/20 text-slate-200';
    }
  };


  return (
    <>
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-10%] h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(129,140,248,0.28),transparent_60%)]" />
          <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute -right-32 top-24 h-96 w-96 rounded-full bg-accent/25 blur-[140px]" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-6 pb-20 pt-12 lg:px-10 lg:pb-28">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary normal-case">
              Castles & Crusades toolkit
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Narrative-ready NPC stat blocks
            </h1>
            <div className="text-xs text-foreground/50 font-mono">
              {formatVersionString()}
            </div>
          <p className="text-lg text-foreground/80 md:text-xl">
            Transform raw notes into polished Castles & Crusades NPC stat blocks with automatic formatting, validation, and export tools.
          </p>
          <div className="flex flex-col items-center gap-3 text-sm text-foreground/70 sm:flex-row">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 shadow-inner shadow-black/20">
              <Sparkle className="h-4 w-4 text-primary" />
              <span>Auto-fixes shield types, primes, and level ordinals</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 shadow-inner shadow-black/20">
              <Info className="h-4 w-4 text-accent" />
              <span>23-point compliance validation with reporting</span>
            </div>
          </div>
          <DictionaryStats counts={dictCounts} className="mt-6 w-full" />
        </div>

          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Single/Batch Parser
              </TabsTrigger>
              <TabsTrigger value="document" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Document Analyzer
              </TabsTrigger>
              <TabsTrigger value="spell" className="flex items-center gap-2">
                <Wand className="h-4 w-4" />
                Spell Converter
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <Card className="h-fit border-white/15 bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Upload className="h-5 w-5 text-primary" />
                  Input Stat Blocks
                </CardTitle>
                <CardDescription className="text-card-foreground/70">
                  Paste your C&C NPC stat block(s) below. The parser automatically detects whether you've entered a single NPC or a batch.
                </CardDescription>
                <div className="mb-3 text-xs text-card-foreground/60">
                  <strong>Formatting rules:</strong> Follow these conventions for best results. Each badge summarizes a key rule for stat block formatting.
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="normal-case border-white/15 bg-white/5 text-[11px] text-foreground/80" title="Attributes like strength, wisdom, etc. should be lowercase.">lowercase attributes</Badge>
                  <Badge variant="outline" className="normal-case border-white/15 bg-white/5 text-[11px] text-foreground/80" title="Use superscript for levels (e.g., 5ᵗʰ level).">superscripts for levels</Badge>
                  <Badge variant="outline" className="normal-case border-white/15 bg-white/5 text-[11px] text-foreground/80" title="No bold text in abbreviated stat blocks.">no bold in abbreviated blocks</Badge>
                  <Badge variant="outline" className="normal-case border-white/15 bg-white/5 text-[11px] text-foreground/80" title="Specify shield type (e.g., medium steel shield).">explicit shield type</Badge>
                  <Badge variant="outline" className="normal-case border-white/15 bg-white/5 text-[11px] text-foreground/80" title="Put equipment bonus at the end (e.g., +2).">bonus at end (e.g., +2)</Badge>
                  <Badge variant="outline" className="normal-case border-white/15 bg-white/5 text-[11px] text-foreground/80" title="Use noun forms for disposition (e.g., law/good).">noun-form disposition</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <Textarea
                  placeholder="Paste your NPC stat block here..."
                  value={inputText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="font-mono text-sm min-h-[300px] resize-y"
                  id="npc-input"
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={loadExample} className="flex-1 min-w-[180px]">
                    Load Single NPC Example
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadAlternativeExample} className="flex-1 min-w-[180px]">
                    Load Batch NPC Example
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadValidationExample} className="flex-1 min-w-[180px]">
                    Load Validation Example
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={loadTemplate} className="flex-1 min-w-[160px]">
                    Insert Single NPC Template
                  </Button>
                  <Button variant="ghost" size="sm" onClick={loadBatchTemplate} className="flex-1 min-w-[160px]">
                    Insert Batch Template
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setInputText(EXAMPLE_TEXT)} className="flex-1 min-w-[160px]">
                    Restore Original Example
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={() => handleInputChange('')} className="flex items-center gap-2">
                    <Trash size={16} />
                    Clear
                  </Button>
                </div>

                <Card className="mt-2 border-white/15 bg-white/5">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm text-card-foreground">Updated C&C Dictionaries</CardTitle>
                    <CardDescription className="text-xs text-card-foreground/70">Pre-loaded with the latest Castles & Crusades name updates for spells, magic items, and monsters.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                      <div>
                        <div className="font-medium text-card-foreground">Enable dictionary normalization</div>
                        <div className="text-xs text-card-foreground/70">When enabled, auto-correction will suggest canonicalized names and italics using updated C&C terminology.</div>
                      </div>
                      <Switch
                        checked={dictEnabled}
                        onCheckedChange={(checked) => {
                          setDictEnabled(checked);
                          processInput(inputText, { dictionaryEnabled: checked });
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                      <div className="flex w-full flex-col items-center space-y-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-center">
                        <label className="block text-xs font-medium text-emerald-200">Updated Spells</label>
                        <div className="flex w-full flex-col items-center">
                          <div className="text-lg font-semibold text-emerald-100">{dictCounts.spells}</div>
                          <span className="text-xs text-emerald-200">Pre-loaded from latest C&C updates</span>
                        </div>
                      </div>
                      <div className="flex w-full flex-col items-center space-y-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-center">
                        <label className="block text-xs font-medium text-amber-200">Magic Items</label>
                        <div className="flex w-full flex-col items-center">
                          <div className="text-lg font-semibold text-amber-100">{dictCounts.items}</div>
                          <span className="text-xs text-amber-200">Ready for name normalization</span>
                        </div>
                      </div>
                      <div className="flex w-full flex-col items-center space-y-2 rounded-xl border border-sky-400/40 bg-sky-500/10 p-3 text-center">
                        <label className="block text-xs font-medium text-sky-200">Updated Monsters</label>
                        <div className="flex w-full flex-col items-center">
                          <div className="text-lg font-semibold text-sky-100">{dictCounts.monsters}</div>
                          <span className="text-xs text-sky-200">Latest creature name changes</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                  <div>
                    <div className="font-medium text-card-foreground">Normalize before parsing (safe fixes)</div>
                    <div className="text-xs text-card-foreground/70">Applies high-confidence auto-fixes (e.g., shield type, attribute names) prior to parsing.</div>
                  </div>
                  <Switch
                    checked={normalizeInput}
                    onCheckedChange={(checked) => {
                      setNormalizeInput(checked);
                      processInput(inputText, { normalizeInput: checked });
                    }}
                    aria-label="Normalize input before parsing"
                  />
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3">
                    <div className="font-medium text-card-foreground mb-1">Formatter Mode</div>
                    <div className="text-xs text-card-foreground/70">Choose the formatting style for your stat blocks</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={formatterMode === 'enhanced' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setFormatterMode('enhanced');
                        processInput(inputText, { formatterMode: 'enhanced' });
                      }}
                      className="flex-1 gap-2"
                    >
                      <Sparkle className="h-4 w-4" />
                      Enhanced
                    </Button>
                    <Button
                      variant={formatterMode === 'npc' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setFormatterMode('npc');
                        processInput(inputText, { formatterMode: 'npc' });
                      }}
                      className="flex-1 gap-2"
                    >
                      <Users className="h-4 w-4" />
                      NPC
                    </Button>
                    <Button
                      variant={formatterMode === 'monster' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setFormatterMode('monster');
                        processInput(inputText, { formatterMode: 'monster' });
                      }}
                      className="flex-1 gap-2"
                    >
                      <Skull className="h-4 w-4" />
                      Monster
                    </Button>
                  </div>
                  <div className="mt-3 text-xs text-card-foreground/60">
                    {formatterMode === 'enhanced' && '✨ Advanced extraction with mount separation and shield canonicalization'}
                    {formatterMode === 'npc' && '👥 Standard NPC formatting for characters with classes'}
                    {formatterMode === 'monster' && '💀 Monster formatting for creatures with HD, TREASURE, and XP'}
                  </div>
                </div>
                {availableFixes.length > 0 && (
                  <Card className="mt-4 border-primary/40 bg-primary/10 text-primary-foreground">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-primary-foreground">
                        <Wand className="h-5 w-5" />
                        Auto-Correction Available
                        <Badge variant="outline" className="normal-case border-primary/50 bg-primary/15 text-primary-foreground">
                          {availableFixes.length} fixes
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm text-primary-foreground/80">
                        Automated fixes for common C&C formatting issues. High-confidence fixes can be applied safely.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                          onClick={applyAllFixes}
                          className="flex items-center gap-2"
                          size="sm"
                          disabled={availableFixes.filter(f => f.confidence === 'high').length === 0}
                        >
                          <Sparkle className="h-4 w-4" />
                          Apply All Safe Fixes ({availableFixes.filter(f => f.confidence === 'high').length})
                        </Button>
                        <div className="text-sm text-primary-foreground/80">
                          Only high-confidence fixes are applied automatically
                        </div>
                      </div>

                      <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                        {availableFixes.map((fix, index) => (
                          <div key={index} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/10 p-3 text-sm shadow-inner shadow-black/20">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] normal-case ${getFixConfidenceColor(fix.confidence)}`}
                                >
                                  {fix.confidence}
                                </Badge>
                                <span className="text-xs font-medium uppercase tracking-wide text-primary-foreground/70">
                                  {fix.category}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-primary-foreground">
                                {fix.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-primary-foreground/80">
                                <code className="rounded border border-white/10 bg-white/10 px-2 py-0.5">
                                  {fix.originalText.length > 30
                                    ? `${fix.originalText.substring(0, 30)}...`
                                    : fix.originalText}
                                </code>
                                <ArrowRight className="h-3 w-3 text-primary-foreground/70" />
                                <code className="rounded border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-emerald-100">
                                  {fix.correctedText.length > 30
                                    ? `${fix.correctedText.substring(0, 30)}...`
                                    : fix.correctedText}
                                </code>
                              </div>
                            </div>
                            {appliedFixes.includes(fix.description) ? (
                              <Badge variant="default" className="ml-3 flex items-center gap-1 normal-case">
                                <CheckCircle className="h-3 w-3" /> Applied
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyFix(fix)}
                                className="ml-3 flex items-center gap-1"
                              >
                                <Wand className="h-3 w-3" />
                                Apply
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            <Card className="h-fit border-white/15 bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Download className="h-5 w-5 text-accent" />
                  Parsed Results
                </CardTitle>
                <CardDescription className="text-card-foreground/70">
                  The parsed NPC stat block appears below in the required narrative format, along with a compliance report.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {results.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-card-foreground/80 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowValidation(!showValidation)}
                        className="flex items-center gap-2"
                      >
                        {showValidation ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        {showValidation ? 'Hide' : 'Show'} Validation
                      </Button>
                      <div>Comprehensive C&C compliance validation across 23+ categories enabled</div>
                    </div>

                    <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
                      {results.map((result, index) => (
                        <div key={index} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/30 backdrop-blur">
                          {showValidation && (
                            <ValidationWarnings validation={result.validation} npcIndex={index} />
                          )}

                          <div className="text-sm text-card-foreground/80">
                            <strong>Preview:</strong> The box below shows how your stat block will look when pasted into Word or other rich text editors.<br />
                            <span>
                              <b>Bold</b> is used for the NPC name only. <i>Italics</i> are used for magic items, spells, and books. Parentheses are always plain except for allowed italics.<br />
                              To copy with formatting, use <b>Copy HTML</b> below. In Word, use <b>Paste Special &rarr; HTML</b> or <b>Paste</b> (Word will preserve bold/italics automatically).
                            </span>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 shadow-inner shadow-black/30">
                            <Preview id={`preview-${index}`} markdown={result.converted} />
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-card-foreground/70">
                            <Badge variant="outline" className="normal-case border-white/15 bg-white/5">NPC {index + 1}</Badge>
                            <span>Validation score: {result.validation.complianceScore}%</span>
                            {result.validation.warnings.length === 0 ? (
                              <span className="flex items-center gap-1 text-emerald-200">
                                <CheckCircle className="h-3 w-3" /> Fully compliant
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-200">
                                <Warning className="h-3 w-3" /> Issues detected
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => copyNPCWithReport(result, index)}
                              className="flex items-center gap-2 flex-1 min-w-[140px]"
                              size="sm"
                            >
                              <Clipboard size={16} />
                              Copy NPC + Report
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyHtmlToClipboard(result.converted, index)}
                              className="flex items-center gap-2 flex-1 min-w-[100px]"
                            >
                              <FileHtml size={16} />
                              Copy HTML
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(result.converted)}
                              className="flex items-center gap-2 flex-1 min-w-[120px]"
                            >
                              <FileText size={16} />
                              Copy Markdown
                            </Button>
                            {showValidation && (
                              <Badge
                                variant="outline"
                                className={`flex items-center gap-1 normal-case ${getComplianceColor(result.validation.complianceScore)}`}
                              >
                                {result.validation.warnings.length === 0 ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                {result.validation.complianceScore}%
                              </Badge>
                            )}
                          </div>

                          {index < results.length - 1 && <Separator className="my-4" />}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                      <Button
                        onClick={copyAllWithReport}
                        className="flex flex-1 items-center gap-2"
                      >
                        <Clipboard size={16} />
                        {results.length > 1 ? 'Copy All + Report' : 'Copy NPC(s) + Report'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={saveResults}
                        className="flex items-center gap-2"
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={downloadResults}
                        className="flex items-center gap-2"
                      >
                        <Download size={16} />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center text-card-foreground/60">
                    <p>Paste an NPC stat block in the input area to see the parsed result here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        {savedResults.length > 0 && (
            <Card className="border-white/15 bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-card-foreground">
                  <span>Saved NPCs ({savedResults.length})</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSaved}
                    className="flex items-center gap-2"
                  >
                    <Trash size={16} />
                    Clear All
                  </Button>
                </CardTitle>
                <CardDescription className="text-card-foreground/70">
                  Previously processed NPCs saved for quick reference. Note: validation details are not saved.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                  {savedResults.map((result, index) => (
                    <div key={index} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                      <pre className="flex-1 whitespace-pre-wrap break-words font-mono text-sm text-card-foreground/80">
                        {result}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result)}
                        className="flex-shrink-0"
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
            </TabsContent>

            <TabsContent value="document">
              <DocumentAnalyzer />
            </TabsContent>

            <TabsContent value="spell">
              <SpellConverter />
            </TabsContent>
          </Tabs>
        </div>

        {/* Version Footer */}
        <footer className="mt-16 border-t border-border/40 bg-card/30 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
            <div className="flex flex-col items-center justify-between gap-4 text-sm text-foreground/60 sm:flex-row">
              <div className="flex items-center gap-2">
                <span>Castles & Crusades NPC Stat Block Generator</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-xs text-foreground/60 sm:justify-end">
                <span className="flex items-center gap-2">
                  <span className="uppercase tracking-wide text-foreground/40">Build:</span>
                  <code className="rounded border border-white/10 bg-white/5 px-2 py-1 text-foreground/70">
                    {formatVersionString()}
                  </code>
                </span>
                <span className="flex items-center gap-2">
                  <span className="uppercase tracking-wide text-foreground/40">Commit:</span>
                  <code className="rounded border border-white/10 bg-white/5 px-2 py-1 text-foreground/70">
                    {COMMIT}
                  </code>
                </span>
                <span className="flex items-center gap-2">
                  <span className="uppercase tracking-wide text-foreground/40">Built:</span>
                  <code className="rounded border border-white/10 bg-white/5 px-2 py-1 text-foreground/70" title={BUILT}>
                    {BUILT}
                  </code>
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
      <Toaster />
    </>
  );
}

export default App;
