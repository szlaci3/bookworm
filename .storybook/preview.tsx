import type { Preview } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import '../src/index.css';

export default {
  tags: ['autodocs'],
  globalTypes: {
    theme: { toolbar: { title: 'Theme', items: ['parchment', 'midnight'], dynamicTitle: true } },
  },
  initialGlobals: { theme: 'parchment' },
  decorators: [(Story, context) => (
    <MemoryRouter>
      <div data-theme={context.globals.theme} style={{ padding: 'var(--space-4)', background: 'var(--bg-primary)' }}>
        <Story />
      </div>
    </MemoryRouter>
  )],
} satisfies Preview;
