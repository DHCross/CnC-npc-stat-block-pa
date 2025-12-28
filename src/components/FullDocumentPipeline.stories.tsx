import type { Meta, StoryObj } from '@storybook/react';
import { FullDocumentPipeline } from './FullDocumentPipeline';
import { mouthsOfMadnessAnalysis } from './mocks/mouths-of-madness.mock';
import type { DocumentAnalysisResult } from '@/types/document-pipeline';

const meta: Meta<typeof FullDocumentPipeline> = {
  title: 'Components/FullDocumentPipeline',
  component: FullDocumentPipeline,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof FullDocumentPipeline>;

export const Default: Story = {
  args: {},
};

export const Processing: Story = {
  args: { isProcessing: true },
};

const realistic: DocumentAnalysisResult = mouthsOfMadnessAnalysis as unknown as DocumentAnalysisResult;

export const WithResults: Story = {
  args: { initialAnalysis: realistic },
};

export const WithPreview: Story = {
  args: {
    initialAnalysis: {
      ...realistic,
      creatures: [
        {
          ...(realistic.creatures?.[0] ?? realistic.creatures[0]),
          entryNumber: 1,
          creatureType: 'Ape',
          converted: "**Ape** *These creatures' vital stats are HD 4d10, HP 23, AC 15, disposition neutral.*",
        },
      ],
    } as unknown as DocumentAnalysisResult,
  },
};

// Create an 'error' version by mutating the realistic result
const realisticErrors: DocumentAnalysisResult = JSON.parse(JSON.stringify(realistic));
realisticErrors.validationReport.totalValidationScore = 42;

      export const Collapsed: Story = {
        args: { initialAnalysis: realistic, initialLeftCollapsed: true },
      };
realisticErrors.validationReport.totalIssues += 12;
realisticErrors.validationReport.criticalIssues += 2;
realisticErrors.validationReport.recommendations.push('Fix high priority items');

export const WithErrors: Story = {
  args: { initialAnalysis: realisticErrors },
};
