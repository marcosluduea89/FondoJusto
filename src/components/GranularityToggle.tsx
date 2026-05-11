import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export type EvolutionGranularity = "month" | "day";

interface GranularityToggleProps {
  value: EvolutionGranularity;
  onChange: (value: EvolutionGranularity) => void;
}

export function GranularityToggle({ value, onChange }: GranularityToggleProps) {
  return (
    <View style={styles.container}>
      {[
        { label: "M", value: "month" as const },
        { label: "D", value: "day" as const }
      ].map((option) => {
        const isSelected = option.value === value;

        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.button, isSelected && styles.selectedButton]}
          >
            <Text style={[styles.label, isSelected && styles.selectedLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  container: {
    flexDirection: "row",
    gap: 8
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900"
  },
  selectedButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  selectedLabel: {
    color: "#ffffff"
  }
});
