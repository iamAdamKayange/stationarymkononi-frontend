import { create } from 'zustand';

export type Language = 'en' | 'sw';
export type Theme = 'light' | 'dark';

interface SettingsState {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
  toggleTheme: () => void;
  initializeSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'light',
  language: 'sw', // Default to Swahili to match existing app localization

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stationery-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ theme });
  },

  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stationery-lang', language);
      document.documentElement.setAttribute('lang', language);
    }
    set({ language });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(nextTheme);
  },

  initializeSettings: () => {
    if (typeof window === 'undefined') return;
    try {
      const storedTheme = localStorage.getItem('stationery-theme') as Theme | null;
      const storedLang = localStorage.getItem('stationery-lang') as Language | null;

      const systemTheme: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const activeTheme = storedTheme || systemTheme;
      const activeLang = storedLang || 'sw';

      get().setTheme(activeTheme);
      get().setLanguage(activeLang);
    } catch {
      // ignore
    }
  },
}));
