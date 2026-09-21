import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { CATEGORY_LABELS, CATEGORY_ORDER, type Category } from "../lib/types";

interface Props {
  selected: Category | null;
  onSelect: (category: Category | null) => void;
}

export function CategoryFilterBar({ selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Chip label="Tutte" active={selected === null} onPress={() => onSelect(null)} />
      {CATEGORY_ORDER.map((category) => (
        <Chip
          key={category}
          label={CATEGORY_LABELS[category]}
          active={selected === category}
          onPress={() => onSelect(category)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#EFEFEF",
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#2E6F40" },
  chipText: { color: "#444", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
});
