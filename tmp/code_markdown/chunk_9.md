# Chunk 9

### src/components/JulesChat.tsx

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';
import { toast } from 'sonner';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type JulesChatProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function JulesChat({ open, onOpenChange }: JulesChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m Jules, your AI developer assistant. I can help you with questions about your C&C NPC Stat Block Parser project. How can I assist you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/jules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from Jules');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error communicating with Jules:', error);
      toast.error('Failed to communicate with Jules. Please check your API configuration.');
      
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please make sure your Jules API key is configured correctly in `.env.local`.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Jules - AI Developer Assistant
          </DialogTitle>
          <DialogDescription>
            Ask me anything about your C&C NPC Stat Block Parser project
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Jules a question... (Press Enter to send, Shift+Enter for new line)"
            className="min-h-[60px] max-h-[120px]"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

```

### src/components/DictionaryStats.tsx

```tsx
import { type DictionaryCounts } from '@/lib/dictionary-counts';
import { cn } from '@/lib/utils';
import { type LucideIcon, Gem, Skull, Sparkles } from 'lucide-react';

type DictionaryStatsProps = {
  counts: DictionaryCounts;
  className?: string;
};

const categories: Array<{
  key: keyof DictionaryCounts;
  label: string;
  description: string;
  accent: string;
  icon: LucideIcon;
}> = [
  {
    key: 'spells',
    label: 'Spells',
    description: 'Name mappings available',
    accent: 'from-violet-500/20 to-violet-400/5',
    icon: Sparkles,
  },
  {
    key: 'monsters',
    label: 'Monsters',
    description: 'Renamed stat blocks',
    accent: 'from-amber-500/20 to-amber-400/5',
    icon: Skull,
  },
  {
    key: 'items',
    label: 'Magic Items',
    description: 'Canonicalized equipment',
    accent: 'from-emerald-500/20 to-emerald-400/5',
    icon: Gem,
  },
];

export function DictionaryStats({ counts, className }: DictionaryStatsProps) {
  return (
    <div className={cn('grid w-full gap-4 sm:grid-cols-3', className)}>
      {categories.map(({ key, label, description, accent, icon: Icon }) => (
        <div
          key={key}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/20 backdrop-blur"
        >
          <div className={cn('absolute inset-0 -z-10 bg-gradient-to-br opacity-0 transition-opacity duration-200 group-hover:opacity-100', accent)} />
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-foreground/60">
            <span>{label}</span>
            <Icon className="h-4 w-4 text-foreground/50" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-semibold text-3xl text-foreground">
              {counts[key].toLocaleString()}
            </span>
            <span className="text-xs text-foreground/60">{description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

```

### src/components/SpellConverter.tsx

```tsx
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

```

### src/components/FullDocumentPipeline.README.md

```markdown
# FullDocumentPipeline component

Purpose
- The `FullDocumentPipeline` React component provides an "offshoot" UI used to analyze an entire markdown or DOCX bestiary document.
- It's used for isolated, visual verification in Storybook (not integrated into the main `App` by default). The component extracts individual creature entries, canonicalizes each using the parser pipeline, and returns a `DocumentAnalysisResult` that includes validation and summary statistics.

Key props
- `initialAnalysis?: DocumentAnalysisResult | null` — Provide pre-computed analysis to pre-populate the right-pane results (useful for Storybook mocks).
- `isProcessing?: boolean` — Controls the "Processing..." state for large documents.
- `initialLeftCollapsed?: boolean` — Start the UI with the left input pane collapsed (handy for UX tests in Storybook).

Important behaviors
- Uses `analyzeFullDocument(documentText, documentName)` to produce a `DocumentAnalysisResult` composed of parsed creatures and validation.
- Supports file uploads for `.md`, `.txt`, and `.docx` (via `mammoth`) — the DOCX upload converts to Markdown and re-parses.
- Shows a preview of each parsed creature with a canonicalized Markdown converted to HTML via `convertToHtml`.
- Export support: Markdown, CSV, JSON, HTML. Exports include parsed creatures + validation and metadata.
- Copy to clipboard and per-creature Copy/Mass Export buttons included.
- Storybook-ready: `src/components/FullDocumentPipeline.stories.tsx` includes realistic `mouths-of-madness` sample data for tests and manual inspection.

Visual verification checklist
- Ember Raventree (named classed NPC): confirm the canonical preview contains the long-form PHB attributes expanded (strength, dexterity, constitution, intelligence, wisdom, charisma).
- Hub-Gub / Kings: ensure HD-based HP estimation for named rulers and that ordinals are normalized from updated Rule-of-Rank.
- Magic item / Spells: confirm canonical mapping — *Dimensional Leap* → *Dimension Door* and *Teleportation* → *Teleport*.
- Equipment grammar: check equipment list for shield normalization (e.g., "medium steel shield") and that verbs and plural nouns are corrected.
- Parenthetical selection: when title contains a short parenthetical and a later parenthetical contains stats, ensure stats parenthetical is chosen and used for canonicalization.

Unit tests
- There is a `src/test/full-document-pipeline-ui.test.tsx` UI test that validates collapse toggle and ensures the realistic mocked analysis renders the expected results.

Limitations & next steps
- This component is intended for isolated Storybook verification and should not be directly integrated into `App.tsx` without considering UI duplication. If you decide to integrate, use `initialAnalysis` to avoid reprocessing during load.
- Consider adding more Storybook scenarios for failed parsing, large documents, and mixed locale formats.

Author note
- For the Canonicalizer fixes, keep the `Rule-of-Rank` heuristics and parenthetical selection rules updated in `src/lib/enhanced-parser.ts` & `src/lib/npc-parser.ts` if additional edge cases are found during visual verification.
```

### src/stories/Button.stories.ts

```typescript
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { fn } from 'storybook/test';

import { Button } from './Button';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Example/Button',
  component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#story-args
  args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    primary: true,
    label: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Button',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    label: 'Button',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    label: 'Button',
  },
};

export const Fulldocconverter: Story = {
  args: {
    primary: false,
    label: "Button"
  }
};

```

