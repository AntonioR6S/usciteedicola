import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DataProvider } from "../lib/DataContext";
import { useTheme, ThemeModeProvider } from "../lib/ThemeContext";

function RootStack() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="collana/[id]" options={{ title: "Collana" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeModeProvider>
        <DataProvider>
          <RootStack />
        </DataProvider>
      </ThemeModeProvider>
    </SafeAreaProvider>
  );
}
