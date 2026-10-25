import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS } from './theme';

const STORAGE_KEY_DARK_MODE = '@werash_dark_mode';

export const ThemeContext = createContext({
  isDarkMode: false,
  toggleDarkMode: () => {},
  setDarkMode: () => {},
  colors: LIGHT_COLORS,
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(STORAGE_KEY_DARK_MODE)
      .then((stored) => {
        if (!isMounted) return;
        if (stored !== null) {
          try {
            const parsed = JSON.parse(stored);
            if (typeof parsed === 'boolean') {
              setIsDarkMode(parsed);
            }
          } catch (_) {}
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);


  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY_DARK_MODE, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const setDarkMode = (val) => {
    setIsDarkMode(val);
    AsyncStorage.setItem(STORAGE_KEY_DARK_MODE, JSON.stringify(val)).catch(() => {});
  };

  const colors = useMemo(() => {
    return isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  }, [isDarkMode]);

  const value = useMemo(() => ({
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
    colors,
  }), [isDarkMode, colors]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeStyles(stylesFactory) {
  const { colors, isDarkMode } = useTheme();
  return useMemo(() => stylesFactory(colors, isDarkMode), [colors, isDarkMode, stylesFactory]);
}

