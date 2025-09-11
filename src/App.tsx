import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Toaster } from '@/components/ui/sonner';
import { Copy, Download, Upload, AlertCircle, Trash2, FileText, Warning, Info, CheckCircle, ChevronDown, ChevronRight, Wand, Sparkle, ArrowRight, ClipboardText } from '@phosphor-icons/react';
import { processDump, generateNPCTemplate, generateBatchTemplate, processDumpWithValidation, ProcessedNPC, ValidationWarning, CorrectionFix, generateAutoCorrectionFixes, applyCorrectionFix, applyAllHighConfidenceFixes } from '@/lib/npc-parser';
import { toast } from 'sonner';
import { useKV } from '@github/spark/hooks';

const EXAMPLE_TEXT = `**The Right Honorable President Counselor of Yggsburgh His Supernal Devotion, Victor Oldham, High Priest of the Grand Temple**

Disposition: law/good
Race & Class: human, 16th level cleric
Hit Points (HP): 59
Armor Class (AC): 13/22
Prime Attributes (PA): Strength, Wisdom, Charisma
Equipment: pectoral of protection +3, full plate mail, steel shield, staff of striking, mace
Spells: 0–6, 1st–6, 2nd–5, 3rd–5, 4th–4, 5th–4, 6th–3, 7th–3, 8th–2
Mount: heavy war horse`;

const ALTERNATIVE_EXAMPLE = `**Hector Markle, Secretary Counselor**
human, 1st level scholar
Disposition: law/neutral
Hit Points: 5
Armor Class: 10
Prime Attributes: Intelligence
Equipment: nobleman's clothing`;

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
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<ProcessedNPC[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedResults, setSavedResults, deleteSavedResults] = useKV<string[]>('npc-parser-results', []);
  const [showValidation, setShowValidation] = useState(true);
  const [availableFixes, setAvailableFixes] = useState<CorrectionFix[]>([]);

  const processInput = (text: string) => {
    if (!text.trim()) {
      setResults([]);
      setError(null);
      setAvailableFixes([]);
      return;
    }

    try {
      const processed = processDumpWithValidation(text);
      const fixes = generateAutoCorrectionFixes(text);
      setAvailableFixes(fixes);
      
      if (processed.length === 0) {
        setError('No valid NPC stat blocks found. Please check your formatting.');
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
    report += `\n• Ensure all magic items have mechanical explanations`;
    report += `\n• Use disposition nouns (law/good) instead of adjectives (lawful good)`;
    report += `\n• Format character levels with superscript (16ᵗʰ level) when outside stat blocks`;
    
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
              Convert detailed tabletop RPG NPC stat blocks into Castles & Crusades narrative format 
              with comprehensive validation warnings and automated correction system. This enhanced parser produces clean, properly formatted entries 
              that match the Victor Oldham reference style, automatically checks for full C&C compliance across 
              23+ validation categories, and provides intelligent one-click fixes for common formatting issues. 
              Features automated corrections for deprecated terminology (alignment→disposition, improved grab→crushing grasp), 
              magic item italicization, coinage terminology, disposition noun formatting, prime attribute expansion, 
              and equipment section standardization. Enhanced with confidence-rated correction suggestions, 
              bulk auto-fix capabilities, and detailed compliance scoring for each NPC. Now includes comprehensive checks for heading format, formal addresses, 
              race-class ordering, gendered pronouns, vision terminology, unique ability explanations, and automated before/after previews 
              with intelligent correction categorization and safe batch application of high-confidence fixes.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload weight="bold" className="text-primary" />
                  Input Stat Blocks
                </CardTitle>
                <CardDescription>
                  Paste your C&C NPC stat block(s) below. The enhanced parser automatically converts to narrative format, 
                  validates comprehensive C&C compliance across 23+ categories including heading format, disposition terminology, 
                  level formatting, magic item italicization, coinage terminology, prime attribute ordering, AC structures, 
                  and mount statistics. Features advanced automated correction system with confidence-rated fixes for deprecated terminology (alignment→disposition, improved grab→crushing grasp, 
                  vision types), proper noun-form dispositions, superscript levels, magic item mechanical explanations, and equipment 
                  section standardization. Auto-correction engine provides intelligent one-click fixes with before/after previews, 
                  bulk application of high-confidence corrections, and detailed categorization of formatting improvements. For batch processing, separate multiple NPCs with blank lines. Each NPC receives detailed validation scoring 
                  and specific compliance warnings to ensure perfect C&C formatting standards, plus automated correction suggestions 
                  for immediate application.
                </CardDescription>
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
                    Load Example
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAlternativeExample}
                    className="flex-1"
                  >
                    Simple Format
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadValidationExample}
                    className="flex-1 flex items-center gap-2"
                  >
                    <Warning size={16} />
                    Issues Demo
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadTemplate}
                    className="flex-1 flex items-center gap-2"
                  >
                    <FileText size={16} />
                    Single NPC
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadBatchTemplate}
                    className="flex-1 flex items-center gap-2"
                  >
                    <FileText size={16} />
                    Batch NPCs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('')}
                    className="flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Clear
                  </Button>
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => applyFix(fix)}
                              className="flex items-center gap-1 ml-3"
                            >
                              <Wand className="w-3 h-3" />
                              Apply
                            </Button>
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
                  <Download weight="bold" className="text-accent" />
                  Parsed Results
                </CardTitle>
                <CardDescription>
                  Castles & Crusades narrative format with comprehensive validation across 23+ compliance categories and 
                  intelligent automated correction system. Enhanced validation includes heading format, deprecated terminology detection, magic item explanations, 
                  disposition noun formatting, prime attribute ordering, superscript levels, AC structure validation, 
                  title formatting, and equipment section standardization. Auto-correction engine provides confidence-rated fixes 
                  with one-click application, bulk correction capabilities, and detailed before/after previews for all formatting improvements.
                  {results.length > 1 && ` Processing ${results.length} NPCs with individual detailed validation reports and automated correction suggestions.`}
                  {results.length === 1 && results[0].validation.complianceScore && 
                    ` Compliance score: ${results[0].validation.complianceScore}% across all C&C standards with ${results[0].validation.fixes?.length || 0} available corrections.`}
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
                              <ClipboardText size={16} />
                              Copy NPC + Report
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
                        <ClipboardText size={16} />
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
                    <Trash2 size={16} />
                    Clear All
                  </Button>
                </CardTitle>
                <CardDescription>
                  Previously processed NPCs saved for quick reference
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