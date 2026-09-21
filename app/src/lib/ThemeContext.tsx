import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getThemeTokens, type Theme, type ColorScheme } from "./theme";

export type ThemeMode = "system" | "light" | "dark";
const STORAGE_KEY = "themeMode";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  effectiveScheme: ColorScheme;
  theme: Theme;
}

const ThemeModeContext = createContext<ThemeContextValue | null>(null);

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") setModeState(stored);
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const effectiveScheme: ColorScheme = mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;
  const theme = getThemeTokens(effectiveScheme);

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, effectiveScheme, theme }}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error("useThemeMode deve essere usato dentro <ThemeModeProvider>");
  return ctx;
}

export function useTheme(): Theme {
  return useThemeMode().theme;
}
