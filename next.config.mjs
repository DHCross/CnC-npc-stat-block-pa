import { execSync } from 'child_process';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Handle font loading in environments without internet access
  env: {
    NEXT_FONT_GOOGLE_MOCKED_RESPONSES: JSON.stringify([
      {
        url: "https://fonts.googleapis.com/css2",
        css: "/* Fallback CSS for offline builds */"
      }
    ]),
    // Inject build-time information
    NEXT_PUBLIC_GIT_COMMIT: (() => {
      try {
        return execSync('git rev-parse --short HEAD').toString().trim();
      } catch (error) {
        return 'unknown';
      }
    })(),
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString(),
  },
};

export default nextConfig;