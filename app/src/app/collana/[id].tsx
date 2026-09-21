import { useMemo } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useEdicolaData } from "../../lib/DataContext";
import { CATEGORY_LABELS } from "../../lib/types";
import { formatDateLabel, formatPrice } from "../../lib/format";

export default function CollanaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, followedIds, toggleFollow } = useEdicolaData();

  const series = useMemo(() => data?.series.find((s) => s.id === id) ?? null, [data, id]);
  const releases = useMemo(
    () =>
      (data?.releases.filter((r) => r.seriesId === id) ?? []).sort((a, b) =>
        a.releaseDate.localeCompare(b.releaseDate),
      ),
    [data, id],
  );
  const isFollowed = followedIds.includes(id);

  if (!series) {
    return (
      <View style={styles.center}>
        <Text>Collana non trovata.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: series.title }} />
      <View style={styles.header}>
        {series.imageUrl ? (
          <Image source={{ uri: series.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{series.title}</Text>
          <Text style={styles.meta}>
            {CATEGORY_LABELS[series.category]}
            {series.publisher ? ` · ${series.publisher}` : ""}
          </Text>
          {series.totalIssues && <Text style={styles.meta}>{series.totalIssues} uscite totali</Text>}
          <TouchableOpacity
            style={[styles.followButton, isFollowed && styles.followButtonActive]}
            onPress={() => toggleFollow(series.id)}
          >
            <Text style={[styles.followButtonText, isFollowed && styles.followButtonTextActive]}>
              {isFollowed ? "✓ Seguita" : "Segui"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Piano delle uscite</Text>
      <FlatList
        data={releases}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.releaseRow}>
            <Text style={styles.releaseDate}>{formatDateLabel(item.releaseDate)}</Text>
            <Text style={styles.releaseIssue} numberOfLines={2}>
              {item.issueNumber ? `N° ${item.issueNumber}` : ""}
              {item.issueTitle ? ` · ${item.issueTitle}` : ""}
            </Text>
            {item.price !== null && <Text style={styles.releasePrice}>{formatPrice(item.price)}</Text>}
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.link} onPress={() => Linking.openURL(series.sourceUrl)}>
            <Text style={styles.linkText}>Apri la pagina originale</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", padding: 16, gap: 14 },
  image: { width: 90, height: 112, borderRadius: 8, backgroundColor: "#eee" },
  imagePlaceholder: { backgroundColor: "#ddd" },
  headerInfo: { flex: 1, justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700", color: "#111" },
  meta: { fontSize: 13, color: "#666", marginTop: 3 },
  followButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2E6F40",
  },
  followButtonActive: { backgroundColor: "#2E6F40" },
  followButtonText: { color: "#2E6F40", fontWeight: "700" },
  followButtonTextActive: { color: "#fff" },
  sectionTitle: { fontSize: 15, fontWeight: "700", paddingHorizontal: 16, marginTop: 8, marginBottom: 4 },
  releaseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
    gap: 8,
  },
  releaseDate: { width: 110, fontSize: 12, color: "#888", textTransform: "capitalize" },
  releaseIssue: { flex: 1, fontSize: 14, color: "#222" },
  releasePrice: { fontSize: 13, fontWeight: "600", color: "#2E6F40" },
  link: { padding: 20, alignItems: "center" },
  linkText: { color: "#2E6F40", fontWeight: "600" },
});
