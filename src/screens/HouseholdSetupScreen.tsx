import { Alert, StyleSheet, Text } from "react-native";
import { useState } from "react";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TextInputField } from "../components/TextInputField";
import { useHouseholdContext } from "../hooks/HouseholdContext";
import { colors } from "../theme/colors";

export function HouseholdSetupScreen() {
  const { createHousehold, isLoading } = useHouseholdContext();
  const [name, setName] = useState("FondoJusto familiar");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert("Nombre invalido", "Ingresa un nombre para el hogar.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createHousehold(name);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "No se pudo crear el hogar.";
      Alert.alert("Supabase", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen isLoading={isLoading} title="Hogar">
      <Card>
        <Text style={styles.title}>Crear hogar compartido</Text>
        <Text style={styles.copy}>
          Este hogar va a agrupar los ingresos, gastos, objetivos y cierres para que despues puedan verlos dos celulares.
        </Text>
        <TextInputField label="Nombre del hogar" onChangeText={setName} placeholder="Ej: Casa Marcos" value={name} />
        <PrimaryButton label={isSubmitting ? "Creando..." : "Crear hogar"} onPress={submit} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  }
});
