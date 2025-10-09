const { convertLegacySpellText } = require('./src/lib/spell-converter.ts');

const input = `**Arrest Motion** **(Chr) (Roan** **ot** **Kepulch)**

CT 1R 150ft.D 1 rd./lvl.

SV see belowSR yesComp S

Arrest motion stops objects in motion or keeps them from moving, if already motionless.

The targets are held exactly as they are when the rune is activated.`;

console.log('Input:', input);
const results = convertLegacySpellText(input);
console.log('Results:', JSON.stringify(results, null, 2));
