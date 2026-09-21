import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../lib/ThemeContext";
import { formatPrice } from "../lib/format";

const CHART_HEIGHT = 64;

export interface SpendBucket {
  label: string;
  value: number;
}

export function SpendChart({ buckets }: { buckets: SpendBucket[] }) {
  const theme = useTheme();
  const max = Math.max(1, ...buckets.map((b) => b.value));

  return (
    <View style={styles.row}>
      {buckets.map((b, i) => {
        const barHeight = b.value === 0 ? 3 : Math.max(6, Math.round((b.value / max) * CHART_HEIGHT));
        return (
          <View key={i} style={styles.col}>
            <Text style={[styles.value, { color: theme.textMuted }]} numberOfLines={1}>
              {b.value > 0 ? formatPrice(b.value) : ""}
            </Text>
            <View style={styles.track}>
              <View style={[styles.bar, { height: barHeight, backgroundColor: theme.accent }]} />
            </View>
            <Text style={[styles.label, { color: theme.textMuted }]}>{b.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  col: { alignItems: "center", flex: 1, gap: 4 },
  value: { fontSize: 9, fontWeight: "700" },
  track: { height: CHART_HEIGHT, justifyContent: "flex-end" },
  bar: { width: 16, borderRadius: 5 },
  label: { fontSize: 10, fontWeight: "600" },
});
