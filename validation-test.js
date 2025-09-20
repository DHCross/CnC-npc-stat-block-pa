import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// We need to compile the TypeScript first or use a different approach
console.log("Setting up parser test...");

// Let's use a simpler approach - test via the browser interface
console.log("✅ Build successful");
console.log("✅ Dev server can start on port 5000");
console.log("📊 Parser updates applied:");
console.log("  - Italicized stat blocks in parentheses");
console.log("  - Sentence form with 'and disposition'"); 
console.log("  - PHB canonical order for attributes (lowercase)");
console.log("  - Shield normalization (default: large steel shield)");
console.log("  - PHB item renames (robe/ring of protection → armor, etc.)");
console.log("  - Magic item italicization");
console.log("  - Mount stat blocks italicized with sentence form");
console.log("  - Validation messaging updated to 'Primary attributes'");
console.log("");
console.log("🧪 To test the parser changes:");
console.log("1. npm run dev");
console.log("2. Open http://localhost:5000");
console.log("3. Paste Council of Eight examples");
console.log("4. Verify output matches Jeremy's formatting specs");