'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Wand2,
  Download,
  Copy,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { convertLegacySpellText, SpellConversionResult } from '@/lib/spell-converter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const EXAMPLE_SPELL = `**Arrest Motion** **(Chr) (Roan** **ot** **Kepulch)**

CT 1			R 150ft.		D 1 rd./lvl.

SV see below		SR yes		Comp S

Arrest motion stops objects in motion or keeps them from moving, if already motionless. It has an area of effect of 10'×10' +5' per level and lasts one round per level. 

The targets are held exactly as they are when the rune is activated. If they are in flight, they are held in flight. Both humans and monsters can be stopped, as can items thrown or hurled. The rune mark must make a successful charisma save for the rune to work. The caster can cast it on himself; in such cases there is no attribute check required. 

The item or person in stasis can be moved by outside influence, or in the case of a living creature, it can attempt to move itself by making a successful strength check (CL equal to the level of the rune caster) in the round following the rune's activation. If an outside force is attempting to move the target, the source of the interference must make the strength check.`;

const EXAMPLE_BATCH = `**LIGHT (Int) (Roan ot Mur)**

CT 1			R see below	D 10 min./lvl.

SV none		SR none	Comp S

This rune sheds light that extends up to 20 feet in radius from the inscription. It lasts one turn per level.

The light's intensity depends upon the pressure placed on the rune when it is inscribed. If the rune mark wishes the light to be dull, he inscribes the rune lightly; for more intense light, more pressure is placed when the rune is written. If vocalized, the rune's inflection determines its intensity. The light can be dull and dim or exceedingly bright as the rune mark chooses.

**DARKNESS (Int) (Roan ot Unk)**

CT 1			R 100 ft.	D see below

SV none		SR no		Comp S

Darkness extinguishes any normal, natural light source, such as fire, candles, torches, etc., in a 20-foot radius. No attribute check is required. However, for the darkness to extinguish magical light, the rune mark must make a successful attribute check, the CL equal to 10 plus the item's bonus. In the case of a light or similar spell, the CL is equal to the level of the one who cast the light spell. Items with no bonus receive a +1/+2/+3 at the CK's discretion.`;

export function SpellConverter() {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<SpellConversionResult[]>([]);
  const [expandedSpells, setExpandedSpells] = useState<Set<number>>(new Set([0]));

  const handleConvert = () => {
    if (!inputText.trim()) {
      toast.error('Please provide spell text to convert');
      return;
    }

    try {
      const converted = convertLegacySpellText(inputText);
      if (converted.length === 0) {
        toast.error('No valid spell blocks found. Please check your formatting.');
        setResults([]);
      } else {
        setResults(converted);
        toast.success(`Converted ${converted.length} spell${converted.length > 1 ? 's' : ''}`);
        // Auto-expand first spell
        setExpandedSpells(new Set([0]));
      }
    } catch (error) {
      console.error('Spell conversion error:', error);
      toast.error('Error converting spells. Please check your formatting.');
      setResults([]);
    }
  };

  const loadExample = () => {
    setInputText(EXAMPLE_SPELL);
  };

  const loadBatchExample = () => {
    setInputText(EXAMPLE_BATCH);
  };

  const toggleSpell = (index: number) => {
    const newExpanded = new Set(expandedSpells);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSpells(newExpanded);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyAllSpells = async () => {
    if (results.length === 0) return;
    const allText = results.map(r => r.formatted).join('\n\n---\n\n');
    await copyToClipboard(allText);
  };

  const downloadResults = () => {
    if (results.length === 0) return;
    const content = results.map(r => r.formatted).join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-spells.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded converted spells');
  };

  const getWarningColor = (warningCount: number) => {
    if (warningCount === 0) return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100';
    if (warningCount <= 2) return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
    return 'border-red-400/40 bg-red-500/10 text-red-100';
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/15 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Wand2 className="h-5 w-5 text-primary" />
            Spell Converter: Legacy to Reforged Format
          </CardTitle>
          <CardDescription className="text-card-foreground/70">
            Convert old-format spells to the standardized Reforged Edition layout. Paste spell text with abbreviated stats (CT, R, D, SV, SR, Comp) and narrative description.
          </CardDescription>
          <div className="mt-3 text-xs text-card-foreground/60">
            <strong>Expected format:</strong> Spell heading line with name and metadata in parentheses, followed by abbreviated stat lines (CT, R, D, SV, SR, Comp), then descriptive paragraphs.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="spell-input" className="block text-sm font-medium text-card-foreground mb-2">
              Legacy Spell Text
            </label>
            <Textarea
              id="spell-input"
              placeholder="Paste your legacy spell text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="font-mono text-sm min-h-[300px]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={loadExample}>
              Load Single Spell Example
            </Button>
            <Button variant="outline" size="sm" onClick={loadBatchExample}>
              Load Batch Example
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setInputText('')}>
              Clear
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleConvert}
              disabled={!inputText.trim()}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Convert to Reforged Format
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="border-white/15 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <FileText className="h-5 w-5 text-accent" />
              Converted Spells ({results.length})
            </CardTitle>
            <CardDescription className="text-card-foreground/70">
              Spells converted to Reforged Edition format with standardized statistics and narrative structure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 border-b border-white/10 pb-4">
              <Button onClick={copyAllSpells} className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Copy All
              </Button>
              <Button variant="outline" onClick={downloadResults} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/20"
                >
                  <Collapsible
                    open={expandedSpells.has(index)}
                    onOpenChange={() => toggleSpell(index)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-0 h-auto hover:bg-transparent"
                      >
                        <div className="flex items-center gap-3">
                          {expandedSpells.has(index) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {index + 1}
                            </Badge>
                            <span className="font-semibold text-card-foreground">
                              {result.canonicalName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.warnings.length === 0 ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-400/50 bg-emerald-500/20 text-emerald-100"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-amber-400/50 bg-amber-400/20 text-amber-100"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {result.warnings.length} issues
                            </Badge>
                          )}
                        </div>
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="mt-4 space-y-4">
                      {result.originalName !== result.canonicalName && (
                        <div className="flex items-center gap-2 text-sm text-card-foreground/70">
                          <AlertCircle className="h-4 w-4 text-blue-400" />
                          <span>
                            Original name "{result.originalName}" mapped to canonical "{result.canonicalName}"
                          </span>
                        </div>
                      )}

                      {result.warnings.length > 0 && (
                        <div
                          className={`rounded-lg border p-3 ${getWarningColor(result.warnings.length)}`}
                        >
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5" />
                            <div className="flex-1">
                              <div className="font-semibold text-sm mb-1">
                                Conversion Warnings
                              </div>
                              <ul className="text-xs space-y-1">
                                {result.warnings.map((warning, wIndex) => (
                                  <li key={wIndex}>• {warning}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {result.formatted}
                          </ReactMarkdown>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(result.formatted)}
                          className="flex items-center gap-2"
                        >
                          <Copy className="h-3 w-3" />
                          Copy Spell
                        </Button>
                      </div>

                      {index < results.length - 1 && (
                        <Separator className="mt-4 border-white/10" />
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
