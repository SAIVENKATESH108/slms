import React, { useEffect } from 'react';
import { useThemeStore } from '../../stores/themeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { currentTheme, applyThemeToDOM } = useThemeStore();

  useEffect(() => {
    // Apply theme whenever it changes
    applyThemeToDOM(currentTheme);
  }, [currentTheme, applyThemeToDOM]);

  return <>{children}</>;
};