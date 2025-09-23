import * as React from 'react';
import { Toaster as SonnerToaster } from 'sonner';

export type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

export const Toaster: React.FC<ToasterProps> = (props) => (
  <SonnerToaster position="top-right" richColors closeButton {...props} />
);
