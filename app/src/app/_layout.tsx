import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DataProvider } from "../lib/DataContext";
import { useTheme } from "../lib/theme";

export default function RootLayout() {
  const theme = useTheme();
  return (
    <SafeAreaProvider>
      <DataProvider>
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
      </DataProvider>
    </SafeAreaProvider>
  );
}
