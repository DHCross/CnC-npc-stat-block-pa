# Full Document Pipeline - Testing Guide

## 🧪 Standalone Submodule for Document Processing

This is an **isolated, testable submodule** that processes full bestiary documents (like Mouths of Madness) without being wired into the main app yet.

---

## 📁 Files Created

```
src/
├── types/
│   └── document-pipeline.ts          # TypeScript interfaces
├── lib/
│   └── full-document-pipeline.ts     # Core processing logic
├── components/
│   └── FullDocumentPipeline.tsx      # React UI component
└── app/
    └── test/
        └── document-pipeline/
            └── page.tsx               # Test route (isolated)

test/
└── full-document-pipeline.test.ts    # Unit tests
```

---

## 🚀 How to Test

### **Option 1: Test Route (Visual Testing)**

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the test route**:
   ```
   http://localhost:3000/test/document-pipeline
   ```

3. **Test with your data**:
   - Click "Upload File" and select `CnC Docs/mouths-of-madness-canonical-clean.md`
   - Or click "Load Example" to see it work with sample data
   - Click "Process Document"

4. **Explore results**:
   - **Summary tab**: Document stats, compliance score, AC/HP ranges
   - **Creatures tab**: Individual parsed creatures with validation
   - **Export tab**: Download as Markdown, CSV, HTML, or JSON

### **Option 2: Unit Tests (Logic Testing)**

Run the test suite:
```bash
npm test test/full-document-pipeline.test.ts
```

This tests:
- ✅ Creature extraction from markdown
- ✅ Parsing individual entries
- ✅ Statistics generation
- ✅ Anomaly detection
- ✅ Full document analysis pipeline

---

## 🎯 What It Does

### **1. Extraction**
- Scans markdown for numbered creature headers: `### 1. Creature Name`
- Extracts stat block content for each entry
- Handles special formatting (bold, asterisks, etc.)

### **2. Parsing**
- Uses your existing `processDumpWithValidation()` from `npc-parser.ts`
- Applies the 23-point validation system
- Extracts creature type (e.g., "Goblin, raider" → "Goblin")

### **3. Statistics**
- Creature type frequency (how many Goblins, Orcs, etc.)
- AC/HP ranges (min, max, mean, median)
- Disposition distribution
- Equipment & spell frequency
- Compliance scores per creature

### **4. Validation**
- Per-creature validation (standard 23 checks)
- Cross-entry consistency checks
- Statistical anomaly detection (outliers, inconsistencies)
- Batch-level recommendations

### **5. Export**
- **Markdown**: Clean bestiary with stats & validation
- **CSV**: Spreadsheet-friendly creature table
- **HTML**: Styled web page for viewing/printing
- **JSON**: Full data structure for tooling

---

## 📊 Example Output

### Stats from Mouths of Madness:
```
Total Creatures: 129
Success Rate: 98%
AC Range: 10-19 (avg: 14)
HP Range: 1-63 (avg: 12)

Creature Types:
- Goblin: 15
- Orc: 8
- Kobold: 12
- Bandit: 4
...
```

### Validation Report:
```
Overall Compliance: 87%
Total Issues: 42
Critical Issues: 3

Recommendations:
- Use auto-correction for common formatting issues
- Review 3 critical errors before publication
- 5 statistical anomalies detected
```

---

## 🔧 Architecture

```
User Input (Markdown)
    ↓
extractCreatureEntries()  ← Parse headers, split entries
    ↓
parseCreatureBlock()      ← Delegate to existing NPC parser
    ↓
analyzeFullDocument()     ← Orchestrate full pipeline
    ↓
    ├─ generateDocumentStatistics()
    ├─ detectAnomalies()
    └─ validateDocumentBatch()
    ↓
exportCreatures()         ← Format output (MD, CSV, HTML, JSON)
```

---

## 🧩 Integration (Future)

When ready to integrate into the main app:

1. **Add a new tab** in `src/App.tsx`:
   ```tsx
   <TabsTrigger value="full-doc">Full Document</TabsTrigger>
   ```

2. **Import the component**:
   ```tsx
   import { FullDocumentPipeline } from '@/components/FullDocumentPipeline';
   ```

3. **Add tab content**:
   ```tsx
   <TabsContent value="full-doc">
     <FullDocumentPipeline />
   </TabsContent>
   ```

4. **Delete the test route**:
   ```bash
   rm -rf src/app/test/document-pipeline
   ```

---

## ✅ Testing Checklist

- [ ] Upload mouths-of-madness-canonical-clean.md
- [ ] Verify all 129+ creatures are extracted
- [ ] Check statistics are accurate (AC/HP ranges, creature counts)
- [ ] Review validation report for anomalies
- [ ] Export as Markdown and verify output
- [ ] Export as CSV and open in Excel/Google Sheets
- [ ] Run unit tests: `npm test test/full-document-pipeline.test.ts`
- [ ] Test with east-mark-canonical.md
- [ ] Test with malformed/incomplete data

---

## 🐛 Known Limitations

- XP/CR calculation is placeholder (needs proper formula)
- Equipment parsing is basic (splits by comma)
- Spell detection only checks presence, not details
- Anomaly detection is conservative (can be enhanced)

---

## 📝 Next Steps

1. Test with your real data (Mouths of Madness, East Mark)
2. Refine extraction regex if needed for edge cases
3. Add more statistical insights (CR distribution, encounter balance)
4. Enhance anomaly detection rules
5. Integrate into main app when satisfied
6. Delete test route before production

---

**Happy testing! 🎲**
