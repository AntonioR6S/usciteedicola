import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { CATEGORY_LABELS, CATEGORY_ORDER, type Category } from "../lib/types";
import { CATEGORY_COLORS, useTheme } from "../lib/theme";

interface Props {
  selected: Category | null;
  onSelect: (category: Category | null) => void;
}

export function CategoryFilterBar({ selected, onSelect }: Props) {
  const theme = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Chip
        label="Tutte"
        color={theme.accent}
        active={selected === null}
        onPress={() => onSelect(null)}
      />
      {CATEGORY_ORDER.map((category) => (
        <Chip
          key={category}
          label={CATEGORY_LABELS[category]}
          color={CATEGORY_COLORS[category]}
          active={selected === category}
          onPress={() => onSelect(category)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: active ? color : theme.surfaceAlt, borderColor: active ? color : "transparent" },
      ]}
      onPress={onPress}
    >
      {!active && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={[styles.chipText, { color: active ? "#fff" : theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  chipText: { fontWeight: "600", fontSize: 13 },
});
