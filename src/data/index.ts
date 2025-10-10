import { SPELL_NAMES } from './spell-names';
import { MONSTER_NAMES } from './monster-names';
import { MAGIC_ITEM_NAMES } from './magic-item-names';
import { setDictionaries } from '@/lib/npc-parser';
export { getDictionaryCounts } from '@/lib/dictionary-counts';

// Convert arrays to CSV format for the setDictionaries function
function arrayToCsv(items: string[]): string {
  return items.map(item => `${item}`).join('\n');
}

// Initialize dictionaries with pre-loaded data
export function initializePreloadedDictionaries(): void {
  const spellsCsv = arrayToCsv(SPELL_NAMES);
  const itemsCsv = arrayToCsv(MAGIC_ITEM_NAMES);
  const monstersCsv = arrayToCsv(MONSTER_NAMES);

  setDictionaries({
    spellsCsv,
    itemsCsv,
    monstersCsv
  });
}
