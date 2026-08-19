'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';

export const SettingsInitializer: React.FC = () => {
  const initializeSettings = useSettingsStore((state) => state.initializeSettings);

  useEffect(() => {
    initializeSettings();
  }, [initializeSettings]);

  return null;
};
