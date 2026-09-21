import { useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, Stack } from "expo-router";
import { useEdicolaData } from "../../lib/DataContext";
import { CATEGORY_LABELS } from "../../lib/types";
import { CATEGORY_COLORS, useTheme } from "../../lib/theme";
import { formatDateLabel, formatPrice } from "../../lib/format";

export default function CollanaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, followedIds, toggleFollow } = useEdicolaData();
  const theme = useTheme();

  const series = useMemo(() => data?.series.find((s) => s.id === id) ?? null, [data, id]);
  const releases = useMemo(
    () =>
      (data?.releases.filter((r) => r.seriesId === id) ?? []).sort((a, b) =>
        a.releaseDate.localeCompare(b.releaseDate),
      ),
    [data, id],
  );
  const isFollowed = followedIds.includes(id);
  const todayStr = new Date().toISOString().slice(0, 10);

  if (!series) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Collana non trovata.</Text>
      </View>
    );
  }

  const categoryColor = CATEGORY_COLORS[series.category];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: series.title, headerBackTitle: "Indietro" }} />

      <View style={[styles.hero, { backgroundColor: theme.surface }]}>
        <Image
          source={series.imageUrl ?? undefined}
          style={[styles.image, { backgroundColor: theme.surfaceAlt }]}
          contentFit="cover"
          transition={150}
        />
        <View style={styles.heroInfo}>
          <View style={[styles.pill, { backgroundColor: categoryColor + "22" }]}>
            <Text style={[styles.pillText, { color: categoryColor }]}>
              {CATEGORY_LABELS[series.category]}
            </Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{series.title}</Text>
          {series.publisher && <Text style={[styles.meta, { color: theme.textMuted }]}>{series.publisher}</Text>}
          {series.totalIssues && (
            <Text style={[styles.meta, { color: theme.textMuted }]}>{series.totalIssues} uscite totali</Text>
          )}
          <TouchableOpacity
            style={[
              styles.followButton,
              { borderColor: theme.accent, backgroundColor: isFollowed ? theme.accent : "transparent" },
            ]}
            onPress={() => toggleFollow(series.id)}
          >
            <Ionicons
              name={isFollowed ? "checkmark-circle" : "notifications-outline"}
              size={16}
              color={isFollowed ? "#fff" : theme.accent}
            />
            <Text style={[styles.followButtonText, { color: isFollowed ? "#fff" : theme.accent }]}>
              {isFollowed ? "Seguita" : "Segui"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Piano delle uscite</Text>
      <FlatList
        data={releases}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const isFuture = item.releaseDate >= todayStr;
          const isLast = index === releases.length - 1;
          return (
            <View style={styles.timelineRow}>
              <View style={styles.timelineTrack}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: isFuture ? categoryColor : theme.border },
                  ]}
                />
                {!isLast && <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />}
              </View>
              <View style={styles.releaseContent}>
                <Text style={[styles.releaseDate, { color: isFuture ? categoryColor : theme.textMuted }]}>
                  {formatDateLabel(item.releaseDate)}
                </Text>
                <Text style={[styles.releaseIssue, { color: theme.text }]} numberOfLines={2}>
                  {item.issueNumber ? `N° ${item.issueNumber}` : ""}
                  {item.issueTitle ? ` · ${item.issueTitle}` : ""}
                </Text>
                {item.price !== null && (
                  <Text style={[styles.releasePrice, { color: theme.textMuted }]}>{formatPrice(item.price)}</Text>
                )}
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <TouchableOpacity style={styles.link} onPress={() => Linking.openURL(series.sourceUrl)}>
            <Text style={[styles.linkText, { color: theme.accent }]}>Apri la pagina originale</Text>
          </TouchableOpacity>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { flexDirection: "row", padding: 16, gap: 14 },
  image: { width: 100, height: 126, borderRadius: 14 },
  heroInfo: { flex: 1, justifyContent: "center", gap: 4 },
  pill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 2 },
  pillText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  title: { fontSize: 19, fontWeight: "800" },
  meta: { fontSize: 13 },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  followButtonText: { fontWeight: "700", fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: "800", paddingHorizontal: 16, marginTop: 10, marginBottom: 6 },
  timelineRow: { flexDirection: "row", paddingHorizontal: 16 },
  timelineTrack: { width: 20, alignItems: "center" },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  timelineLine: { width: 2, flex: 1, marginTop: 2 },
  releaseContent: { flex: 1, paddingBottom: 16, gap: 2 },
  releaseDate: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  releaseIssue: { fontSize: 14, fontWeight: "500" },
  releasePrice: { fontSize: 12 },
  link: { padding: 20, alignItems: "center" },
  linkText: { fontWeight: "700" },
});
