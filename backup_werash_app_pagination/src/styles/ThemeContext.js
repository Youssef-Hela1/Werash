import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { LIGHT_COLORS, DARK_COLORS } from './theme';

export const ThemeContext = createContext({
  isDarkMode: false,
  toggleDarkMode: () => {},
  colors: LIGHT_COLORS,
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');

  useEffect(() => {
    setIsDarkMode(systemScheme === 'dark');
  }, [systemScheme]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const colors = useMemo(() => {
    return isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  }, [isDarkMode]);

  const value = useMemo(() => ({
    isDarkMode,
    toggleDarkMode,
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
  const { colors } = useTheme();
  return useMemo(() => stylesFactory(colors), [colors, stylesFactory]);
}
