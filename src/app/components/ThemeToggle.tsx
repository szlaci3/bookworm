import type { Theme } from '../theme';

interface Props {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

export function ThemeToggle({ theme, onChange }: Props) {
  return <button type="button" className={theme === 'midnight' ? 'btn btn-primary' : 'btn btn-secondary'} aria-pressed={theme === 'midnight'}
    onClick={() => onChange(theme === 'midnight' ? 'parchment' : 'midnight')}>Midnight theme</button>;
}
