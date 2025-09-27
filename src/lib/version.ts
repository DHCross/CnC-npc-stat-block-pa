// Version information for the application
import packageJson from '../../package.json';

export interface VersionInfo {
  version: string;
  commit?: string;
  buildDate: string;
}

// This will be populated at build time
const buildInfo: VersionInfo = {
  version: packageJson.version,
  commit: process.env.NEXT_PUBLIC_GIT_COMMIT || 'unknown',
  buildDate: process.env.NEXT_PUBLIC_BUILD_DATE || new Date().toISOString(),
};

export function getVersionInfo(): VersionInfo {
  return buildInfo;
}

export function formatVersionString(): string {
  const info = getVersionInfo();
  const date = new Date(info.buildDate);
  const formattedDate = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return `v${info.version} (${info.commit}) - ${formattedDate}`;
}