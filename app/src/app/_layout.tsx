import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DataProvider } from "../lib/DataContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="collana/[id]" options={{ title: "Collana" }} />
        </Stack>
      </DataProvider>
    </SafeAreaProvider>
  );
}
