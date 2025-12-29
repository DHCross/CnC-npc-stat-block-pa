import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FullDocumentPipeline } from './FullDocumentPipeline';
import { pf2eSampleAnalysis } from './mocks/pf2e-sample.mock';

const meta: Meta<typeof FullDocumentPipeline> = {
  title: 'Examples/PF2e',
  component: FullDocumentPipeline,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof FullDocumentPipeline>;

export const PF2eSample: Story = {
  args: { initialAnalysis: pf2eSampleAnalysis },
};
