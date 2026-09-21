import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import type { Release } from "../lib/types";
import { formatPrice } from "../lib/format";
import { CATEGORY_LABELS } from "../lib/types";

export function ReleaseListItem({ release }: { release: Release }) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push({ pathname: "/collana/[id]", params: { id: release.seriesId } })}
    >
      {release.imageUrl ? (
        <Image source={{ uri: release.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.info}>
        <Text style={styles.series} numberOfLines={1}>
          {release.seriesTitle}
        </Text>
        <Text style={styles.issue} numberOfLines={1}>
          {release.issueNumber ? `N° ${release.issueNumber}` : ""}
          {release.issueTitle ? ` · ${release.issueTitle}` : ""}
        </Text>
        <Text style={styles.meta}>
          {CATEGORY_LABELS[release.category]}
          {release.publisher ? ` · ${release.publisher}` : ""}
        </Text>
      </View>
      {release.price !== null && <Text style={styles.price}>{formatPrice(release.price)}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  image: { width: 48, height: 60, borderRadius: 6, backgroundColor: "#eee" },
  imagePlaceholder: { backgroundColor: "#ddd" },
  info: { flex: 1 },
  series: { fontSize: 15, fontWeight: "600", color: "#111" },
  issue: { fontSize: 13, color: "#555", marginTop: 2 },
  meta: { fontSize: 12, color: "#888", marginTop: 2 },
  price: { fontSize: 13, fontWeight: "600", color: "#2E6F40" },
});
