import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BookCard } from './BookCard';
import seed from '../../data/kingdom.json';

const meta = {
  component: BookCard,
  parameters: { docs: { description: { component: 'The title opens the work. The separate action saves it to the library or removes it from a collection.' } } },
  args: { book: seed.results[0], action: 'Save', onAction: fn() },
} satisfies Meta<typeof BookCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Catalog: Story = {};
export const Saved: Story = { args: { action: 'Saved' } };
export const InCollection: Story = { args: { action: 'Remove' } };
export const MissingMetadata: Story = { args: { book: { id: 'unknown', title: 'Collected letters', authors: [] } } };
