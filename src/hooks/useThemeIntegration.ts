import { useEffect } from 'react';
import { useThemeStore, PREDEFINED_THEMES } from '../stores/themeStore';
import { useSettings } from './useSettings';

/**
 * Hook to integrate theme store with settings system
 * Syncs theme changes between the theme store and user settings
 */
export const useThemeIntegration = () => {
  const { settings, updateSettings } = useSettings();
  const { currentTheme, setTheme, customThemes } = useThemeStore();

  // Sync theme store with settings when settings change
  useEffect(() => {
    if (settings.selectedThemeId && settings.selectedThemeId !== currentTheme.id) {
      // Find the theme by ID
      const allThemes = [...PREDEFINED_THEMES, ...customThemes];
      const selectedTheme = allThemes.find(theme => theme.id === settings.selectedThemeId);
      
      if (selectedTheme) {
        setTheme(selectedTheme);
      }
    }
  }, [settings.selectedThemeId, currentTheme.id, customThemes, setTheme]);

  // Sync custom themes from settings to theme store
  useEffect(() => {
    if (settings.customThemes && settings.customThemes.length > 0) {
      // This would require updating the theme store to accept external custom themes
      // For now, we'll rely on the theme store's own persistence
    }
  }, [settings.customThemes]);

  // Update settings when theme changes in theme store
  const handleThemeChange = (themeId: string, isDark: boolean) => {
    updateSettings('selectedThemeId', themeId);
    updateSettings('darkMode', isDark);
  };

  return {
    currentTheme,
    handleThemeChange,
  };
};