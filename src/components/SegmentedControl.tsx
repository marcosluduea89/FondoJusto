import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

interface Option<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

// Selector simple sin dependencias nativas adicionales; ideal para pocas opciones.
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <Pressable
              accessibilityRole="button"
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.option, isSelected && styles.selectedOption]}
            >
              <Text style={[styles.optionLabel, isSelected && styles.selectedLabel]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  option: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  optionLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700"
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  selectedLabel: {
    color: "#ffffff"
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  }
});
