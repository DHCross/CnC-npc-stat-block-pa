import { describe, it, expect } from 'vitest'
import { 
  collapseNPCEntry,
  findEquipment,
  formatPrimaryAttributes,
  findMountOneLiner,
  extractDisposition,
  parseRaceClassLevel,
  validateStatBlock
} from '@/lib/npc-parser'

describe('NPC Parser - Jeremy Farkas Editor Requirements', () => {
  describe('Italicized Stat Blocks', () => {
    it('should wrap entire stat block content in italics inside parentheses', () => {
      const input = `**Victor Oldham, High Priest**

Disposition: lawful good
Race & Class: human, 16th level cleric
Hit Points (HP): 59
Armor Class (AC): 13/22
Prime Attributes (PA): Strength, Wisdom
Equipment: mace, shield
Spells: 0–6, 1st–6`

      const result = collapseNPCEntry(input)
      
      // Should have the pattern **Name[, Title]** *(italic content)*
      expect(result).toMatch(/\*\*[^*]+\*\* \*\(.*\)\*/)
      expect(result).toContain('*(This human 16ᵗʰ level cleric')
      expect(result).toContain('disposition law/good.')
    })
  })

  describe('Complete Sentences with "and disposition"', () => {
    it('should format vital stats as complete sentence with Oxford comma', () => {
      const input = `**Test NPC**
Disposition: law/good
Race & Class: human, 5th level fighter
Hit Points (HP): 35
Armor Class (AC): 18`

      const result = collapseNPCEntry(input)
      
      expect(result).toContain('HP 35, AC 18, disposition law/good.')
      expect(result).toMatch(/vital stats are HP \d+, AC \d+, disposition .+\./)
    })
  })

  describe('Primary Attributes: Lowercase PHB Order', () => {
    it('should output attributes in lowercase PHB canonical order', () => {
      const testAttributes = 'Charisma, Intelligence, Strength'
      const result = formatPrimaryAttributes(testAttributes)
      
      // Should be reordered to PHB order and lowercase
      expect(result).toBe('strength, intelligence, and charisma')
    })

    it('should handle single attribute in lowercase', () => {
      const result = formatPrimaryAttributes('Wisdom')
      expect(result).toBe('wisdom')
    })

    it('should handle two attributes with "and"', () => {
      const result = formatPrimaryAttributes('Dexterity, Strength')
      expect(result).toBe('strength and dexterity')
    })
  })

  describe('Shield Type Specification', () => {
    it('should normalize generic shield to medium steel shield', () => {
      const input = 'sword, shield, armor'
      const result = findEquipment(input)
      
      expect(result).toContain('medium steel shield')
      expect(result).not.toContain(', shield,')
    })

    it('should preserve explicit shield types', () => {
      const input = 'sword, wooden shield, armor'
      const result = findEquipment(input)
      
      expect(result).toContain('wooden shield')
      expect(result).not.toContain('large steel shield')
    })

    it('should preserve shield bonuses with normalization', () => {
      const input = 'sword, shield +2, armor'
      const result = findEquipment(input)
      
      expect(result).toContain('medium steel shield +2')
    })
  })

  describe('PHB Magic Item Name Updates', () => {
    it('should rename robe of protection to robe of armor', () => {
      const input = 'robe of protection, sword'
      const result = findEquipment(input)
      
      expect(result).toContain('robe of armor')
      expect(result).not.toContain('robe of protection')
    })

    it('should rename ring of protection to ring of armor', () => {
      const input = 'ring of protection, mace'
      const result = findEquipment(input)
      
      expect(result).toContain('ring of armor')
      expect(result).not.toContain('ring of protection')
    })

    it('should rename dagger of venom to dagger of envenomation', () => {
      const input = 'dagger of venom, bow'
      const result = findEquipment(input)
      
      expect(result).toContain('dagger of envenomation')
      expect(result).not.toContain('dagger of venom')
    })
  })

  describe('Magic Item Italicization', () => {
    it('should italicize obvious magic items', () => {
      const input = 'sword +1, staff of striking, normal mace'
      const result = findEquipment(input)
      
      expect(result).toContain('*sword +1*')
      expect(result).toContain('*staff of striking*')
      expect(result).toContain('normal mace') // Not italicized
      expect(result).not.toContain('*normal mace*')
    })
  })

  describe('No Bold Text Inside Stat Blocks', () => {
    it('should not contain bold formatting inside italicized stat blocks', () => {
      const input = `**Guard Captain**
Race & Class: human, 5th level fighter
Hit Points (HP): 35
Armor Class (AC): 18`

      const result = collapseNPCEntry(input)
      
      // Extract the content inside parentheses
      const match = result.match(/\*\((.+?)\)\*/s)
      const statBlockContent = match ? match[1] : ''

      // Should not contain ** bold markers inside the stat block
      expect(statBlockContent).not.toMatch(/\*\*/)
      expect(statBlockContent).toContain('5ᵗʰ level') // Superscript but not bold
    })
  })

  describe('Mount Stat Block Integration', () => {
    it('should default to minimal mount mention without stat block', () => {
      const input = `**Knight**
Mount: heavy war horse`

      const result = collapseNPCEntry(input)

      expect(result).toContain("**Heavy War Horse (mount)** *(This creature's vital stats are unavailable.)*")
    })
  })

  describe('Disposition Parsing', () => {
    it('should parse various disposition formats correctly', () => {
      expect(extractDisposition('Disposition: lawful good')).toBe('law/good')
      expect(extractDisposition('Disposition: chaos/evil')).toBe('chaos/evil')
      expect(extractDisposition('Alignment: Chaotic Neutral')).toBe('chaos/neutral')
      expect(extractDisposition('He is neutral')).toBe('neutral')
    })
  })

  describe('Race/Class/Level Parsing', () => {
    it('should parse race, class, and level correctly', () => {
      const result = parseRaceClassLevel('human, 16th level cleric')
      
      expect(result.race).toBe('human')
      expect(result.level).toBe('16')
      expect(result.charClass).toBe('cleric')
    })

    it('should handle different formats', () => {
      const result1 = parseRaceClassLevel('Race & Class: elf, 8th level wizard')
      expect(result1.race).toBe('elf')
      expect(result1.level).toBe('8')
      expect(result1.charClass).toBe('wizard')

      const result2 = parseRaceClassLevel('12th level dwarf fighter')
      expect(result2.race).toBe('dwarf')
      expect(result2.level).toBe('12')
      expect(result2.charClass).toBe('fighter')
    })
  })

  describe('Validation System Updates', () => {
    it('should use "Primary attributes" in validation messages', () => {
      const input = `**Test NPC**
Prime Attributes: Str, Dex, Con`

      const validation = validateStatBlock(input)
      const attributeWarnings = validation.warnings.filter(w => 
        w.message.includes('Primary attributes') || w.category.includes('Primary Attributes')
      )
      
      expect(attributeWarnings.length).toBeGreaterThan(0)
      expect(attributeWarnings.some(w => w.message.includes('Primary attributes'))).toBe(true)
    })
  })

  describe('Integration Test - Council of Eight Format', () => {
    it('should produce correctly formatted output matching Jeremy\'s specifications', () => {
      const input = `**The Right Honorable President Counselor Victor Oldham, High Priest**

Disposition: lawful good
Race & Class: human, 16th level cleric
Hit Points (HP): 59
Armor Class (AC): 13/22
Prime Attributes (PA): Strength, Wisdom, Charisma
Equipment: pectoral of protection +3, full plate mail, shield, staff of striking, mace
Spells: 0–6, 1st–6, 2nd–5, 3rd–5, 4th–4, 5th–4, 6th–3, 7th–3, 8th–2
Mount: heavy war horse`

      const result = collapseNPCEntry(input)
      
      // Check all major formatting requirements
      expect(result).toMatch(/\*\*.*\*\* \*\(.*\)\*/) // Italicized stat block
      expect(result).toContain('disposition law/good.') // Complete sentence
      expect(result).toContain('strength, wisdom, and charisma') // Lowercase PHB order
      expect(result).toContain('*pectoral of armor +3*') // PHB rename + italics
	expect(result).toContain('medium steel shield') // Shield normalization (defaults)
      expect(result).toContain('*staff of striking*') // Magic item italics
      const mainBlockMatch = result.match(/\*\((.+?)\)\*/s)
      const mainBlock = mainBlockMatch ? mainBlockMatch[1] : ''
      expect(mainBlock).not.toMatch(/\*\*/)
      // Canonical mount block with neutral pronoun
      expect(result).toContain("**Heavy War Horse (mount)** *(This creature's vital stats are unavailable.)*")
    })
  })

  describe('Flexible Prose Input Acceptance', () => {
    it('should parse parenthetical HP/AC, prose disposition, equipment, and mount', () => {
      const input = `**Sir Reynard** (HP 59, AC 13/22) He is a lawful good human knight. He carries a pectoral of protection +3, full plate mail, a shield, and a mace. He rides a heavy war horse.`

      const result = collapseNPCEntry(input)

      // Vital stats from parenthetical and prose disposition
      expect(result).toContain('HP 59, AC 13/22, disposition law/good.')

      // Equipment from prose, with PHB rename and shield normalization
      expect(result).toContain('*pectoral of armor +3*')
      expect(result).toContain('full plate mail')
  expect(result).toContain('medium steel shield')
      expect(result).toContain('mace')

      // Mount from prose creates canonical block
      expect(result).toContain("**Heavy War Horse (mount)** *(This creature's vital stats are unavailable.)*")
    })
  })
})
