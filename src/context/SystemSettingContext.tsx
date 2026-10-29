'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface SystemSettingData {
  teamName: string;
  teamLogo: string;
  loginWallpaper: string;
  adminWallpaper: string;
  hasCustomPin?: boolean;
}

interface SystemSettingContextType extends SystemSettingData {
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SystemSettingData = {
  teamName: 'Mariners SC',
  teamLogo: '/marinerssc.webp',
  loginWallpaper: '/newposter.webp',
  adminWallpaper: '/stadium_hero2.png',
  hasCustomPin: false,
};

const SystemSettingContext = createContext<SystemSettingContextType>({
  ...defaultSettings,
  loading: false,
  refreshSettings: async () => {},
});

export function SystemSettingProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: Partial<SystemSettingData>;
}) {
  const [settings, setSettings] = useState<SystemSettingData>({
    ...defaultSettings,
    ...(initialSettings || {}),
  });
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/system-settings', {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setSettings({
          teamName: data.teamName || defaultSettings.teamName,
          teamLogo: data.teamLogo || defaultSettings.teamLogo,
          loginWallpaper: data.loginWallpaper || defaultSettings.loginWallpaper,
          adminWallpaper: data.adminWallpaper || defaultSettings.adminWallpaper,
          hasCustomPin: Boolean(data.hasCustomPin),
        });
      }
    } catch (err) {
      console.warn('Failed to fetch system settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    const handleUpdated = () => {
      fetchSettings();
    };

    window.addEventListener('system_settings_updated', handleUpdated);
    return () => {
      window.removeEventListener('system_settings_updated', handleUpdated);
    };
  }, [fetchSettings]);

  return (
    <SystemSettingContext.Provider
      value={{
        ...settings,
        loading,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SystemSettingContext.Provider>
  );
}

export function useSystemSetting() {
  return useContext(SystemSettingContext);
}

