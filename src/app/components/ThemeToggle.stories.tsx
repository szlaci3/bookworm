import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { ThemeToggle } from './ThemeToggle';

const meta = {
  component: ThemeToggle,
  parameters: { docs: { description: { component: 'A pressed toggle selects the midnight palette. The app remembers the selection across reloads.' } } },
  args: { theme: 'parchment', onChange: fn() },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return <div data-theme={args.theme} style={{ background: 'var(--bg-primary)', padding: 'var(--space-2)' }}>
      <ThemeToggle {...args} onChange={theme => { args.onChange(theme); updateArgs({ theme }); }} />
    </div>;
  },
} satisfies Meta<typeof ThemeToggle>;
export default meta;
export const Parchment: StoryObj<typeof meta> = {};
export const Midnight: StoryObj<typeof meta> = { args: { theme: 'midnight' } };
