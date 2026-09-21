import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode, type ThemeMode } from "../../lib/ThemeContext";
import { useEdicolaData } from "../../lib/DataContext";
import { AppHeader } from "../../components/AppHeader";
import { NOTIFICATION_LEAD_OPTIONS } from "../../lib/notifications";

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: "system", label: "Usa il tema dello smartphone", icon: "phone-portrait-outline" },
  { mode: "light", label: "Chiaro", icon: "sunny-outline" },
  { mode: "dark", label: "Scuro", icon: "moon-outline" },
];

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ImpostazioniScreen() {
  const { mode, setMode, theme } = useThemeMode();
  const { leadDays, setLeadDays, data, refresh, loading } = useEdicolaData();

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      <AppHeader />
      <Text style={[styles.title, { color: theme.text }]}>Impostazioni</Text>

      <Section title="Aspetto" theme={theme}>
        {THEME_OPTIONS.map((opt, i) => (
          <OptionRow
            key={opt.mode}
            icon={opt.icon}
            label={opt.label}
            selected={mode === opt.mode}
            isLast={i === THEME_OPTIONS.length - 1}
            theme={theme}
            onPress={() => setMode(opt.mode)}
          />
        ))}
      </Section>

      <Section title="Notifiche" subtitle="Quando avvisarti per le collane seguite" theme={theme}>
        {NOTIFICATION_LEAD_OPTIONS.map((opt, i) => (
          <OptionRow
            key={opt.days}
            icon="notifications-outline"
            label={opt.label}
            selected={leadDays === opt.days}
            isLast={i === NOTIFICATION_LEAD_OPTIONS.length - 1}
            theme={theme}
            onPress={() => setLeadDays(opt.days)}
          />
        ))}
      </Section>

      <Section title="Informazioni" theme={theme}>
        <TouchableOpacity style={[styles.linkRow, styles.rowBorder, { borderColor: theme.border }]} onPress={refresh}>
          <Ionicons name={loading ? "sync" : "refresh-outline"} size={18} color={theme.textMuted} />
          <Text style={[styles.linkText, { color: theme.textMuted, flex: 1 }]}>
            {data ? `Dati aggiornati il ${formatUpdatedAt(data.generatedAt)}` : "Aggiornamento in corso..."}
          </Text>
          <Text style={[styles.refreshHint, { color: theme.accent }]}>Aggiorna</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Linking.openURL("https://github.com/AntonioR6S/usciteedicola")}
        >
          <Ionicons name="logo-github" size={18} color={theme.textMuted} />
          <Text style={[styles.linkText, { color: theme.textMuted }]}>Codice sorgente su GitHub</Text>
        </TouchableOpacity>
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  subtitle,
  theme,
  children,
}: {
  title: string;
  subtitle?: string;
  theme: ReturnType<typeof useThemeMode>["theme"];
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{title.toUpperCase()}</Text>
      {subtitle && <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>{subtitle}</Text>}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>{children}</View>
    </View>
  );
}

function OptionRow({
  icon,
  label,
  selected,
  isLast,
  theme,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  selected: boolean;
  isLast?: boolean;
  theme: ReturnType<typeof useThemeMode>["theme"];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.optionRow, { borderColor: theme.border, borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={selected ? theme.accent : theme.textMuted} />
      <Text style={[styles.optionLabel, { color: theme.text }]}>{label}</Text>
      {selected && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 6, marginLeft: 4 },
  sectionSubtitle: { fontSize: 12, marginBottom: 8, marginLeft: 4 },
  card: { borderRadius: 14, overflow: "hidden" },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  linkText: { fontSize: 14, fontWeight: "500" },
  refreshHint: { fontSize: 12, fontWeight: "700" },
});
