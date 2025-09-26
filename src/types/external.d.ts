declare module 'mammoth/mammoth.browser' {
  interface MammothResult {
    value: string;
  }

  const mammoth: {
    convertToMarkdown: (input: { arrayBuffer: ArrayBuffer }) => Promise<MammothResult>;
  };

  export default mammoth;
}

declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export * from 'pdfjs-dist';
}
