import { useMemo, useState } from "react";
import { View, Text, SectionList, TextInput, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEdicolaData } from "../../lib/DataContext";
import { CategoryFilterBar } from "../../components/CategoryFilterBar";
import { ReleaseListItem } from "../../components/ReleaseListItem";
import { formatDateLabel, releaseWindowStart } from "../../lib/format";
import { useTheme } from "../../lib/theme";
import type { Category, Release } from "../../lib/types";

export default function CalendarioScreen() {
  const { data, followedIds, loading, refresh } = useEdicolaData();
  const theme = useTheme();
  const [category, setCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState("");

  const { sections, upcomingCount } = useMemo(() => {
    if (!data) return { sections: [], upcomingCount: 0 };
    const windowStart = releaseWindowStart();
    const q = query.trim().toLowerCase();

    const filtered = data.releases.filter((r) => {
      if (new Date(r.releaseDate) < windowStart) return false;
      if (category && r.category !== category) return false;
      if (q && !r.seriesTitle.toLowerCase().includes(q)) return false;
      return true;
    });

    const byDate = new Map<string, Release[]>();
    for (const release of filtered) {
      const list = byDate.get(release.releaseDate) ?? [];
      list.push(release);
      byDate.set(release.releaseDate, list);
    }

    const sections = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, releases]) => ({ title: date, data: releases }));

    return { sections, upcomingCount: filtered.length };
  }, [data, category, query]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Calendario</Text>
        <View style={styles.statsRow}>
          <StatChip icon="albums" label={`${upcomingCount} uscite`} theme={theme} />
          <StatChip icon="star" label={`${followedIds.length} seguite`} theme={theme} />
        </View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: theme.surfaceAlt }]}>
        <Ionicons name="search" size={16} color={theme.textMuted} />
        <TextInput
          placeholder="Cerca una collana..."
          placeholderTextColor={theme.textMuted}
          value={query}
          onChangeText={setQuery}
          style={[styles.searchInput, { color: theme.text }]}
          clearButtonMode="while-editing"
        />
      </View>
      <CategoryFilterBar selected={category} onSelect={setCategory} />

      {loading && !data ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.accent} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReleaseListItem release={item} />}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: theme.accent, backgroundColor: theme.background }]}>
              {formatDateLabel(section.title)}
            </Text>
          )}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="newspaper-outline" size={40} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Nessuna uscita trovata per questo filtro.
              </Text>
            </View>
          }
          contentContainerStyle={sections.length === 0 ? styles.emptyContainer : { paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

function StatChip({ icon, label, theme }: { icon: keyof typeof Ionicons.glyphMap; label: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.statChip, { backgroundColor: theme.accentSoft }]}>
      <Ionicons name={icon} size={12} color={theme.accent} />
      <Text style={[styles.statChipText, { color: theme.accent }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: "800" },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  statChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statChipText: { fontSize: 12, fontWeight: "700" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  empty: { alignItems: "center", marginTop: 60, gap: 10 },
  emptyText: { textAlign: "center" },
  emptyContainer: { flexGrow: 1 },
});
