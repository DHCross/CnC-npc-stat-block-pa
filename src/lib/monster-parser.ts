// Sample input strings for testing
export const SAMPLE_BASIC_MONSTER = `Orc\nLevel 2(d8)\nHP 15, AC 13\ndisposition chaos/evil\nattributes mental/physical\nattacks sword\ndamage 1d8\ntreasure 2gp, 5sp\nspecialAbilities rage`;

export const SAMPLE_FULL_MONSTER = `Orc\nLevel 2(d8)\nHP 15, AC 13\ndisposition chaos/evil\nattributes mental/physical\nattacks sword\ndamage 1d8\ntreasure 2gp, 5sp\nspecialAbilities rage\nsanity 1/1d6\nclimate Temperate\nbiome Forests`;

// Helper to validate climate and biome values
export function validateClimateBiome(climate: string, biome: string): { climateValid: boolean; biomeValid: boolean } {
  const allowedClimates = [
    'Tropical', 'Temperate', 'Arid', 'Arctic', 'Any', 'Any Non-Arctic', 'Any Water'
  ];
  const allowedBiomes = [
    'Forests', 'Grasslands', 'Underground', 'Water', 'Desert', 'Mountain', 'Any', 'Any Water'
  ];
  const climateValid = allowedClimates.some(c => climate.includes(c));
  const biomeValid = allowedBiomes.some(b => biome.includes(b));
  return { climateValid, biomeValid };
}
// Monster stat block parser for CnC
// Handles both abbreviated and full appendix-style monster blocks per OGL reference guide

export interface BasicMonsterBlock {
  name: string;
  level: string; // e.g., "5(d8)"
  hp: number;
  ac: number;
  disposition: string; // e.g., "chaos/evil"
  attributes: string; // e.g., "mental/physical"
  attacks: string;
  damage: string;
  treasure: string;
  specialAbilities?: string;
}

export interface FullMonsterBlock extends BasicMonsterBlock {
  sanity: string; // e.g., "1/1d6"
  climate: string; // e.g., "Temperate"
  biome: string; // e.g., "Forests"
}

// Coin abbreviation conversion
const coinMap: Record<string, string> = {
  gp: 'gold',
  sp: 'silver',
  cp: 'copper',
  pp: 'platinum',
  ep: 'electrum',
};

function convertCoinAbbreviation(input: string): string {
  return input.replace(/\b(gp|sp|cp|pp|ep)\b/g, (abbr) => coinMap[abbr] || abbr);
}

// Parse abbreviated basic monster block
export function parseBasicMonsterBlock(raw: string): BasicMonsterBlock {
  // Attempt to extract fields from a raw stat block string
  // Example input:
  // "Orc\nLevel 2(d8)\nHP 15, AC 13\ndisposition chaos/evil\nattributes mental/physical\nattacks sword\ndamage 1d8\ntreasure 2gp, 5sp\nspecialAbilities rage"
  const lines = raw.split(/\n|\r\n?/).map(l => l.trim()).filter(Boolean);
  let name = '';
  let level = '';
  let hp = 0;
  let ac = 0;
  let disposition = '';
  let attributes = '';
  let attacks = '';
  let damage = '';
  let treasure = '';
  let specialAbilities = '';

  for (const line of lines) {
    if (!name) {
      name = line;
      continue;
    }
    if (/^level/i.test(line)) {
      const m = line.match(/level\s+(\d+(?:\(d\d+\))?)/i);
      if (m) level = m[1];
      continue;
    }
    if (/^hp/i.test(line) || /ac/i.test(line)) {
      const m = line.match(/hp\s*(\d+)[,;]?\s*ac\s*(\d+)/i);
      if (m) {
        hp = parseInt(m[1], 10);
        ac = parseInt(m[2], 10);
      }
      continue;
    }
    if (/^disposition/i.test(line)) {
      const m = line.match(/disposition\s+([\w\/]+)/i);
      if (m) disposition = m[1];
      continue;
    }
    if (/^attributes?/i.test(line)) {
      const m = line.match(/attributes?\s+([\w\/]+)/i);
      if (m) attributes = m[1];
      continue;
    }
    if (/^attacks?/i.test(line)) {
      const m = line.match(/attacks?\s+(.+)/i);
      if (m) attacks = m[1];
      continue;
    }
    if (/^damage/i.test(line)) {
      const m = line.match(/damage\s+([\w\d\+\-d]+)/i);
      if (m) damage = m[1];
      continue;
    }
    if (/^treasure/i.test(line)) {
      const m = line.match(/treasure\s+(.+)/i);
      if (m) treasure = m[1];
      continue;
    }
    if (/^specialabilities?/i.test(line)) {
      const m = line.match(/specialabilities?\s+(.+)/i);
      if (m) specialAbilities = m[1];
      continue;
    }
  }

  return {
    name,
    level,
    hp,
    ac,
    disposition,
    attributes,
    attacks,
    damage,
    treasure,
    specialAbilities,
  };
}

// Parse full appendix-style monster block
export function parseFullMonsterBlock(raw: string): FullMonsterBlock {
  // Attempt to extract fields from a raw stat block string
  // Example input:
  // "Orc\nLevel 2(d8)\nHP 15, AC 13\ndisposition chaos/evil\nattributes mental/physical\nattacks sword\ndamage 1d8\ntreasure 2gp, 5sp\nspecialAbilities rage\nsanity 1/1d6\nclimate Temperate\nbiome Forests"
  const lines = raw.split(/\n|\r\n?/).map(l => l.trim()).filter(Boolean);
  let name = '';
  let level = '';
  let hp = 0;
  let ac = 0;
  let disposition = '';
  let attributes = '';
  let attacks = '';
  let damage = '';
  let treasure = '';
  let specialAbilities = '';
  let sanity = '';
  let climate = '';
  let biome = '';

  // Allowed climates and biomes (can be expanded from guide)
  const allowedClimates = [
    'Tropical', 'Temperate', 'Arid', 'Arctic', 'Any', 'Any Non-Arctic', 'Any Water'
  ];
  const allowedBiomes = [
    'Forests', 'Grasslands', 'Underground', 'Water', 'Desert', 'Mountain', 'Any', 'Any Water'
  ];

  for (const line of lines) {
    if (!name) {
      name = line;
      continue;
    }
    if (/^level/i.test(line)) {
      const m = line.match(/level\s+(\d+(?:\(d\d+\))?)/i);
      if (m) level = m[1];
      continue;
    }
    if (/^hp/i.test(line) || /ac/i.test(line)) {
      const m = line.match(/hp\s*(\d+)[,;]?\s*ac\s*(\d+)/i);
      if (m) {
        hp = parseInt(m[1], 10);
        ac = parseInt(m[2], 10);
      }
      continue;
    }
    if (/^disposition/i.test(line)) {
      const m = line.match(/disposition\s+([\w\/]+)/i);
      if (m) disposition = m[1];
      continue;
    }
    if (/^attributes?/i.test(line)) {
      const m = line.match(/attributes?\s+([\w\/]+)/i);
      if (m) attributes = m[1];
      continue;
    }
    if (/^attacks?/i.test(line)) {
      const m = line.match(/attacks?\s+(.+)/i);
      if (m) attacks = m[1];
      continue;
    }
    if (/^damage/i.test(line)) {
      const m = line.match(/damage\s+([\w\d\+\-d]+)/i);
      if (m) damage = m[1];
      continue;
    }
    if (/^treasure/i.test(line)) {
      const m = line.match(/treasure\s+(.+)/i);
      if (m) treasure = m[1];
      continue;
    }
    if (/^specialabilities?/i.test(line)) {
      const m = line.match(/specialabilities?\s+(.+)/i);
      if (m) specialAbilities = m[1];
      continue;
    }
    if (/^sanity/i.test(line)) {
      const m = line.match(/sanity\s+([\d]+\/[\dd]+)/i);
      if (m) sanity = m[1];
      continue;
    }
    if (/^climate/i.test(line)) {
      const m = line.match(/climate\s+([\w\s\-]+)/i);
      if (m && allowedClimates.some(c => m[1].includes(c))) climate = m[1];
      continue;
    }
    if (/^biome/i.test(line)) {
      const m = line.match(/biome\s+([\w\s\-]+)/i);
      if (m && allowedBiomes.some(b => m[1].includes(b))) biome = m[1];
      continue;
    }
  }

  return {
    name,
    level,
    hp,
    ac,
    disposition,
    attributes,
    attacks,
    damage,
    treasure,
    specialAbilities,
    sanity,
    climate,
    biome,
  };
}

// Output formatter for basic monster block
export function formatBasicMonsterBlock(monster: BasicMonsterBlock): string {
  // Example output per guide
  return `*This creature's vital stats are Level ${monster.level}, HP ${monster.hp}, AC ${monster.ac}, disposition ${monster.disposition}, attributes ${monster.attributes}, attacks ${monster.attacks} for ${monster.damage} damage, treasure ${convertCoinAbbreviation(monster.treasure)}${monster.specialAbilities ? ', special abilities: ' + monster.specialAbilities : ''}.*`;
}

// Output formatter for full monster block
export function formatFullMonsterBlock(monster: FullMonsterBlock): string {
  // Example output per guide
  return `*Level ${monster.level}, HP ${monster.hp}, AC ${monster.ac}, disposition ${monster.disposition}, attributes ${monster.attributes}, attacks ${monster.attacks} for ${monster.damage} damage, treasure ${convertCoinAbbreviation(monster.treasure)}, sanity ${monster.sanity}, climate ${monster.climate}, biome ${monster.biome}${monster.specialAbilities ? ', special abilities: ' + monster.specialAbilities : ''}.*`;
}
