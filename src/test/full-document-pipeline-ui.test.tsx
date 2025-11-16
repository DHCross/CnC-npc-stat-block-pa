import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FullDocumentPipeline } from '@/components/FullDocumentPipeline';
import { mouthsOfMadnessAnalysis } from '@/components/mocks/mouths-of-madness.mock';
import type { DocumentAnalysisResult } from '@/types/document-pipeline';

describe('FullDocumentPipeline UI - Collapse Toggle', () => {
  it('toggles left panel using the collapse button', () => {
    render(<FullDocumentPipeline initialAnalysis={mouthsOfMadnessAnalysis as unknown as DocumentAnalysisResult} />);

    const grid = screen.getByTestId('full-document-pipeline-grid');
    const toggle = screen.getByTestId('toggle-left-panel-right');

    // Initially system is not collapsed
    expect(grid.className).not.toContain('lg:grid-cols-1');

    // Click to collapse
    fireEvent.click(toggle);
    expect(grid.className).toContain('lg:grid-cols-1');

    // Label should now indicate expansion available
    expect(screen.getByLabelText('Expand Document Input')).toBeTruthy();

    // Click again to expand
    fireEvent.click(screen.getByTestId('toggle-left-panel-right'));
    expect(grid.className).not.toContain('lg:grid-cols-1');
  });

  it('supports initialLeftCollapsed prop', () => {
    render(
      <FullDocumentPipeline initialAnalysis={mouthsOfMadnessAnalysis as unknown as DocumentAnalysisResult} initialLeftCollapsed />
    );
    const grid = screen.getByTestId('full-document-pipeline-grid');

    expect(grid.className).toContain('lg:grid-cols-1');
  });

  it('renders canonical preview HTML for a creature', () => {
    render(<FullDocumentPipeline initialAnalysis={mouthsOfMadnessAnalysis as unknown as DocumentAnalysisResult} />);

    // open the first creature - ensure it's visible
    const first = screen.getByText(/1\.[\s]Ape/i);
    // Button is inside CollapsibleTrigger — click to expand
    fireEvent.click(first);

    // Wait for preview element
    const preview = screen.getByTestId('full-document-pipeline-grid').querySelector('#preview-1');
    expect(preview).toBeTruthy();
    if (preview) {
      const inner = preview.innerHTML;
      expect(inner).toContain('<strong>');
      // Ensure class uses readable foreground text
      expect(preview.className).toContain('text-foreground');
    }
  });
});
