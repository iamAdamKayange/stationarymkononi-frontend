import { create } from 'zustand';

export type Language = 'en' | 'sw';
export type Theme = 'light' | 'dark';

interface SettingsState {
  theme: Theme;
  language: Language;
  notificationsEnabled: boolean;
  notificationSoundEnabled: boolean;
  notificationVibrateEnabled: boolean;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationSoundEnabled: (enabled: boolean) => void;
  setNotificationVibrateEnabled: (enabled: boolean) => void;
  toggleTheme: () => void;
  initializeSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'light',
  language: 'sw', // Default to Swahili to match existing app localization
  notificationsEnabled: true,
  notificationSoundEnabled: true,
  notificationVibrateEnabled: true,

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

  setNotificationsEnabled: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stationery-notifications-enabled', String(enabled));
    }
    set({ notificationsEnabled: enabled });
  },

  setNotificationSoundEnabled: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stationery-notification-sound-enabled', String(enabled));
    }
    set({ notificationSoundEnabled: enabled });
  },

  setNotificationVibrateEnabled: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stationery-notification-vibrate-enabled', String(enabled));
    }
    set({ notificationVibrateEnabled: enabled });
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
      const storedNotifications = localStorage.getItem('stationery-notifications-enabled');
      const storedNotificationSound = localStorage.getItem('stationery-notification-sound-enabled');
      const storedNotificationVibrate = localStorage.getItem('stationery-notification-vibrate-enabled');

      const systemTheme: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const activeTheme = storedTheme || systemTheme;
      const activeLang = storedLang || 'sw';
      const activeNotifications = storedNotifications !== null ? storedNotifications === 'true' : true;
      const activeNotificationSound =
        storedNotificationSound !== null ? storedNotificationSound === 'true' : true;
      const activeNotificationVibrate =
        storedNotificationVibrate !== null ? storedNotificationVibrate === 'true' : true;

      get().setTheme(activeTheme);
      get().setLanguage(activeLang);
      set({
        notificationsEnabled: activeNotifications,
        notificationSoundEnabled: activeNotificationSound,
        notificationVibrateEnabled: activeNotificationVibrate,
      });
    } catch {
      // ignore
    }
  },
}));
