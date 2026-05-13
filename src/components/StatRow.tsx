import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

interface StatRowProps {
  label: string;
  value: string;
  tone?: "default" | "positive" | "warning";
}

// Fila compacta para mostrar totales y subtotales del dashboard.
export function StatRow({ label, value, tone = "default" }: StatRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, tone === "positive" && styles.positive, tone === "warning" && styles.warning]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.softBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingVertical: 4
  },
  label: {
    color: colors.muted,
    flex: 1,
    fontSize: 15
  },
  value: {
    color: colors.text,
    flexShrink: 0,
    fontSize: 16,
    fontWeight: "700"
  },
  positive: {
    color: colors.primaryDark
  },
  warning: {
    color: colors.warning
  }
});
