// Math Brain contracts define the raw, geometry-first payload that feeds the Poetic Brain.
// Keep this layer free of metaphor so the interpretation engine stays clean.
export type MathBrainReportKind = 'personal' | 'relational';

export interface MathBrainMetadata {
  reportId: string;
  generatedOn: string; // ISO 8601 timestamp
  kind: MathBrainReportKind;
  subject: string; // primary person or dyad label
  counterpart?: string; // required when kind === 'relational'
  sourceSystem: 'astrologer_app';
  timezone?: string;
  houseSystem: 'Placidus';
  ephemeris: string; // e.g., swiss-ephemeris-v2
  maskedSchema?: boolean; // true when using P-token masking
  silentGeometryCheck?: {
    passed: boolean;
    notes?: string;
  };
  notes?: string;
}

export interface GeoCoordinate {
  longitude: number; // decimal degrees 0-360
  zodiacPosition: string; // e.g., 15 TAU 23
  house?: number; // Placidus house number 1-12
}

export interface ModeSample {
  quality: string; // e.g., cardinal, fixed, mutable
  element: string; // e.g., fire, water
  sign: string; // e.g., Aries
  planet: string; // e.g., Sun, Moon, Mercury
  coordinate: GeoCoordinate;
}

export interface DominantSignatureSummary {
  qualities: string[];
  elements: string[];
  synthesisNotes?: string;
}

export interface EnergeticBalanceKeywords {
  rawKeywords: string[];
  headline?: string;
}

export interface MathBrainNatalBlueprint {
  primaryMode: ModeSample;
  secondaryMode: ModeSample;
  shadowMode: ModeSample;
  dominantSignature: DominantSignatureSummary;
  energeticBalance: EnergeticBalanceKeywords;
}

export interface TransitAspectReference {
  transitingBody: string; // e.g., Mars (transiting)
  aspect: string; // e.g., square
  natalBody: string; // e.g., Sun
  orb: number; // absolute orb in degrees
  applying: boolean;
  exactAt?: string; // ISO timestamp
}

export interface BalanceIndices {
  magnitude: number; // 0-65 scale
  valence: number; // -5 to +5
  volatility: number; // 0-10 scale
  supportFrictionDifferential: number; // S+ vs S- continuous score
}

export interface MathBrainDailyData {
  date: string; // YYYY-MM-DD
  fieldTriggers: string[];
  transitContexts: TransitAspectReference[];
  balanceIndices: BalanceIndices;
  referenceLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface NatalAspectTension {
  aspectLabel: string; // e.g., Sun square Moon
  keywords: string[];
}

export interface MathBrainCoreTensions {
  aspects: NatalAspectTension[];
}

export interface MathBrainStitchedNotes {
  majorTheme: string[];
  todaysMode: string[];
  observables: string[];
}

export interface MathBrainPersonalReport {
  metadata: MathBrainMetadata & { kind: 'personal' };
  natalBlueprint: MathBrainNatalBlueprint;
  dailyData: MathBrainDailyData;
  coreTensions: MathBrainCoreTensions;
  stitchedNotes: MathBrainStitchedNotes;
  sstFlags?: {
    wb: number;
    abe: number;
    osr: number;
  };
}

export interface SharedBlueprintSummary {
  coreDynamic: string[];
  contrasts: string[];
  keySynastryAspects: TransitAspectReference[];
  relationshipScore: {
    value: number;
    descriptor: string;
  };
  dominantComposite?: {
    coordinate: GeoCoordinate;
    label: string;
  };
}

export interface SynastryPolarity {
  label: string;
  keywords: string[];
  aspectRef: TransitAspectReference;
}

export interface RelationalDailyData {
  date: string;
  sharedFieldTriggers: string[];
  transitContexts: TransitAspectReference[];
  balanceIndices: BalanceIndices;
  referenceLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface RelationalFrictionSupport {
  friction: SynastryPolarity;
  support: SynastryPolarity;
  paradox: string[];
}

export interface MathBrainCompositeNotes {
  climateBaseline: string[];
  dailySnapshot: string[];
}

export interface MathBrainRelationalReport {
  metadata: MathBrainMetadata & { kind: 'relational'; counterpart: string };
  sharedBlueprint: SharedBlueprintSummary;
  dailyData: RelationalDailyData;
  frictionSupport: RelationalFrictionSupport;
  compositeNotes: MathBrainCompositeNotes;
  sstFlags?: {
    wb: number;
    abe: number;
    osr: number;
  };
}

export type MathBrainReport = MathBrainPersonalReport | MathBrainRelationalReport;
