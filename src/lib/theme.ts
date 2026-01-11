// Theme helper: apply a named theme by adding a theme class to document.documentElement.
// Themes are implemented as CSS variable overrides in `src/index.css`.

export function clearThemeClasses(root: HTMLElement) {
  // Remove any `theme-` classes so we can set a single active theme
  Array.from(root.classList).forEach((c) => {
    if (c.startsWith('theme-')) root.classList.remove(c);
  });
}

export function applyTheme(theme: string) {
  const root = document.documentElement;
  // Remove theme-* classes on every change
  clearThemeClasses(root);

  if (theme === 'system') {
    // Respect OS preference: add/remove 'dark' class
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) root.classList.add('dark'); else root.classList.remove('dark');
    return;
  }

  if (theme === 'light') {
    root.classList.remove('dark');
    return;
  }

  if (theme === 'dark') {
    root.classList.add('dark');
    return;
  }

  // For named palettes, add a class like 'theme-ocean'
  root.classList.add(`theme-${theme}`);
  // Ensure dark class is absent unless the palette needs it (palettes control their own vars)
  root.classList.remove('dark');
}
