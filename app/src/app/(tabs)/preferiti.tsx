import { useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEdicolaData } from "../../lib/DataContext";
import { AppHeader } from "../../components/AppHeader";
import { SpendChart, type SpendBucket } from "../../components/SpendChart";
import { CATEGORY_LABELS, type Category } from "../../lib/types";
import { CATEGORY_COLORS } from "../../lib/theme";
import { useTheme } from "../../lib/ThemeContext";
import { formatDateLabel, formatPrice } from "../../lib/format";

export default function PreferitiScreen() {
  const { data, followedIds, followedPublishers, toggleFollowPublisher, effectiveFollowedIds } = useEdicolaData();
  const theme = useTheme();

  const stats = useMemo(() => {
    if (!data) {
      return {
        followedSeries: [] as ReturnType<typeof buildFollowedSeries>,
        weekSpend: 0,
        monthSpend: 0,
        weeklyBuckets: [] as SpendBucket[],
        topCategory: null as { category: Category; count: number } | null,
        topPublisher: null as { publisher: string; count: number } | null,
      };
    }
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 1);
    const effectiveSet = new Set(effectiveFollowedIds);

    let weekSpend = 0;
    let monthSpend = 0;
    for (const r of data.releases) {
      if (!effectiveSet.has(r.seriesId) || r.price === null) continue;
      const d = new Date(r.releaseDate);
      if (d < todayStart) continue;
      if (d < weekEnd) weekSpend += r.price;
      if (d < monthEnd) monthSpend += r.price;
    }

    const weeklyBuckets: SpendBucket[] = [];
    for (let w = 0; w < 6; w++) {
      const wStart = new Date(todayStart);
      wStart.setDate(wStart.getDate() + w * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 7);
      let value = 0;
      for (const r of data.releases) {
        if (!effectiveSet.has(r.seriesId) || r.price === null) continue;
        const d = new Date(r.releaseDate);
        if (d >= wStart && d < wEnd) value += r.price;
      }
      weeklyBuckets.push({ label: `${wStart.getDate()}/${wStart.getMonth() + 1}`, value });
    }

    const followedSeries = buildFollowedSeries(data, effectiveFollowedIds, followedIds, todayStart);

    const categoryCounts = new Map<Category, number>();
    const publisherCounts = new Map<string, number>();
    for (const { series } of followedSeries) {
      categoryCounts.set(series.category, (categoryCounts.get(series.category) ?? 0) + 1);
      if (series.publisher) publisherCounts.set(series.publisher, (publisherCounts.get(series.publisher) ?? 0) + 1);
    }
    const topCategoryEntry = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const topPublisherEntry = [...publisherCounts.entries()].sort((a, b) => b[1] - a[1])[0];

    return {
      followedSeries,
      weekSpend,
      monthSpend,
      weeklyBuckets,
      topCategory: topCategoryEntry ? { category: topCategoryEntry[0], count: topCategoryEntry[1] } : null,
      topPublisher: topPublisherEntry ? { publisher: topPublisherEntry[0], count: topPublisherEntry[1] } : null,
    };
  }, [data, followedIds, effectiveFollowedIds]);

  const hasAnything = stats.followedSeries.length > 0 || followedPublishers.length > 0;

  if (!hasAnything) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.emptyState, { backgroundColor: theme.background }]}>
        <View style={styles.headerWrap}>
          <AppHeader />
        </View>
        <View style={styles.emptyInner}>
          <Ionicons name="star-outline" size={44} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Nessuna collana seguita</Text>
          <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
            Apri una uscita dal Calendario e tocca "Segui" per ricevere qui le prossime date e le
            notifiche.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
    <FlatList
      style={styles.container}
      contentContainerStyle={{ paddingVertical: 8 }}
      data={stats.followedSeries}
      keyExtractor={(item) => item.series.id}
      ListHeaderComponent={
        <View>
          <View style={styles.headerWrap}>
            <AppHeader />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Seguite</Text>

          {followedPublishers.length > 0 && (
            <View style={styles.publisherChips}>
              {followedPublishers.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.publisherChip, { backgroundColor: theme.surfaceAlt }]}
                  onPress={() => toggleFollowPublisher(p)}
                >
                  <Ionicons name="business-outline" size={12} color={theme.textMuted} />
                  <Text style={[styles.publisherChipText, { color: theme.text }]}>{p}</Text>
                  <Ionicons name="close" size={13} color={theme.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {(stats.weekSpend > 0 || stats.monthSpend > 0) && (
            <>
              <View style={styles.spendRow}>
                <View style={[styles.spendCard, { backgroundColor: theme.accentSoft }]}>
                  <Text style={[styles.spendLabel, { color: theme.accent }]}>Prossimi 7 giorni</Text>
                  <Text style={[styles.spendValue, { color: theme.accent }]}>{formatPrice(stats.weekSpend)}</Text>
                </View>
                <View style={[styles.spendCard, { backgroundColor: theme.accentSoft }]}>
                  <Text style={[styles.spendLabel, { color: theme.accent }]}>Questo mese</Text>
                  <Text style={[styles.spendValue, { color: theme.accent }]}>{formatPrice(stats.monthSpend)}</Text>
                </View>
              </View>
              <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.chartTitle, { color: theme.textMuted }]}>SPESA PROSSIME 6 SETTIMANE</Text>
                <SpendChart buckets={stats.weeklyBuckets} />
              </View>
            </>
          )}

          {(stats.topCategory || stats.topPublisher) && (
            <View style={styles.statsRow}>
              {stats.topCategory && (
                <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>CATEGORIA TOP</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {CATEGORY_LABELS[stats.topCategory.category]}
                  </Text>
                </View>
              )}
              {stats.topPublisher && (
                <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>EDITORE TOP</Text>
                  <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>
                    {stats.topPublisher.publisher}
                  </Text>
                </View>
              )}
            </View>
          )}

          {stats.followedSeries.length > 0 && (
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>COLLANE ({stats.followedSeries.length})</Text>
          )}
        </View>
      }
      renderItem={({ item }) => {
        const categoryColor = CATEGORY_COLORS[item.series.category];
        return (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.card, { backgroundColor: theme.surface, shadowColor: theme.text }]}
            onPress={() => router.push({ pathname: "/collana/[id]", params: { id: item.series.id } })}
          >
            <Image
              source={item.series.imageUrl ?? undefined}
              style={[styles.image, { backgroundColor: theme.surfaceAlt }]}
              contentFit="cover"
              transition={150}
            />
            <View style={styles.info}>
              <View style={styles.pillRow}>
                <View style={[styles.pill, { backgroundColor: categoryColor + "22" }]}>
                  <Text style={[styles.pillText, { color: categoryColor }]}>
                    {CATEGORY_LABELS[item.series.category]}
                  </Text>
                </View>
                {!item.isExplicit && (
                  <Text style={[styles.viaPublisher, { color: theme.textMuted }]}>via editore</Text>
                )}
              </View>
              <Text style={[styles.seriesTitle, { color: theme.text }]} numberOfLines={1}>
                {item.series.title}
              </Text>
              <Text style={[styles.next, { color: item.nextRelease ? theme.accent : theme.textMuted }]}>
                {item.nextRelease
                  ? `Prossima uscita: ${formatDateLabel(item.nextRelease.releaseDate)}`
                  : item.lastRelease
                    ? `Ultima uscita: ${formatDateLabel(item.lastRelease.releaseDate)} · data futura non confermata`
                    : "Nessuna data disponibile"}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
    </SafeAreaView>
  );
}

function buildFollowedSeries(
  data: NonNullable<ReturnType<typeof useEdicolaData>["data"]>,
  effectiveFollowedIds: string[],
  followedIds: string[],
  todayStart: Date,
) {
  const explicitSet = new Set(followedIds);
  return effectiveFollowedIds
    .map((id) => data.series.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((series) => {
      const releases = data.releases
        .filter((r) => r.seriesId === series.id)
        .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
      const nextRelease = releases.find((r) => new Date(r.releaseDate) >= todayStart);
      const lastRelease = [...releases].reverse().find((r) => new Date(r.releaseDate) < todayStart);
      return { series, nextRelease, lastRelease, isExplicit: explicitSet.has(series.id) };
    });
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: { paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 26, fontWeight: "800", paddingHorizontal: 16, paddingBottom: 8 },
  publisherChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  publisherChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  publisherChipText: { fontSize: 12, fontWeight: "600" },
  spendRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 10 },
  spendCard: { flex: 1, borderRadius: 14, padding: 12, gap: 2 },
  spendLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  spendValue: { fontSize: 18, fontWeight: "800" },
  chartCard: { marginHorizontal: 16, borderRadius: 14, padding: 14, marginBottom: 10, gap: 10 },
  chartTitle: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 10 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, gap: 2 },
  statLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  statValue: { fontSize: 14, fontWeight: "700" },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.4, paddingHorizontal: 16, marginBottom: 4 },
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
  image: { width: 56, height: 70, borderRadius: 10 },
  info: { flex: 1, gap: 4 },
  pillRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  pillText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  viaPublisher: { fontSize: 10, fontStyle: "italic" },
  seriesTitle: { fontSize: 15, fontWeight: "700" },
  next: { fontSize: 13, fontWeight: "600" },
  emptyState: { flex: 1 },
  emptyInner: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
