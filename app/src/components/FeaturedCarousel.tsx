import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import type { Release } from "../lib/types";
import { CATEGORY_COLORS } from "../lib/theme";
import { useTheme } from "../lib/ThemeContext";
import { formatDateLabel } from "../lib/format";

export function FeaturedCarousel({ releases }: { releases: Release[] }) {
  const theme = useTheme();
  if (releases.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: theme.text }]}>In evidenza</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
      >
        {releases.map((release) => {
          const categoryColor = CATEGORY_COLORS[release.category];
          return (
            <TouchableOpacity
              key={release.id}
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => router.push({ pathname: "/collana/[id]", params: { id: release.seriesId } })}
            >
              <Image
                source={release.imageUrl ?? undefined}
                style={[styles.image, { backgroundColor: theme.surfaceAlt }]}
                contentFit="cover"
                transition={150}
              />
              <View style={[styles.dateBadge, { backgroundColor: categoryColor }]}>
                <Text style={styles.dateBadgeText}>{formatDateLabel(release.releaseDate).split(" ").slice(0, 2).join(" ")}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>
                {release.seriesTitle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 4 },
  title: { fontSize: 13, fontWeight: "800", paddingHorizontal: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 },
  scroll: { flexGrow: 0, flexShrink: 0 },
  row: { paddingHorizontal: 16, gap: 12 },
  card: { width: 104, alignSelf: "flex-start" },
  image: { width: 104, height: 132, borderRadius: 12 },
  dateBadge: { alignSelf: "flex-start", marginTop: 6, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  dateBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff", textTransform: "capitalize" },
  cardTitle: { fontSize: 12, fontWeight: "700", marginTop: 4 },
});
