import type { StorybookConfig } from '@storybook/react-vite';

export default {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs'],
  staticDirs: ['../public'],
} satisfies StorybookConfig;
