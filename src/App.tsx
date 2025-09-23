'use client';

// App component
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Toaster } from '@/components/ui/sonner';
import { Copy, Download, Upload, AlertCircle, Trash, FileText, AlertTriangle as Warning, Info, CheckCircle, ChevronDown, ChevronRight, Wand2 as Wand, Sparkle, ArrowRight, Clipboard, FileCode as FileHtml } from 'lucide-react';
import { processDump, generateNPCTemplate, generateBatchTemplate, processDumpWithValidation, ProcessedNPC, ValidationWarning, CorrectionFix, generateAutoCorrectionFixes, applyCorrectionFix, applyAllHighConfidenceFixes, convertToHtml, setDictionaries } from '@/lib/npc-parser';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

// Optional: ordinal superscript plugin
import { visit } from 'unist-util-visit';
function remarkOrdinals() {
  return (tree) => {
    visit(tree, 'text', (node, idx, parent) => {
      const parts = String(node.value).split(/(\b\d{1,3}(?:st|nd|rd|th)\b)/);
      if (parts.length === 1) return;
      const newChildren = parts.flatMap((seg) => {
        const m = seg.match(/^(\d{1,3})(st|nd|rd|th)$/);
        if (m) {
          return [
            { type: 'text', value: m[1] },
            { type: 'sup', children: [{ type: 'text', value: m[2] }], data: { hName: 'sup' } }
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

function Preview({ markdown, id }: { markdown: string; id: string }) {
  return (
    <div id={id} className="prose prose-sm max-w-none">
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
  const [appliedFixes, setAppliedFixes] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<ProcessedNPC[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedResults, setSavedResults, deleteSavedResults] = useKV<string[]>('npc-parser-results', []);
  const [showValidation, setShowValidation] = useState(true);
  const [availableFixes, setAvailableFixes] = useState<CorrectionFix[]>([]);
  const [normalizeInput, setNormalizeInput] = useState(false);
  const [dictEnabled, setDictEnabled] = useState(true);
  const [dictCounts, setDictCounts] = useState({ spells: 0, items: 0, monsters: 0 });

  const processInput = (text: string) => {
    if (!text.trim()) {
      setResults([]);
      setError(null);
      setAvailableFixes([]);
      return;
    }

    try {
      const toParse = normalizeInput ? applyAllHighConfidenceFixes(text) : text;
      const processed = processDumpWithValidation(toParse);
  const fixes = generateAutoCorrectionFixes(text);
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
    } catch (err) {
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
      const anyWindow = window as any;
      if (anyWindow.ClipboardItem && navigator.clipboard && (navigator.clipboard as any).write) {
        const blob = new Blob([html], { type: 'text/html' });
        const clipboardItem = new anyWindow.ClipboardItem({ 'text/html': blob });
        await (navigator.clipboard as any).write([clipboardItem]);
        toast.success('Copied as rich text (HTML)');
        return;
      }
      throw new Error('ClipboardItem not available');
    } catch (err) {
      try {
        await navigator.clipboard.writeText(html);
        toast.success('Copied as rich text (fallback)');
      } catch (err2) {
        console.error('Failed to copy HTML to clipboard:', err, err2);
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
    } catch (err) {
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
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const generateSingleNPCReport = (result: ProcessedNPC, index: number): string => {
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
    const correctedText = applyAllHighConfidenceFixes(inputText);
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

  const getWarningIcon = (type: ValidationWarning['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <Warning className="w-4 h-4 text-yellow-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getFixConfidenceColor = (confidence: CorrectionFix['confidence']) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const ValidationWarnings = ({ validation, npcIndex }: { validation: any; npcIndex: number }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (validation.warnings.length === 0) {
      return (
        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-green-800">Fully compliant with C&C conventions</span>
          <Badge variant="outline" className="ml-auto bg-green-100 text-green-800">
            {validation.complianceScore}%
          </Badge>
        </div>
      );
    }

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <div className="flex items-center gap-2">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="text-sm">Validation Results</span>
              <Badge 
                variant="outline" 
                className={`${getComplianceColor(validation.complianceScore)} text-white`}
              >
                {validation.complianceScore}%
              </Badge>
            </div>
            <div className="flex gap-1">
              {validation.warnings.filter((w: ValidationWarning) => w.type === 'error').length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {validation.warnings.filter((w: ValidationWarning) => w.type === 'error').length} errors
                </Badge>
              )}
              {validation.warnings.filter((w: ValidationWarning) => w.type === 'warning').length > 0 && (
                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                  {validation.warnings.filter((w: ValidationWarning) => w.type === 'warning').length} warnings
                </Badge>
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 p-2 border-t">
            {validation.warnings.map((warning: ValidationWarning, idx: number) => (
              <div
                key={idx}
                className={`p-2 rounded text-sm border-l-4 ${
                  warning.type === 'error'
                    ? 'bg-red-50 border-red-500'
                    : warning.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-2">
                  {getWarningIcon(warning.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-xs uppercase tracking-wide">
                        {warning.category}
                      </span>
                    </div>
                    <p className="text-sm">{warning.message}</p>
                    {warning.suggestion && (
                      <p className="text-xs mt-1 opacity-75">
                        💡 {warning.suggestion}
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
  };

  return (
    <>
      <div className="min-h-screen bg-background font-sans">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              NPC Stat Block Parser
            </h1>
            <p className="text-muted-foreground text-lg">
              A tool to convert tabletop RPG NPC stat blocks into Castles & Crusades narrative format.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="text-primary" />
                  Input Stat Blocks
                </CardTitle>
                <CardDescription>
                  Paste your C&amp;C NPC stat block(s) below. The parser automatically detects whether you&apos;ve entered a single NPC or a batch.
                </CardDescription>
                <div className="mb-2 text-xs text-muted-foreground">
                  <strong>Formatting rules:</strong> Follow these conventions for best results. Each badge summarizes a key rule for stat block formatting.
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline" className="text-xs" title="Attributes like strength, wisdom, etc. should be lowercase.">lowercase attributes</Badge>
                  <Badge variant="outline" className="text-xs" title="Use superscript for levels (e.g., 5ᵗʰ level).">superscripts for levels</Badge>
                  <Badge variant="outline" className="text-xs" title="No bold text in abbreviated stat blocks.">no bold in abbreviated blocks</Badge>
                  <Badge variant="outline" className="text-xs" title="Specify shield type (e.g., medium steel shield).">explicit shield type</Badge>
                  <Badge variant="outline" className="text-xs" title="Put equipment bonus at the end (e.g., +2).">bonus at end (e.g., +2)</Badge>
                  <Badge variant="outline" className="text-xs" title="Use noun forms for disposition (e.g., law/good).">noun-form disposition</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste your NPC stat block here..."
                  value={inputText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="font-mono text-sm min-h-[300px] resize-y"
                  id="npc-input"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadExample}
                    className="flex-1"
                  >
                    Load Single NPC Example
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAlternativeExample}
                    className="flex-1"
                  >
                    Load Batch NPC Example
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadValidationExample}
                    className="flex-1 flex items-center gap-2"
                  >
                    <Warning size={16} />
                    Load Issues Demo
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('')}
                    className="flex items-center gap-2"
                  >
                    <Trash size={16} />
                    Clear
                  </Button>
                </div>
                {/* Dictionaries Panel */}
                <Card className="mt-2">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Dictionaries (CSV)</CardTitle>
                    <CardDescription className="text-xs">Upload lists of spells, magic items, and monsters to improve name normalization and italics.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between rounded border p-2 bg-muted/20">
                      <div className="text-sm">
                        <div className="font-medium">Enable dictionary normalization</div>
                        <div className="text-xs text-muted-foreground">When enabled, auto-correction will suggest canonicalized names and italics using your CSVs.</div>
                      </div>
                      <Switch checked={dictEnabled} onCheckedChange={setDictEnabled} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      {/* Spells CSV */}
                      <div className="flex flex-col items-center space-y-2 p-3 bg-background rounded border text-center">
                        <label className="block text-xs font-medium mb-1">Spells CSV</label>
                        <div className="flex flex-col items-center w-full">
                          <input id="spells-csv" type="file" accept=".csv,.txt,.xlsx" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const text = await file.text();
                            setDictionaries({ spellsCsv: text });
                            const count = text.split(/\r?\n/).map(l=>l.split(',')[0].trim()).filter(Boolean).length;
                            setDictCounts(prev => ({ ...prev, spells: count }));
                            toast.success(`Loaded ${count} spells`);
                            processInput(inputText);
                          }} />
                          <Button variant="outline" size="sm" className="w-full" onClick={() => document.getElementById('spells-csv')?.click()}>
                            Upload Spells CSV
                          </Button>
                          <span className="text-xs text-muted-foreground mt-1">Loaded: {dictCounts.spells}</span>
                        </div>
                      </div>
                      {/* Items CSV */}
                      <div className="flex flex-col items-center space-y-2 p-3 bg-background rounded border text-center">
                        <label className="block text-xs font-medium mb-1">Items CSV</label>
                        <div className="flex flex-col items-center w-full">
                          <input id="items-csv" type="file" accept=".csv,.txt,.xlsx" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const text = await file.text();
                            setDictionaries({ itemsCsv: text });
                            const count = text.split(/\r?\n/).map(l=>l.split(',')[0].trim()).filter(Boolean).length;
                            setDictCounts(prev => ({ ...prev, items: count }));
                            toast.success(`Loaded ${count} items`);
                            processInput(inputText);
                          }} />
                          <Button variant="outline" size="sm" className="w-full" onClick={() => document.getElementById('items-csv')?.click()}>
                            Upload Items CSV
                          </Button>
                          <span className="text-xs text-muted-foreground mt-1">Loaded: {dictCounts.items}</span>
                        </div>
                      </div>
                      {/* Monsters CSV */}
                      <div className="flex flex-col items-center space-y-2 p-3 bg-background rounded border text-center">
                        <label className="block text-xs font-medium mb-1">Monsters CSV</label>
                        <div className="flex flex-col items-center w-full">
                          <input id="monsters-csv" type="file" accept=".csv,.txt,.xlsx" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const text = await file.text();
                            setDictionaries({ monstersCsv: text });
                            const count = text.split(/\r?\n/).map(l=>l.split(',')[0].trim()).filter(Boolean).length;
                            setDictCounts(prev => ({ ...prev, monsters: count }));
                            toast.success(`Loaded ${count} monsters`);
                            processInput(inputText);
                          }} />
                          <Button variant="outline" size="sm" className="w-full" onClick={() => document.getElementById('monsters-csv')?.click()}>
                            Upload Monsters CSV
                          </Button>
                          <span className="text-xs text-muted-foreground mt-1">Loaded: {dictCounts.monsters}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex items-center justify-between rounded border p-2 bg-muted/40">
                  <div className="text-sm">
                    <div className="font-medium">Normalize before parsing (safe fixes)</div>
                    <div className="text-xs text-muted-foreground">Applies high-confidence auto-fixes (e.g., shield type, attribute names) prior to parsing.</div>
                  </div>
                  <Switch
                    checked={normalizeInput}
                    onCheckedChange={(checked) => {
                      setNormalizeInput(checked);
                      // Reprocess current input with new setting
                      processInput(inputText);
                    }}
                    aria-label="Normalize input before parsing"
                  />
                </div>
                
                {/* Auto-Correction Section */}
                {availableFixes.length > 0 && (
                  <Card className="mt-4 border-blue-200 bg-blue-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-blue-800">
                        <Wand className="w-5 h-5" />
                        Auto-Correction Available
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          {availableFixes.length} fixes
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-blue-700">
                        Automated fixes for common C&C formatting issues. High-confidence fixes can be applied safely.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-2 mb-4">
                        <Button
                          onClick={applyAllFixes}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                          size="sm"
                          disabled={availableFixes.filter(f => f.confidence === 'high').length === 0}
                        >
                          <Sparkle className="w-4 h-4" />
                          Apply All Safe Fixes ({availableFixes.filter(f => f.confidence === 'high').length})
                        </Button>
                        <div className="text-sm text-blue-600 flex items-center">
                          Only high-confidence fixes are applied automatically
                        </div>
                      </div>
                      
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {availableFixes.map((fix, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getFixConfidenceColor(fix.confidence)}`}
                                >
                                  {fix.confidence}
                                </Badge>
                                <span className="text-xs text-gray-500 uppercase tracking-wide">
                                  {fix.category}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {fix.description}
                              </p>
                              <div className="flex items-center gap-2 text-xs">
                                <code className="bg-gray-100 px-1 rounded">
                                  {fix.originalText.length > 30 
                                    ? `${fix.originalText.substring(0, 30)}...` 
                                    : fix.originalText}
                                </code>
                                <ArrowRight className="w-3 h-3 text-gray-400" />
                                <code className="bg-green-100 px-1 rounded">
                                  {fix.correctedText.length > 30 
                                    ? `${fix.correctedText.substring(0, 30)}...` 
                                    : fix.correctedText}
                                </code>
                              </div>
                            </div>
                            {appliedFixes.includes(fix.description) ? (
                              <Badge variant="default" className="ml-3 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Applied
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyFix(fix)}
                                className="flex items-center gap-1 ml-3"
                              >
                                <Wand className="w-3 h-3" />
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

            {/* Results Section */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="text-accent" />
                  Parsed Results
                </CardTitle>
                <CardDescription>
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
                    <div className="flex items-center gap-2 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowValidation(!showValidation)}
                        className="flex items-center gap-2"
                      >
                        {showValidation ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        {showValidation ? 'Hide' : 'Show'} Validation
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        Comprehensive C&C compliance validation across 23+ categories enabled
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {results.map((result, index) => (
                        <div key={index} className="space-y-3 border rounded-lg p-4">
                          {showValidation && (
                            <ValidationWarnings validation={result.validation} npcIndex={index} />
                          )}

                          {/* Instructional text for rich text preview and Word copy */}
                          <div className="mb-2 text-sm text-muted-foreground">
                            <strong>Preview:</strong> The box below shows how your stat block will look when pasted into Word or other rich text editors.<br />
                            <span>
                              <b>Bold</b> is used for the NPC name only. <i>Italics</i> are used for magic items, spells, and books. Parentheses are always plain except for allowed italics.<br />
                              To copy with formatting, use <b>Copy HTML</b> below. In Word, use <b>Paste Special &rarr; HTML</b> or <b>Paste</b> (Word will preserve bold/italics automatically).
                            </span>
                          </div>

                          {/* Rich text preview of parsed HTML (WYSIWYG) */}
                          <div className="bg-white p-3 rounded-md border">
                            <Preview id={`preview-${index}`} markdown={result.converted} />
                          </div>

                          {/* Raw output for reference */}
                          <div className="bg-muted/50 p-3 rounded-md border">
                            <pre className="font-mono text-sm leading-relaxed break-words whitespace-pre-wrap">
                              {result.converted}
                            </pre>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyNPCWithReport(result, index)}
                              className="flex-1 flex items-center gap-2"
                            >
                              <Clipboard size={16} />
                              Copy NPC + Report
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyHtmlToClipboard(result.converted, index)}
                              className="flex-1 flex items-center gap-2"
                            >
                              <FileHtml size={16} />
                              Copy HTML
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(result.converted)}
                              className="flex-1 flex items-center gap-2"
                            >
                              <FileText size={16} />
                              Copy Markdown
                            </Button>
                            {showValidation && (
                              <Badge 
                                variant="outline" 
                                className={`flex items-center gap-1 px-2 py-1 ${getComplianceColor(result.validation.complianceScore)} text-white`}
                              >
                                {result.validation.isValid ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                {result.validation.complianceScore}%
                              </Badge>
                            )}
                          </div>
                          
                          {index < results.length - 1 && <Separator className="my-4" />}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={copyAllWithReport}
                        className="flex-1 flex items-center gap-2"
                      >
                        <Clipboard size={16} />
                        Copy All + Report
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
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Paste an NPC stat block in the input area to see the parsed result here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Saved Results Section */}
          {savedResults.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
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
                <CardDescription>
                  Previously processed NPCs saved for quick reference. Note: validation details are not saved.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {savedResults.map((result, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                      <pre className="font-mono text-sm flex-1 break-words whitespace-pre-wrap">
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
        </div>
      </div>
      <Toaster />
    </>
  );
}

export default App;
