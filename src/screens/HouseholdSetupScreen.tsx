import { Alert, StyleSheet, Text } from "react-native";
import { useState } from "react";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { TextInputField } from "../components/TextInputField";
import { useHouseholdContext } from "../hooks/HouseholdContext";
import { colors } from "../theme/colors";

type SetupMode = "create" | "join";

export function HouseholdSetupScreen() {
  const { createHousehold, isLoading, joinHousehold } = useHouseholdContext();
  const [mode, setMode] = useState<SetupMode>("create");
  const [name, setName] = useState("FondoJusto familiar");
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCreateMode = mode === "create";

  const submit = async () => {
    if (isCreateMode && !name.trim()) {
      Alert.alert("Nombre invalido", "Ingresa un nombre para el hogar.");
      return;
    }

    if (!isCreateMode && !inviteCode.trim()) {
      Alert.alert("Codigo invalido", "Ingresa el codigo de invitacion.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreateMode) {
        await createHousehold(name);
      } else {
        await joinHousehold(inviteCode);
      }
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
        <Text style={styles.title}>{isCreateMode ? "Crear hogar compartido" : "Unirme a un hogar"}</Text>
        <Text style={styles.copy}>
          {isCreateMode
            ? "Este hogar va a agrupar los ingresos, gastos, objetivos y cierres para que despues puedan verlos dos celulares."
            : "Ingresa el codigo que genero la otra persona desde Ajustes."}
        </Text>
        <SegmentedControl
          onChange={setMode}
          options={[
            { label: "Crear", value: "create" },
            { label: "Unirme", value: "join" }
          ]}
          value={mode}
        />
        {isCreateMode ? (
          <TextInputField label="Nombre del hogar" onChangeText={setName} placeholder="Ej: Casa Marcos" value={name} />
        ) : (
          <TextInputField
            autoCapitalize="characters"
            autoCorrect={false}
            label="Codigo de invitacion"
            onChangeText={setInviteCode}
            placeholder="ABCD-1234"
            value={inviteCode}
          />
        )}
        <PrimaryButton
          label={isSubmitting ? "Procesando..." : isCreateMode ? "Crear hogar" : "Unirme al hogar"}
          onPress={submit}
        />
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
