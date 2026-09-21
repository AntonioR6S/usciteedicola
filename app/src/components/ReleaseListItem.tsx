import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import type { Release } from "../lib/types";
import { formatPrice } from "../lib/format";
import { CATEGORY_LABELS } from "../lib/types";
import { CATEGORY_COLORS, useTheme } from "../lib/theme";

export function ReleaseListItem({ release }: { release: Release }) {
  const theme = useTheme();
  const categoryColor = CATEGORY_COLORS[release.category];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: theme.surface, shadowColor: theme.text }]}
      onPress={() => router.push({ pathname: "/collana/[id]", params: { id: release.seriesId } })}
    >
      <Image
        source={release.imageUrl ?? undefined}
        style={[styles.image, { backgroundColor: theme.surfaceAlt }]}
        contentFit="cover"
        transition={150}
      />
      <View style={styles.info}>
        <View style={[styles.pill, { backgroundColor: categoryColor + "22" }]}>
          <Text style={[styles.pillText, { color: categoryColor }]}>
            {CATEGORY_LABELS[release.category]}
          </Text>
        </View>
        <Text style={[styles.series, { color: theme.text }]} numberOfLines={1}>
          {release.seriesTitle}
        </Text>
        <Text style={[styles.issue, { color: theme.textMuted }]} numberOfLines={1}>
          {release.issueNumber ? `N° ${release.issueNumber}` : ""}
          {release.issueTitle ? ` · ${release.issueTitle}` : ""}
        </Text>
      </View>
      {release.price !== null && (
        <Text style={[styles.price, { color: theme.accent }]}>{formatPrice(release.price)}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 10,
    borderRadius: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  image: { width: 52, height: 66, borderRadius: 10 },
  info: { flex: 1, gap: 3 },
  pill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  pillText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  series: { fontSize: 15, fontWeight: "700" },
  issue: { fontSize: 13 },
  price: { fontSize: 13, fontWeight: "700" },
});
