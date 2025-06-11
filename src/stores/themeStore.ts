import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  border: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  isDark: boolean;
}

export interface CustomTheme extends Theme {
  isCustom: true;
}

// Predefined themes
export const PREDEFINED_THEMES: Theme[] = [
  {
    id: 'light',
    name: 'Light',
    isDark: false,
    colors: {
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      background: '#F9FAFB',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#6B7280',
      accent: '#10B981',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      border: '#E5E7EB',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    isDark: true,
    colors: {
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      background: '#111827',
      surface: '#1F2937',
      text: '#F9FAFB',
      textSecondary: '#D1D5DB',
      accent: '#10B981',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      border: '#374151',
    },
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    isDark: false,
    colors: {
      primary: '#3B82F6',
      secondary: '#60A5FA',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#0F172A',
      textSecondary: '#64748B',
      accent: '#06B6D4',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      border: '#E2E8F0',
    },
  },
  {
    id: 'green',
    name: 'Forest Green',
    isDark: false,
    colors: {
      primary: '#059669',
      secondary: '#34D399',
      background: '#F0FDF4',
      surface: '#FFFFFF',
      text: '#064E3B',
      textSecondary: '#6B7280',
      accent: '#10B981',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      border: '#D1FAE5',
    },
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    isDark: false,
    colors: {
      primary: '#E11D48',
      secondary: '#FB7185',
      background: '#FFF1F2',
      surface: '#FFFFFF',
      text: '#881337',
      textSecondary: '#6B7280',
      accent: '#F43F5E',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      border: '#FECDD3',
    },
  },
];

interface ThemeState {
  currentTheme: Theme;
  customThemes: CustomTheme[];
  isLoading: boolean;
  
  // Actions
  setTheme: (theme: Theme) => void;
  createCustomTheme: (name: string, colors: ThemeColors, isDark: boolean) => void;
  updateCustomTheme: (id: string, updates: Partial<CustomTheme>) => void;
  deleteCustomTheme: (id: string) => void;
  applyThemeToDOM: (theme: Theme) => void;
  resetToDefault: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: PREDEFINED_THEMES[0], // Default to light theme
      customThemes: [],
      isLoading: false,

      setTheme: (theme: Theme) => {
        set({ currentTheme: theme });
        get().applyThemeToDOM(theme);
      },

      createCustomTheme: (name: string, colors: ThemeColors, isDark: boolean) => {
        const customTheme: CustomTheme = {
          id: `custom-${Date.now()}`,
          name,
          colors,
          isDark,
          isCustom: true,
        };
        
        set((state) => ({
          customThemes: [...state.customThemes, customTheme],
        }));
        
        return customTheme;
      },

      updateCustomTheme: (id: string, updates: Partial<CustomTheme>) => {
        set((state) => ({
          customThemes: state.customThemes.map((theme) =>
            theme.id === id ? { ...theme, ...updates } : theme
          ),
        }));
        
        // If the updated theme is currently active, apply changes
        const { currentTheme } = get();
        if (currentTheme.id === id) {
          const updatedTheme = get().customThemes.find(t => t.id === id);
          if (updatedTheme) {
            get().setTheme(updatedTheme);
          }
        }
      },

      deleteCustomTheme: (id: string) => {
        const { currentTheme } = get();
        
        set((state) => ({
          customThemes: state.customThemes.filter((theme) => theme.id !== id),
        }));
        
        // If the deleted theme was active, switch to default
        if (currentTheme.id === id) {
          get().setTheme(PREDEFINED_THEMES[0]);
        }
      },

      applyThemeToDOM: (theme: Theme) => {
        const root = document.documentElement;
        
        // Apply CSS custom properties
        Object.entries(theme.colors).forEach(([key, value]) => {
          root.style.setProperty(`--color-${key}`, value);
        });
        
        // Apply dark mode class
        if (theme.isDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        
        // Store theme preference
        localStorage.setItem('theme-preference', JSON.stringify(theme));
      },

      resetToDefault: () => {
        const defaultTheme = PREDEFINED_THEMES[0];
        set({ 
          currentTheme: defaultTheme,
          customThemes: [],
        });
        get().applyThemeToDOM(defaultTheme);
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        customThemes: state.customThemes,
      }),
    }
  )
);

// Initialize theme on app start
export const initializeTheme = () => {
  const { currentTheme, applyThemeToDOM } = useThemeStore.getState();
  applyThemeToDOM(currentTheme);
};