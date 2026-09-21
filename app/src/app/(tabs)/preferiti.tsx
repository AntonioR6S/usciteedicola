import { useMemo } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useEdicolaData } from "../../lib/DataContext";
import { CATEGORY_LABELS } from "../../lib/types";
import { formatDateLabel } from "../../lib/format";

export default function PreferitiScreen() {
  const { data, followedIds } = useEdicolaData();

  const followedSeries = useMemo(() => {
    if (!data) return [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return followedIds
      .map((id) => data.series.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((series) => {
        const releases = data.releases
          .filter((r) => r.seriesId === series.id)
          .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
        const nextRelease = releases.find((r) => new Date(r.releaseDate) >= todayStart);
        const lastRelease = [...releases].reverse().find((r) => new Date(r.releaseDate) < todayStart);
        return { series, nextRelease, lastRelease };
      });
  }, [data, followedIds]);

  if (followedSeries.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Nessuna collana seguita</Text>
        <Text style={styles.emptyBody}>
          Apri una uscita dal Calendario e tocca "Segui" per ricevere qui le prossime date e le
          notifiche.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={followedSeries}
      keyExtractor={(item) => item.series.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push({ pathname: "/collana/[id]", params: { id: item.series.id } })}
        >
          {item.series.imageUrl ? (
            <Image source={{ uri: item.series.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]} />
          )}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {item.series.title}
            </Text>
            <Text style={styles.meta}>{CATEGORY_LABELS[item.series.category]}</Text>
            <Text style={styles.next}>
              {item.nextRelease
                ? `Prossima uscita: ${formatDateLabel(item.nextRelease.releaseDate)}`
                : item.lastRelease
                  ? `Ultima uscita: ${formatDateLabel(item.lastRelease.releaseDate)} (nuova data non ancora confermata)`
                  : "Nessuna data disponibile"}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  row: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  image: { width: 52, height: 66, borderRadius: 6, backgroundColor: "#eee" },
  imagePlaceholder: { backgroundColor: "#ddd" },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", color: "#111" },
  meta: { fontSize: 12, color: "#888", marginTop: 2 },
  next: { fontSize: 13, color: "#2E6F40", marginTop: 4, fontWeight: "600" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  emptyBody: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20 },
});
