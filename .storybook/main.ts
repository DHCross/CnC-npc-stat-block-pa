import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
  // PostCSS addon allows Storybook to process Tailwind CSS but the pinned
  // version here is incompatible with Storybook 10; temporarily remove
  // it for Storybook startup while we either upgrade to a compatible
  // addon-postcss release or add an alternate PostCSS configuration.
  // "@storybook/addon-postcss",
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest"
  ],
  "framework": {
    "name": "@storybook/nextjs-vite",
    "options": {}
  }
};
export default config;