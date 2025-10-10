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
