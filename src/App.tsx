import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Toaster } from '@/components/ui/sonner';
import { Copy, Download, Upload, AlertCircle, Trash2, FileText, Warning, Info, CheckCircle, ChevronDown, ChevronRight } from '@phosphor-icons/react';
import { processDump, generateNPCTemplate, generateBatchTemplate, processDumpWithValidation, ProcessedNPC, ValidationWarning } from '@/lib/npc-parser';
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

const VALIDATION_EXAMPLE = `**Ser Marcus the Bold**
Alignment: lawful good
Race & Class: human, 5th level fighter  
Hit Points (HP): 4d10
Armor Class (AC): 18
Prime Attributes (PA): Str, Con
Equipment: +1 longsword, plate mail, heavy steel shield, 500 gp
Spells: cure light wounds, bless
Mount: none`;

function App() {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<ProcessedNPC[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedResults, setSavedResults, deleteSavedResults] = useKV<string[]>('npc-parser-results', []);
  const [showValidation, setShowValidation] = useState(true);

  const processInput = (text: string) => {
    if (!text.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    try {
      const processed = processDumpWithValidation(text);
      
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

  const copyAllResults = async () => {
    if (results.length === 0) return;
    const allText = results.map(r => r.converted).join('\n\n');
    await copyToClipboard(allText);
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
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'npc-stat-blocks.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded stat blocks');
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
              with comprehensive validation warnings. This tool produces clean, properly formatted entries 
              that match the Victor Oldham reference style, automatically checks C&C compliance, identifies 
              deprecated terminology, and validates proper formatting conventions. Features automatic magic 
              item italicization, disposition conversion, and batch processing with individual validation 
              scoring for each NPC.
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
                  Paste your C&C NPC stat block(s) below. The parser automatically converts to narrative format, 
                  validates C&C compliance, handles magic item italicization, uses proper terminology (disposition vs alignment), 
                  and includes mount statistics when applicable. For batch processing, separate multiple NPCs with blank lines. 
                  Each NPC receives a validation score and detailed compliance warnings to ensure proper C&C formatting.
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
                  Castles & Crusades narrative format with validation warnings and compliance scoring. 
                  {results.length > 1 && `Processing ${results.length} NPCs with individual validation reports.`}
                  {results.length === 1 && results[0].validation.complianceScore && 
                    ` Compliance score: ${results[0].validation.complianceScore}%`}
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
                        C&C compliance checking enabled
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
                              onClick={() => copyToClipboard(result.converted)}
                              className="flex-1 flex items-center gap-2"
                            >
                              <Copy size={16} />
                              Copy this NPC
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
                        onClick={copyAllResults}
                        className="flex-1 flex items-center gap-2"
                      >
                        <Copy size={16} />
                        Copy All
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