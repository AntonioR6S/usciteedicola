import { useMemo, useState } from "react";
import {
  View,
  Text,
  SectionList,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEdicolaData } from "../../lib/DataContext";
import { AppHeader } from "../../components/AppHeader";
import { CategoryFilterBar } from "../../components/CategoryFilterBar";
import { FeaturedCarousel } from "../../components/FeaturedCarousel";
import { ReleaseListItem } from "../../components/ReleaseListItem";
import { formatDateLabel, releaseWindowStart } from "../../lib/format";
import { useTheme } from "../../lib/ThemeContext";
import type { Category, Release } from "../../lib/types";

type SortMode = "date" | "price" | "name";
const SORT_OPTIONS: { mode: SortMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: "date", label: "Data", icon: "calendar-outline" },
  { mode: "price", label: "Prezzo", icon: "pricetag-outline" },
  { mode: "name", label: "Nome", icon: "text-outline" },
];

export default function CalendarioScreen() {
  const { data, effectiveFollowedIds, loading, refresh } = useEdicolaData();
  const theme = useTheme();
  const [category, setCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("date");

  const featured = useMemo(() => {
    if (!data) return [];
    const windowStart = releaseWindowStart();
    const seen = new Set<string>();
    const upcoming = [...data.releases]
      .filter((r) => new Date(r.releaseDate) >= windowStart)
      .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
    const result: Release[] = [];
    for (const r of upcoming) {
      if (seen.has(r.seriesId)) continue;
      seen.add(r.seriesId);
      result.push(r);
      if (result.length === 8) break;
    }
    return result;
  }, [data]);

  const showFeatured = !category && !query.trim();

  const { filtered, sections } = useMemo(() => {
    if (!data) return { filtered: [] as Release[], sections: [] as { title: string; data: Release[] }[] };
    const windowStart = releaseWindowStart();
    const q = query.trim().toLowerCase();

    const filtered = data.releases.filter((r) => {
      if (new Date(r.releaseDate) < windowStart) return false;
      if (category && r.category !== category) return false;
      if (q) {
        const matchesTitle = r.seriesTitle.toLowerCase().includes(q);
        const matchesPublisher = r.publisher?.toLowerCase().includes(q) ?? false;
        if (!matchesTitle && !matchesPublisher) return false;
      }
      return true;
    });

    if (sort === "date") {
      const byDate = new Map<string, Release[]>();
      for (const release of filtered) {
        const list = byDate.get(release.releaseDate) ?? [];
        list.push(release);
        byDate.set(release.releaseDate, list);
      }
      const sections = Array.from(byDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, releases]) => ({ title: date, data: releases }));
      return { filtered, sections };
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "price") return (a.price ?? Infinity) - (b.price ?? Infinity);
      return a.seriesTitle.localeCompare(b.seriesTitle);
    });
    return { filtered, sections: [{ title: "", data: sorted }] };
  }, [data, category, query, sort]);

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <AppHeader />
        <Text style={[styles.title, { color: theme.text }]}>Calendario</Text>
        <View style={styles.statsRow}>
          <StatChip icon="albums" label={`${filtered.length} uscite`} theme={theme} />
          <StatChip icon="star" label={`${effectiveFollowedIds.length} seguite`} theme={theme} />
        </View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: theme.surfaceAlt }]}>
        <Ionicons name="search" size={16} color={theme.textMuted} />
        <TextInput
          placeholder="Cerca per collana o editore..."
          placeholderTextColor={theme.textMuted}
          value={query}
          onChangeText={setQuery}
          style={[styles.searchInput, { color: theme.text }]}
          clearButtonMode="while-editing"
        />
      </View>
      <CategoryFilterBar selected={category} onSelect={setCategory} />

      <View style={styles.sortRow}>
        <Text style={[styles.sortLabel, { color: theme.textMuted }]}>Ordina per</Text>
        {SORT_OPTIONS.map((opt) => {
          const active = sort === opt.mode;
          return (
            <TouchableOpacity
              key={opt.mode}
              style={[
                styles.sortChip,
                { backgroundColor: active ? theme.accent : theme.surfaceAlt },
              ]}
              onPress={() => setSort(opt.mode)}
            >
              <Ionicons name={opt.icon} size={13} color={active ? "#fff" : theme.textMuted} />
              <Text style={[styles.sortChipText, { color: active ? "#fff" : theme.textMuted }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && !data ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.accent} />
      ) : sort === "date" ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReleaseListItem release={item} />}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: theme.accent, backgroundColor: theme.background }]}>
              {formatDateLabel(section.title)}
            </Text>
          )}
          ListHeaderComponent={showFeatured ? <FeaturedCarousel releases={featured} /> : null}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.accent} />}
          ListEmptyComponent={<EmptyState theme={theme} />}
          contentContainerStyle={sections.length === 0 ? styles.emptyContainer : { paddingBottom: 24 }}
        />
      ) : (
        <FlatList
          data={sections[0]?.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReleaseListItem release={item} />}
          ListHeaderComponent={showFeatured ? <FeaturedCarousel releases={featured} /> : null}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.accent} />}
          ListEmptyComponent={<EmptyState theme={theme} />}
          contentContainerStyle={
            (sections[0]?.data.length ?? 0) === 0 ? styles.emptyContainer : { paddingTop: 12, paddingBottom: 24 }
          }
        />
      )}
    </SafeAreaView>
  );
}

function EmptyState({ theme }: { theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="newspaper-outline" size={40} color={theme.textMuted} />
      <Text style={[styles.emptyText, { color: theme.textMuted }]}>Nessuna uscita trovata per questo filtro.</Text>
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
  headerRow: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4 },
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
  sortRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingTop: 10 },
  sortLabel: { fontSize: 12, fontWeight: "600", marginRight: 2 },
  sortChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  sortChipText: { fontSize: 12, fontWeight: "700" },
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
