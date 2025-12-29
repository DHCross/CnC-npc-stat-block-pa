'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Download,
  Copy,
  Upload,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  AlertCircle,
  Trash,
  Sparkles,
  FileCode,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  analyzeFullDocument,
  exportCreatures,
  // convertToHtml helps render markdown-formatted canonical output as HTML
} from '@/lib/full-document-pipeline';
import { convertToHtml } from '@/lib/npc-parser';
import type {
  DocumentAnalysisResult,
  ParsedCreature,
  ExportFormat,
} from '@/types/document-pipeline';

const EXAMPLE_DOCUMENT = `# Castle Zagyg: Sample Bestiary

## Creatures & NPCs (By Order of Appearance)

### 1. Ape, carnivorous

*These creatures' vital stats are HD 4d10, HP 23, AC 15, disposition neutral. Their primary attributes are physical.*

**Core Stats:** HP 23, AC 15, Disposition neutral

---

### 2. Bandit

*This creature's vital stats are HP 4, AC 13, disposition neutral/evil. Their primary attributes are physical. He carries 6 silver in coin.*

**Core Stats:** HP 4, AC 13, Disposition neutral/evil

---

### 3. Goblin, raider

*This creature's vital stats are HD 1d6, HP 4, AC 14, disposition law/evil. Their primary attributes are physical. He carries 6 silver in coin.*

**Core Stats:** HP 4, AC 14, Disposition law/evil

---

### 4. Goblin, leader (corporal)

*This creature's vital stats are HD 3d6+2, HP 15, AC 16, disposition law/evil. Their primary attributes are physical. He carries 4 gold in coin.*

**Core Stats:** HP 15, AC 16, Disposition law/evil`;

export interface FullDocumentPipelineProps {
  initialAnalysis?: DocumentAnalysisResult | null;
  isProcessing?: boolean;
  initialLeftCollapsed?: boolean;
}

export function FullDocumentPipeline({ initialAnalysis = null, isProcessing: isProcessingProp = false, initialLeftCollapsed = false }: FullDocumentPipelineProps) {
  const [documentText, setDocumentText] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [result, setResult] = useState<DocumentAnalysisResult | null>(initialAnalysis ?? null);
  const [isProcessing, setIsProcessing] = useState<boolean>(Boolean(isProcessingProp));
  const [expandedCreatures, setExpandedCreatures] = useState<Set<number>>(new Set());
  const [leftCollapsed, setLeftCollapsed] = useState<boolean>(Boolean(initialLeftCollapsed));

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setDocumentName(file.name);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let textContent = '';

      if (extension === 'md' || extension === 'txt' || file.type === 'text/plain' || file.type === 'text/markdown') {
        textContent = await file.text();
      } else if (extension === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const { default: mammoth } = await import('mammoth/mammoth.browser');
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.convertToMarkdown({ arrayBuffer });
        textContent = value;
      } else {
        toast.error('Unsupported file format. Please use .md, .txt, or .docx');
        return;
      }

      if (!textContent.trim()) {
        toast.warning('No readable text found in the uploaded document');
      }

      setDocumentText(textContent);
      toast.success(`Loaded ${file.name}`);
    } catch (error) {
      console.error('Failed to read uploaded document', error);
      toast.error('Failed to read the uploaded document');
    } finally {
      event.target.value = '';
    }
  };

  const processDocument = () => {
    if (!documentText.trim()) {
      toast.error('Please provide document text to analyze');
      return;
    }

    setIsProcessing(true);

    try {
      const analysisResult = analyzeFullDocument(
        documentText,
        documentName || 'Untitled Document'
      );

      setResult(analysisResult);

      toast.success(
        `Processed ${analysisResult.metadata.totalEntries} entries, successfully parsed ${analysisResult.creatures.length} creatures`
      );
    } catch (error) {
      console.error('Failed to process document', error);
      toast.error('Failed to process document. Check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadExample = () => {
    setDocumentText(EXAMPLE_DOCUMENT);
    setDocumentName('Sample Bestiary');
    toast.success('Loaded example document');
  };

  const clearDocument = () => {
    setDocumentText('');
    setDocumentName('');
    setResult(null);
    setExpandedCreatures(new Set());
    toast.success('Cleared document');
  };

  const exportDocument = (format: ExportFormat) => {
    if (!result) return;

    const exported = exportCreatures(result, {
      format,
      includeValidation: true,
      includeStatistics: true,
      fileName: documentName || 'document',
    });

    const blob = new Blob([exported], {
      type: format === 'json'
        ? 'application/json'
        : format === 'csv'
          ? 'text/csv'
          : format === 'html'
            ? 'text/html'
            : 'text/plain',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentName || 'document'}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported as ${format.toUpperCase()}`);
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

  const toggleCreature = (entryNumber: number) => {
    setExpandedCreatures(prev => {
      const next = new Set(prev);
      if (next.has(entryNumber)) {
        next.delete(entryNumber);
      } else {
        next.add(entryNumber);
      }
      return next;
    });
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100';
    if (score >= 70) return 'border-amber-400/60 bg-amber-400/20 text-amber-100';
    return 'border-rose-500/60 bg-rose-500/20 text-rose-100';
  };

  return (
    <div data-testid="full-document-pipeline-grid" className={`grid gap-8 ${leftCollapsed ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]'}`}>
      {/* Left Panel: Input */}
      <Card id="document-input-card" className={`${leftCollapsed ? 'lg:hidden' : ''} h-fit border-white/15 bg-card/80`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Upload className="h-5 w-5 text-primary" />
                Document Input
              </CardTitle>
              <CardDescription className="text-card-foreground/70">
                Upload or paste a full bestiary document in markdown format. The pipeline will extract and parse all creature entries.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                aria-label={leftCollapsed ? 'Expand Document Input' : 'Collapse Document Input'}
                aria-pressed={leftCollapsed}
                onClick={() => setLeftCollapsed((v) => !v)}
                title={leftCollapsed ? 'Expand' : 'Collapse'}
                className="hidden lg:inline-flex"
              >
                {leftCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('file-upload')?.click()}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Upload File
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".md,.txt,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={loadExample}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Load Example
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearDocument}
              className="flex items-center gap-2"
            >
              <Trash className="h-4 w-4" />
              Clear
            </Button>
          </div>

          {documentName && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
              <FileCheck className="h-4 w-4 text-primary" />
              <span className="text-card-foreground/80">{documentName}</span>
            </div>
          )}

          <Textarea
            placeholder="Paste your bestiary markdown here..."
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            className="font-mono text-sm min-h-[400px] resize-y"
          />

          <Button
            onClick={processDocument}
            disabled={isProcessing || !documentText.trim()}
            className="w-full flex items-center gap-2"
          >
            <FileCheck className="h-4 w-4" />
            {isProcessing ? 'Processing...' : 'Process Document'}
          </Button>
        </CardContent>
      </Card>

      {/* Right Panel: Results */}
      <Card className="h-fit border-white/15 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <BarChart3 className="h-5 w-5 text-accent" />
            Analysis Results
          </CardTitle>
          <CardDescription className="text-card-foreground/70">
            Document statistics, parsed creatures, and validation report
          </CardDescription>
          <div className="flex items-center justify-end">
            <Button
              size="sm"
              variant="ghost"
              aria-label={leftCollapsed ? 'Expand Document Input' : 'Collapse Document Input'}
              onClick={() => setLeftCollapsed((v) => !v)}
              className="hidden lg:inline-flex"
              data-testid="toggle-left-panel-right"
            >
              {leftCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center text-card-foreground/60">
              <p>Process a document to see analysis results here.</p>
            </div>
          ) : (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="creatures">Creatures</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <Card className="border-white/10 bg-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-card-foreground">Document Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-card-foreground/70">Total Entries:</span>
                      <span className="font-medium text-card-foreground">{result.metadata.totalEntries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-card-foreground/70">Successfully Parsed:</span>
                      <span className="font-medium text-card-foreground">{result.creatures.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-card-foreground/70">Success Rate:</span>
                      <Badge className={getComplianceColor(result.metadata.successRate)}>
                        {result.metadata.successRate}%
                      </Badge>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="text-card-foreground/70">Overall Compliance:</span>
                      <Badge className={getComplianceColor(result.validationReport.totalValidationScore)}>
                        {result.validationReport.totalValidationScore}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-card-foreground/70">Total Issues:</span>
                      <span className="font-medium text-card-foreground">{result.validationReport.totalIssues}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-card-foreground/70">Critical Issues:</span>
                      <span className="font-medium text-rose-400">{result.validationReport.criticalIssues}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-card-foreground">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <div className="mb-1 flex justify-between text-card-foreground/70">
                        <span>AC Range:</span>
                        <span className="font-medium text-card-foreground">
                          {result.stats.acRange.min}-{result.stats.acRange.max} (avg: {result.stats.acRange.mean})
                        </span>
                      </div>
                      <Progress value={(result.stats.acRange.mean / 25) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-card-foreground/70">
                        <span>HP Range:</span>
                        <span className="font-medium text-card-foreground">
                          {result.stats.hpRange.min}-{result.stats.hpRange.max} (avg: {result.stats.hpRange.mean})
                        </span>
                      </div>
                      <Progress value={(result.stats.hpRange.mean / 100) * 100} className="h-2" />
                    </div>

                    <Separator className="my-3" />

                    <div>
                      <div className="mb-2 font-medium text-card-foreground">Creature Types ({getCreatureTypeCount(result.stats.creatureTypeFrequency)})</div>
                      <div className="max-h-[200px] space-y-1 overflow-y-auto">
                        {getCreatureTypeEntries(result.stats.creatureTypeFrequency)
                          .sort((a, b) => b[1] - a[1])
                          .map(([type, count]) => (
                            <div key={type} className="flex justify-between text-xs">
                              <span className="text-card-foreground/70">{type}</span>
                              <Badge variant="outline" className="text-xs normal-case border-white/15 bg-white/5">
                                {count}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {result.validationReport.recommendations.length > 0 && (
                  <Card className="border-amber-400/40 bg-amber-500/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base text-amber-100">
                        <AlertTriangle className="h-4 w-4" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {result.validationReport.recommendations.map((rec, index) => (
                        <div key={index} className="text-sm text-amber-100">
                          • {rec}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="creatures" className="space-y-3">
                <div className="max-h-[600px] space-y-3 overflow-y-auto pr-2">
                  {result.creatures.map((creature: ParsedCreature) => (
                    <Collapsible
                      key={creature.entryNumber}
                      open={expandedCreatures.has(creature.entryNumber)}
                      onOpenChange={() => toggleCreature(creature.entryNumber)}
                    >
                      <Card className="border-white/10 bg-white/5">
                        <CollapsibleTrigger className="w-full">
                          <CardHeader className="py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {expandedCreatures.has(creature.entryNumber) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <span className="text-sm font-medium text-card-foreground">
                                  {creature.entryNumber}. {creature.creatureType}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* classification badge shown after compliance score */}
                                {creature.validation.warnings.length === 0 ? (
                                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-amber-400" />
                                )}
                                <Badge className={`text-xs normal-case ${getComplianceColor(creature.validation.complianceScore)}`}>
                                  {creature.validation.complianceScore}%
                                </Badge>
                                {creature.classification && (
                                  <Badge
                                    className={`text-xs normal-case ${
                                      creature.classification.type === 'classed'
                                        ? 'bg-indigo-600 text-white'
                                        : creature.classification.type === 'monster'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-gray-600 text-white'
                                    }`}
                                  >
                                    {creature.classification.type}
                                    {creature.classification.confidence ? ` · ${creature.classification.confidence}` : ''}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="space-y-3 border-t border-white/10 pt-3">
                            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                              <pre className="whitespace-pre-wrap font-mono text-xs text-card-foreground/80">
                                {creature.converted}
                              </pre>
                            </div>

                            {/* Canonical Preview: render the canonical (converted) stat block as live HTML */}
                            {creature.converted && (
                              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <div className="mb-2 text-xs font-medium text-card-foreground">Canonical Preview</div>
                                <div
                                  id={`preview-${creature.entryNumber}`}
                                  className="prose prose-sm prose-invert max-w-none text-foreground"
                                  // NOTE: converted contains markdown-style formatting; convert to HTML for preview
                                  dangerouslySetInnerHTML={{ __html: convertToHtml(creature.converted) }}
                                />
                              </div>
                            )}

                            {creature.classification && (
                              <div className="rounded-xl border border-white/10 bg-slate-900/30 p-3">
                                <div className="mb-2 text-xs font-medium text-card-foreground">Classification</div>
                                <div className="flex items-center gap-2 text-xs">
                                  <Badge className={`text-xs normal-case ${creature.classification.type === 'classed' ? 'bg-indigo-600 text-white' : creature.classification.type === 'monster' ? 'bg-amber-600 text-white' : 'bg-gray-600 text-white'}`}>
                                    {creature.classification.type}
                                  </Badge>
                                  {creature.classification.subtype && (
                                    <div className="text-card-foreground/70">{creature.classification.subtype}</div>
                                  )}
                                  {creature.classification.confidence && (
                                    <div className="text-card-foreground/60">{creature.classification.confidence}</div>
                                  )}
                                </div>
                                {creature.classification.warnings && creature.classification.warnings.length > 0 && (
                                  <div className="mt-2 text-xs text-amber-300">
                                    ⚠️ {creature.classification.warnings.join('; ')}
                                  </div>
                                )}
                              </div>
                            )}

                            {creature.validation.warnings.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-amber-200">
                                  Validation Issues ({creature.validation.warnings.length})
                                </div>
                                {creature.validation.warnings.slice(0, 3).map((warning, idx) => (
                                  <div
                                    key={idx}
                                    className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-2 text-xs text-amber-100"
                                  >
                                    <div className="font-medium">{warning.category}</div>
                                    <div>{warning.message}</div>
                                  </div>
                                ))}
                                {creature.validation.warnings.length > 3 && (
                                  <div className="text-xs text-card-foreground/60">
                                    +{creature.validation.warnings.length - 3} more issues
                                  </div>
                                )}
                              </div>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(creature.converted)}
                              className="w-full flex items-center gap-2"
                            >
                              <Copy className="h-3 w-3" />
                              Copy Creature
                            </Button>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="export" className="space-y-4">
                <Card className="border-white/10 bg-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-card-foreground">Export Options</CardTitle>
                    <CardDescription className="text-xs text-card-foreground/70">
                      Download the processed document in various formats
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => exportDocument('markdown')}
                      className="w-full flex items-center gap-2 justify-start"
                    >
                      <FileText className="h-4 w-4" />
                      Export as Markdown (.md)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => exportDocument('csv')}
                      className="w-full flex items-center gap-2 justify-start"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Export as CSV (.csv)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => exportDocument('html')}
                      className="w-full flex items-center gap-2 justify-start"
                    >
                      <FileCode className="h-4 w-4" />
                      Export as HTML (.html)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => exportDocument('json')}
                      className="w-full flex items-center gap-2 justify-start"
                    >
                      <Download className="h-4 w-4" />
                      Export as JSON (.json)
                    </Button>
                  </CardContent>
                </Card>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-card-foreground/70">
                  <p className="mb-2 font-medium text-card-foreground">Export includes:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>All parsed creature stat blocks</li>
                    <li>Document statistics and analytics</li>
                    <li>Validation reports and recommendations</li>
                    <li>Metadata (processing date, success rate)</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Storybook/mock-safe helpers: some mocks convert Map -> plain object during JSON.stringify.
function getCreatureTypeEntries(mapLike: any): Array<[string, number]> {
  if (!mapLike) return [];
  if (typeof mapLike.entries === 'function') {
    return Array.from(mapLike.entries());
  }
  // assume plain object
  return Object.entries(mapLike);
}

function getCreatureTypeCount(mapLike: any): number {
  if (!mapLike) return 0;
  if (typeof mapLike.size === 'number') return mapLike.size;
  if (typeof mapLike.entries === 'function') return Array.from(mapLike.entries()).length;
  // plain object
  return Object.keys(mapLike).length;
}
