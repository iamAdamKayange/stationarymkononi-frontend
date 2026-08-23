'use client';

import { useEffect } from 'react';
import { getSocket } from '../../lib/socket';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';

function playNotificationChime() {
  if (typeof window === 'undefined') return;

  const AudioContextCtor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) return;

  const context = new AudioContextCtor();
  void context.resume().catch(() => undefined);
  const gainNode = context.createGain();
  gainNode.gain.value = 0.03;
  gainNode.connect(context.destination);

  const tones = [440, 660];
  tones.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    oscillator.start(context.currentTime + index * 0.14);
    oscillator.stop(context.currentTime + index * 0.14 + 0.12);
  });

  window.setTimeout(() => {
    context.close().catch(() => undefined);
  }, 500);
}

export function NotificationEffects() {
  const { isAuthenticated } = useAuthStore();
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const notificationSoundEnabled = useSettingsStore((state) => state.notificationSoundEnabled);
  const notificationVibrateEnabled = useSettingsStore((state) => state.notificationVibrateEnabled);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();

    const handleNotification = () => {
      if (!notificationsEnabled) return;

      if (notificationSoundEnabled) {
        playNotificationChime();
      }

      if (notificationVibrateEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    };

    socket.on('notification:new', handleNotification);

    return () => {
      socket.off('notification:new', handleNotification);
    };
  }, [isAuthenticated, notificationsEnabled, notificationSoundEnabled, notificationVibrateEnabled]);

  return null;
}
