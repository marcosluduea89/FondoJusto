import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { isFutureMonth } from "../utils/dates";

interface MonthSelectorProps {
  label: string;
  value: string;
  onChange: (month: string) => void;
}

const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic"
];

const FULL_MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

function getYearFromMonth(month: string): number {
  const parsedYear = Number(month.slice(0, 4));

  return Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : new Date().getFullYear();
}

function buildMonthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function getMonthName(month: string): string {
  const monthIndex = Number(month.slice(5, 7)) - 1;

  return FULL_MONTHS[monthIndex] ?? month;
}

// Selector visual de mes: evita escribir YYYY-MM a mano y mantiene la clave interna estable.
export function MonthSelector({ label, value, onChange }: MonthSelectorProps) {
  const [visibleYear, setVisibleYear] = useState(getYearFromMonth(value));
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setVisibleYear(getYearFromMonth(value));
  }, [value]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setIsExpanded((currentValue) => !currentValue)}
        style={styles.summaryButton}
      >
        <Text style={styles.summaryText}>{getMonthName(value)}</Text>
        <Text style={styles.summaryIcon}>{isExpanded ? "^" : "v"}</Text>
      </Pressable>

      {isExpanded && (
        <View style={styles.panel}>
          <View style={styles.yearRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setVisibleYear((year) => year - 1)}
              style={styles.yearButton}
            >
              <Text style={styles.yearButtonText}>{"<"}</Text>
            </Pressable>
            <Text style={styles.year}>{visibleYear}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setVisibleYear((year) => year + 1)}
              style={styles.yearButton}
            >
              <Text style={styles.yearButtonText}>{">"}</Text>
            </Pressable>
          </View>
          <View style={styles.monthGrid}>
            {MONTHS.map((monthLabel, index) => {
              const monthKey = buildMonthKey(visibleYear, index);
              const isSelected = monthKey === value;
              const isDisabled = isFutureMonth(monthKey);

              return (
                <Pressable
                  accessibilityRole="button"
                  key={monthKey}
                  onPress={() => {
                    if (isDisabled) return;

                    onChange(monthKey);
                    setIsExpanded(false);
                  }}
                  style={[
                    styles.monthButton,
                    isSelected && styles.selectedMonthButton,
                    isDisabled && styles.disabledMonthButton
                  ]}
                >
                  <Text
                    style={[
                      styles.monthText,
                      isSelected && styles.selectedMonthText,
                      isDisabled && styles.disabledMonthText
                    ]}
                  >
                    {monthLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  disabledMonthButton: {
    backgroundColor: "#f1f1f1",
    borderColor: "#e1e1e1",
    opacity: 0.55
  },
  disabledMonthText: {
    color: "#a0a7a2"
  },
  monthButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "22%",
    flexGrow: 1,
    paddingVertical: 10
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  monthText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800"
  },
  panel: {
    gap: 10
  },
  selectedMonthButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  selectedMonthText: {
    color: "#ffffff"
  },
  summaryButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 13
  },
  summaryIcon: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: "900"
  },
  summaryText: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  year: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  yearButton: {
    alignItems: "center",
    backgroundColor: colors.softGreen,
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 48
  },
  yearButtonText: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: "900"
  },
  yearRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});
