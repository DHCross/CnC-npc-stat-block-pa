'use client';

import { FullDocumentPipeline } from '@/components/FullDocumentPipeline';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function DocumentPipelineTestPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-10%] h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(129,140,248,0.28),transparent_60%)]" />
        <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -right-32 top-24 h-96 w-96 rounded-full bg-accent/25 blur-[140px]" />
      </div>

      {/* Content */}
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-6 pb-20 pt-12 lg:px-10 lg:pb-28">
        {/* Header */}
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="border-amber-400/50 bg-amber-500/10 text-amber-200 normal-case">
            🧪 Test Environment
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Full Document Pipeline
          </h1>
          <p className="text-lg text-foreground/80 md:text-xl">
            Standalone testing environment for the full document processor. This page is isolated from the main app.
          </p>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 shadow-inner shadow-black/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground/70">
              Batch extraction, parsing, validation & statistics
            </span>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mx-auto max-w-3xl border-sky-400/40 bg-sky-500/10">
          <div className="p-4 space-y-2 text-sm text-sky-100">
            <div className="font-medium text-sky-200">Testing Instructions:</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>This is a standalone test route at <code className="bg-white/10 px-1 rounded">/test/document-pipeline</code></li>
              <li>Upload or paste a markdown bestiary (like mouths-of-madness-canonical-clean.md)</li>
              <li>The pipeline extracts creatures using numbered headers (<code className="bg-white/10 px-1 rounded">### 1. Name</code>)</li>
              <li>Each creature is parsed using the existing NPC parser</li>
              <li>View statistics, validation reports, and export in multiple formats</li>
              <li>This test route is safe to delete before production deployment</li>
            </ul>
          </div>
        </Card>

        {/* Component */}
        <FullDocumentPipeline />
      </div>
    </div>
  );
}
