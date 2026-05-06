import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme/colors";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
}

// Boton tactil reutilizable con variantes para acciones principales y secundarias.
export function PrimaryButton({ label, onPress, variant = "primary" }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.danger,
        pressed && styles.pressed
      ]}
    >
      <Text style={[styles.label, variant === "secondary" && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 13
  },
  danger: {
    backgroundColor: colors.danger
  },
  label: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800"
  },
  pressed: {
    opacity: 0.78
  },
  secondary: {
    backgroundColor: colors.softGreen,
    borderColor: colors.primary,
    borderWidth: 1
  },
  secondaryLabel: {
    color: colors.primaryDark
  }
});
