export type Theme = 'parchment' | 'midnight';

const key = 'bookworm.theme';
export function readTheme(): Theme {
  try {
    return localStorage.getItem(key) === 'midnight' ? 'midnight' : 'parchment';
  } catch {
    return 'parchment';
  }
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(key, theme);
  } catch {
    // The theme still applies for this session when storage is unavailable.
  }
}
