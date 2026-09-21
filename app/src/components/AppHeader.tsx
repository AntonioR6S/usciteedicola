import { View, Text, Image, StyleSheet } from "react-native";
import { useTheme } from "../lib/ThemeContext";

export function AppHeader() {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
      <Image source={require("../../assets/icon.png")} style={styles.logo} />
      <Text style={[styles.name, { color: theme.textMuted }]}>USCITE IN EDICOLA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 },
  logo: { width: 20, height: 20, borderRadius: 6 },
  name: { fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
});
