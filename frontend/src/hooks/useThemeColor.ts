import { useState, useEffect, useCallback } from 'react';

type ThemeColorName =
  | 'background'
  | 'surface'
  | 'text'
  | 'primary'
  | 'on-primary'
  | 'secondary'
  | 'on-secondary'
  | 'accent'
  | 'on-accent'
  | 'error'
  | 'on-error';

type ThemeColors = {
  [K in ThemeColorName]: string;
};

const getThemeColorValue = (name: ThemeColorName): string => {
  if (typeof window === 'undefined') return '';

  const computedStyle = getComputedStyle(document.documentElement);
  return computedStyle.getPropertyValue(`--color-${name}`).trim();
};

const getColors = () => {
  return {
    background: getThemeColorValue('background'),
    surface: getThemeColorValue('surface'),
    text: getThemeColorValue('text'),
    primary: getThemeColorValue('primary'),
    'on-primary': getThemeColorValue('on-primary'),
    secondary: getThemeColorValue('secondary'),
    'on-secondary': getThemeColorValue('on-secondary'),
    accent: getThemeColorValue('accent'),
    'on-accent': getThemeColorValue('on-accent'),
    error: getThemeColorValue('error'),
    'on-error': getThemeColorValue('on-error'),
  };
};

export const useThemeColor = (): ((name: ThemeColorName) => string) => {
  const [colors, setColors] = useState<ThemeColors>(getColors);

  useEffect(() => {
    const updateColors = () => setColors(getColors());

    updateColors();
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateColors);
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', updateColors);
    };
  }, []);

  return useCallback(
    (name: ThemeColorName): string => {
      return colors[name] || '';
    },
    [colors]
  );
};

export type { ThemeColorName };
