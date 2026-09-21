import { useMemo, useState } from "react";
import { View, Text, SectionList, TextInput, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useEdicolaData } from "../../lib/DataContext";
import { CategoryFilterBar } from "../../components/CategoryFilterBar";
import { ReleaseListItem } from "../../components/ReleaseListItem";
import { formatDateLabel, releaseWindowStart } from "../../lib/format";
import type { Category, Release } from "../../lib/types";

export default function CalendarioScreen() {
  const { data, loading, refresh } = useEdicolaData();
  const [category, setCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState("");

  const sections = useMemo(() => {
    if (!data) return [];
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

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, releases]) => ({ title: date, data: releases }));
  }, [data, category, query]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          placeholder="Cerca una collana..."
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          clearButtonMode="while-editing"
        />
      </View>
      <CategoryFilterBar selected={category} onSelect={setCategory} />

      {loading && !data ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReleaseListItem release={item} />}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{formatDateLabel(section.title)}</Text>
          )}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>Nessuna uscita trovata per questo filtro.</Text>
          }
          contentContainerStyle={sections.length === 0 ? styles.emptyContainer : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchBox: { paddingHorizontal: 16, paddingTop: 12 },
  searchInput: {
    backgroundColor: "#F2F2F2",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  sectionHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#2E6F40",
    textTransform: "capitalize",
  },
  empty: { textAlign: "center", marginTop: 40, color: "#888" },
  emptyContainer: { flexGrow: 1 },
});
