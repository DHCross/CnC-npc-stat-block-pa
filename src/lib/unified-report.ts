export type ReportKind = 'personal' | 'relational';

export interface ReportMetadata {
  reportId: string;
  generatedOn: string; // ISO 8601 timestamp
  kind: ReportKind;
  subject: string; // primary person or dyad label
  counterpart?: string; // second person for relational reports
  includesTransits?: boolean;
  timezone?: string;
  operatorNotes?: string;
}

export interface FieldMapVoiceSegment {
  field: string;
  map?: string | null;
  voice?: string | null;
}

export interface BalanceMeterReading {
  summary: string;
  keyShifts?: string[];
  focusAreas?: string[];
  quantitative?: Record<string, number>;
}

export interface BlueprintModes {
  primary: string;
  secondary?: string;
  shadow?: string;
}

export interface BlueprintSummary {
  modes: BlueprintModes;
  metaphor: string;
  balanceOverview: string;
}

export type PersonalBlueprint = BlueprintSummary;

export interface PersonalWeather {
  field: FieldMapVoiceSegment;
  snapshot: BalanceMeterReading;
}

export interface PersonalGrowthEdge {
  name: string;
  polarity: [string, string];
  field: string;
  map?: string | null;
  voice?: string | null;
  integrationCue?: string;
}

export interface PersonalIntegration {
  weave: string;
  invitation: string;
}

export interface TransitWindow extends FieldMapVoiceSegment {
  headline: string;
  timeframe?: string;
}

export interface TransitSection {
  overview: string;
  windows: TransitWindow[];
}

export interface PersonalUnifiedReport {
  metadata: ReportMetadata & { kind: 'personal' };
  blueprint: PersonalBlueprint;
  weather: PersonalWeather;
  growthEdges: PersonalGrowthEdge[];
  integration: PersonalIntegration;
  transits?: TransitSection;
}

export interface RelationalBlueprint extends BlueprintSummary {
  contrastHighlights: string[];
}

export interface RelationalWeather {
  sharedField: FieldMapVoiceSegment;
  snapshot: BalanceMeterReading;
}

export interface RelationalFrictionZone {
  name: string;
  polarity: [string, string];
  field: string;
  map?: string | null;
  voice?: string | null;
  supportCue?: string;
}

export interface RelationalIntegration {
  weave: string;
  invitation: string;
}

export interface RelationalUnifiedReport {
  metadata: ReportMetadata & { kind: 'relational'; counterpart: string };
  blueprint: RelationalBlueprint;
  weather: RelationalWeather;
  frictionZones: RelationalFrictionZone[];
  integration: RelationalIntegration;
  transits?: TransitSection;
}

export type UnifiedReport = PersonalUnifiedReport | RelationalUnifiedReport;

function joinList(items?: string[]): string {
  if (!items || items.length === 0) {
    return '';
  }

  if (items.length === 1) {
    return items[0];
  }

  const last = items[items.length - 1];
  return `${items.slice(0, -1).join(', ')} and ${last}`;
}

function formatFieldMapVoice(segment: FieldMapVoiceSegment): string {
  const parts = [`FIELD: ${segment.field}`];
  if (segment.map) {
    parts.push(`MAP: ${segment.map}`);
  }
  if (segment.voice) {
    parts.push(`VOICE: ${segment.voice}`);
  }
  return parts.join(' | ');
}

function formatBalanceSnapshot(snapshot: BalanceMeterReading): string {
  const pieces = [snapshot.summary];

  if (snapshot.keyShifts && snapshot.keyShifts.length > 0) {
    pieces.push(`Key shifts: ${joinList(snapshot.keyShifts)}`);
  }

  if (snapshot.focusAreas && snapshot.focusAreas.length > 0) {
    pieces.push(`Focus: ${joinList(snapshot.focusAreas)}`);
  }

  if (snapshot.quantitative && Object.keys(snapshot.quantitative).length > 0) {
    const metrics = Object.entries(snapshot.quantitative)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    pieces.push(`Meter readings - ${metrics}`);
  }

  return pieces.join(' ');
}

function isPersonalReport(report: UnifiedReport): report is PersonalUnifiedReport {
  return report.metadata.kind === 'personal';
}

function renderPersonalReport(report: PersonalUnifiedReport): string[] {
  const { blueprint, weather, growthEdges, integration } = report;
  const modes = blueprint.modes;
  const primary = modes.primary;
  const secondary = modes.secondary ? `, supported by ${modes.secondary}` : '';
  const shadow = modes.shadow ? `, with ${modes.shadow} humming in the wings` : '';

  const paragraph1 = `Your constitutional blueprint runs on ${primary}${secondary}${shadow}. ${blueprint.metaphor} ${blueprint.balanceOverview}`.trim();

  const fieldMapVoice = formatFieldMapVoice(weather.field);
  const snapshot = formatBalanceSnapshot(weather.snapshot);
  const paragraph2 = `${fieldMapVoice}. Daily snapshot: ${snapshot}`;

  const paragraph3Segments = growthEdges.map(edge => {
    const polarity = `${edge.polarity[0]} <-> ${edge.polarity[1]}`;
    const segments = [`${edge.name} (${polarity})`, `FIELD: ${edge.field}`];
    if (edge.map) {
      segments.push(`MAP: ${edge.map}`);
    }
    if (edge.voice) {
      segments.push(`VOICE: ${edge.voice}`);
    }
    if (edge.integrationCue) {
      segments.push(`Invitation: ${edge.integrationCue}`);
    }
    return segments.join(' | ');
  });
  const paragraph3 = paragraph3Segments.join(' \n');

  const paragraph4 = `${integration.weave} ${integration.invitation}`.trim();

  const paragraphs = [paragraph1, paragraph2, paragraph3, paragraph4];

  if (report.transits) {
    const transitParagraphs = renderTransits(report.transits);
    paragraphs.push(...transitParagraphs);
  }

  return paragraphs.filter(Boolean);
}

function renderRelationalReport(report: RelationalUnifiedReport): string[] {
  const { blueprint, weather, frictionZones, integration } = report;
  const modes = blueprint.modes;
  const primary = modes.primary;
  const secondary = modes.secondary ? `, counterbalanced by ${modes.secondary}` : '';
  const shadow = modes.shadow ? `, with ${modes.shadow} as the shared blind spot` : '';
  const contrasts = blueprint.contrastHighlights.length > 0
    ? `Key contrasts: ${joinList(blueprint.contrastHighlights)}. `
    : '';

  const paragraph1 = `Your shared blueprint leans on ${primary}${secondary}${shadow}. ${blueprint.metaphor} ${blueprint.balanceOverview} ${contrasts}`.trim();

  const fieldMapVoice = formatFieldMapVoice(weather.sharedField);
  const snapshot = formatBalanceSnapshot(weather.snapshot);
  const paragraph2 = `${fieldMapVoice}. Daily relational snapshot: ${snapshot}`;

  const paragraph3Segments = frictionZones.map(zone => {
    const polarity = `${zone.polarity[0]} <-> ${zone.polarity[1]}`;
    const segments = [`${zone.name} (${polarity})`, `FIELD: ${zone.field}`];
    if (zone.map) {
      segments.push(`MAP: ${zone.map}`);
    }
    if (zone.voice) {
      segments.push(`VOICE: ${zone.voice}`);
    }
    if (zone.supportCue) {
      segments.push(`Support: ${zone.supportCue}`);
    }
    return segments.join(' | ');
  });
  const paragraph3 = paragraph3Segments.join(' \n');

  const paragraph4 = `${integration.weave} ${integration.invitation}`.trim();

  const paragraphs = [paragraph1, paragraph2, paragraph3, paragraph4];

  if (report.transits) {
    const transitParagraphs = renderTransits(report.transits);
    paragraphs.push(...transitParagraphs);
  }

  return paragraphs.filter(Boolean);
}

function renderTransits(transits: TransitSection): string[] {
  const header = `Transit overview: ${transits.overview}`;
  const windows = transits.windows.map(window => {
    const base = [`${window.headline}${window.timeframe ? ` (${window.timeframe})` : ''}`];
    base.push(`FIELD: ${window.field}`);
    if (window.map) {
      base.push(`MAP: ${window.map}`);
    }
    if (window.voice) {
      base.push(`VOICE: ${window.voice}`);
    }
    return base.join(' | ');
  });
  return [header, ...windows];
}

export function renderUnifiedReport(report: UnifiedReport): string[] {
  return isPersonalReport(report)
    ? renderPersonalReport(report)
    : renderRelationalReport(report);
}
