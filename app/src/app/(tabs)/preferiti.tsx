import { useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEdicolaData } from "../../lib/DataContext";
import { AppHeader } from "../../components/AppHeader";
import { CATEGORY_LABELS } from "../../lib/types";
import { CATEGORY_COLORS } from "../../lib/theme";
import { useTheme } from "../../lib/ThemeContext";
import { formatDateLabel, formatPrice } from "../../lib/format";

export default function PreferitiScreen() {
  const { data, followedIds } = useEdicolaData();
  const theme = useTheme();

  const { followedSeries, weekSpend, monthSpend } = useMemo(() => {
    if (!data) return { followedSeries: [], weekSpend: 0, monthSpend: 0 };
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 1);

    const followedSet = new Set(followedIds);
    let weekSpend = 0;
    let monthSpend = 0;
    for (const r of data.releases) {
      if (!followedSet.has(r.seriesId) || r.price === null) continue;
      const d = new Date(r.releaseDate);
      if (d < todayStart) continue;
      if (d < weekEnd) weekSpend += r.price;
      if (d < monthEnd) monthSpend += r.price;
    }

    const followedSeries = followedIds
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

    return { followedSeries, weekSpend, monthSpend };
  }, [data, followedIds]);

  if (followedSeries.length === 0) {
    return (
      <View style={[styles.emptyState, { backgroundColor: theme.background }]}>
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
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingVertical: 8 }}
      data={followedSeries}
      keyExtractor={(item) => item.series.id}
      ListHeaderComponent={
        <View>
          <View style={styles.headerWrap}>
            <AppHeader />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Seguite</Text>
          {(weekSpend > 0 || monthSpend > 0) && (
            <View style={styles.spendRow}>
              <View style={[styles.spendCard, { backgroundColor: theme.accentSoft }]}>
                <Text style={[styles.spendLabel, { color: theme.accent }]}>Prossimi 7 giorni</Text>
                <Text style={[styles.spendValue, { color: theme.accent }]}>{formatPrice(weekSpend)}</Text>
              </View>
              <View style={[styles.spendCard, { backgroundColor: theme.accentSoft }]}>
                <Text style={[styles.spendLabel, { color: theme.accent }]}>Questo mese</Text>
                <Text style={[styles.spendValue, { color: theme.accent }]}>{formatPrice(monthSpend)}</Text>
              </View>
            </View>
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
              <View style={[styles.pill, { backgroundColor: categoryColor + "22" }]}>
                <Text style={[styles.pillText, { color: categoryColor }]}>
                  {CATEGORY_LABELS[item.series.category]}
                </Text>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: { paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 26, fontWeight: "800", paddingHorizontal: 16, paddingBottom: 8 },
  spendRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  spendCard: { flex: 1, borderRadius: 14, padding: 12, gap: 2 },
  spendLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  spendValue: { fontSize: 18, fontWeight: "800" },
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
  pill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  pillText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  seriesTitle: { fontSize: 15, fontWeight: "700" },
  next: { fontSize: 13, fontWeight: "600" },
  emptyState: { flex: 1 },
  emptyInner: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
