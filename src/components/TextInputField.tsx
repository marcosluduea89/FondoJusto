import { KeyboardTypeOptions, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../theme/colors";

interface TextInputFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
}

// Campo de texto con etiqueta consistente para formularios de ingresos, gastos y configuracion.
export function TextInputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false
}: TextInputFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  multiline: {
    minHeight: 140,
    textAlignVertical: "top"
  },
  label: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800"
  }
});
