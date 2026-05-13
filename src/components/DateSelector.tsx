import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

interface DateSelectorProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
}

const WEEK_DAYS = ["L", "M", "M", "J", "V", "S", "D"];

function parseDateKey(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date();
  }

  return new Date(year, month - 1, day);
}

function buildDateKey(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDateLabel(date: string): string {
  const parsedDate = parseDateKey(date);

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(parsedDate);
}

function formatVisibleMonth(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function getMondayBasedStartOffset(year: number, monthIndex: number): number {
  const nativeDay = new Date(year, monthIndex, 1).getDay();

  return nativeDay === 0 ? 6 : nativeDay - 1;
}

export function DateSelector({ label, value, onChange }: DateSelectorProps) {
  const selectedDate = parseDateKey(value);
  const [visibleDate, setVisibleDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleYear = visibleDate.getFullYear();
  const visibleMonth = visibleDate.getMonth();
  const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();
  const startOffset = getMondayBasedStartOffset(visibleYear, visibleMonth);
  const calendarCells = [
    ...Array.from({ length: startOffset }, (_, index) => ({ key: `empty-${index}`, day: null })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, day: index + 1 }))
  ];

  useEffect(() => {
    const nextSelectedDate = parseDateKey(value);
    setVisibleDate(new Date(nextSelectedDate.getFullYear(), nextSelectedDate.getMonth(), 1));
  }, [value]);

  const changeMonth = (offset: number) => {
    setVisibleDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setIsExpanded((currentValue) => !currentValue)}
        style={styles.summaryButton}
      >
        <Text style={styles.summaryText}>{formatDateLabel(value)}</Text>
        <Text style={styles.summaryIcon}>{isExpanded ? "^" : "v"}</Text>
      </Pressable>

      {isExpanded && (
        <View style={styles.panel}>
          <View style={styles.monthRow}>
            <Pressable accessibilityRole="button" onPress={() => changeMonth(-1)} style={styles.monthButton}>
              <Text style={styles.monthButtonText}>{"<"}</Text>
            </Pressable>
            <Text style={styles.monthTitle}>{formatVisibleMonth(visibleDate)}</Text>
            <Pressable accessibilityRole="button" onPress={() => changeMonth(1)} style={styles.monthButton}>
              <Text style={styles.monthButtonText}>{">"}</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEK_DAYS.map((dayLabel, index) => (
              <Text key={`${dayLabel}-${index}`} style={styles.weekDay}>
                {dayLabel}
              </Text>
            ))}
          </View>

          <View style={styles.dayGrid}>
            {calendarCells.map((cell) => {
              if (!cell.day) return <View key={cell.key} style={styles.emptyDay} />;

              const dateKey = buildDateKey(visibleYear, visibleMonth, cell.day);
              const isSelected = dateKey === value;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={cell.key}
                  onPress={() => {
                    onChange(dateKey);
                    setIsExpanded(false);
                  }}
                  style={[styles.dayButton, isSelected && styles.selectedDayButton]}
                >
                  <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{cell.day}</Text>
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
    gap: 8
  },
  dayButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: "13%"
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  dayText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  emptyDay: {
    height: 42,
    width: "13%"
  },
  label: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800"
  },
  monthButton: {
    alignItems: "center",
    backgroundColor: colors.softGreen,
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 48
  },
  monthButtonText: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: "900"
  },
  monthRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  monthTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "capitalize"
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.softBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 12
  },
  selectedDayButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  selectedDayText: {
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
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12
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
  weekDay: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center"
  },
  weekRow: {
    flexDirection: "row",
    gap: 6
  }
});
