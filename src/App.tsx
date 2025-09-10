import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { Copy, Download, Upload, AlertCircle, Trash2, FileText } from '@phosphor-icons/react';
import { processDump, generateNPCTemplate } from '@/lib/npc-parser';
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

const FLEXIBLE_EXAMPLE = `**Guard Captain Miller**
5th level fighter
Alignment: law/good
HP: 35, AC: 18
Primes: Strength, Constitution
Equipment: longsword +1, plate mail, heavy steel shield`;

function App() {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedResults, setSavedResults, deleteSavedResults] = useKV<string[]>('npc-parser-results', []);

  const processInput = (text: string) => {
    if (!text.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    try {
      const processed = processDump(text);
      
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
    const allText = results.join('\n\n');
    await copyToClipboard(allText);
  };

  const saveResults = () => {
    if (results.length === 0) return;
    setSavedResults((current) => [...current, ...results]);
    toast.success(`Saved ${results.length} NPC${results.length > 1 ? 's' : ''}`);
  };

  const clearSaved = () => {
    deleteSavedResults();
    toast.success('Cleared saved NPCs');
  };

  const downloadResults = () => {
    if (results.length === 0) return;
    const content = results.join('\n\n');
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

  const loadFlexibleExample = () => {
    setInputText(FLEXIBLE_EXAMPLE);
    processInput(FLEXIBLE_EXAMPLE);
  };

  const loadTemplate = () => {
    const template = generateNPCTemplate();
    setInputText(template);
    processInput(template);
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
              Convert detailed tabletop RPG NPC stat blocks into concise, single-line summaries. Now with robust parsing that handles flexible input formats and auto-italicizes magic items.
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
                  Paste your NPC stat block below. This parser now handles flexible formatting - whether your stat block uses "Race & Class:" labels, shorthand "HP/AC", or mixed formats. Magic items are automatically italicized in the output.
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
                    onClick={loadFlexibleExample}
                    className="flex-1"
                  >
                    Flexible Format
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadTemplate}
                    className="flex-1 flex items-center gap-2"
                  >
                    <FileText size={16} />
                    C&C Template
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
                  Condensed stat blocks ready for quick reference during gameplay
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
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {results.map((result, index) => (
                        <div key={index} className="space-y-2">
                          <div className="bg-muted/50 p-3 rounded-md border">
                            <p className="font-mono text-sm leading-relaxed break-words">
                              {result}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(result)}
                            className="w-full flex items-center gap-2"
                          >
                            <Copy size={16} />
                            Copy this NPC
                          </Button>
                          {index < results.length - 1 && <Separator className="my-3" />}
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
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                      <p className="font-mono text-sm flex-1 break-words">
                        {result}
                      </p>
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