import { MAGIC_ITEM_NAMES } from '@/data/magic-item-names';
import { MONSTER_NAMES } from '@/data/monster-names';
import { SPELL_NAMES } from '@/data/spell-names';

export type DictionaryCounts = {
  spells: number;
  monsters: number;
  items: number;
};

export function getDictionaryCounts(): DictionaryCounts {
  return {
    spells: SPELL_NAMES.length,
    monsters: MONSTER_NAMES.length,
    items: MAGIC_ITEM_NAMES.length,
  };
}
