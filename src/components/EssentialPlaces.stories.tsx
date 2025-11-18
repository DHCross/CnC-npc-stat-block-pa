import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FullDocumentPipeline } from './FullDocumentPipeline';
import { essentialPlacesAnalysis } from './mocks/essential-places.mock';

const meta: Meta<typeof FullDocumentPipeline> = {
  title: 'Components/EssentialPlaces',
  component: FullDocumentPipeline,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof FullDocumentPipeline>;

export const Default: Story = { args: {} };

export const WithResults: Story = {
  args: { initialAnalysis: essentialPlacesAnalysis as any },
};
