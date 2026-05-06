import { Alert } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TextInputField } from "../components/TextInputField";
import { useAppDataContext } from "../hooks/AppDataContext";
import { getMonthlyConfig } from "../services/finance";
import { parseAmountInput } from "../utils/currency";
import { isValidMonthKey, validateMonthlyPercentages } from "../utils/validation";

// Pantalla para ajustar porcentajes mensuales sin tocar las reglas de calculo.
export function ConfigScreen() {
  const { data, isLoading, saveMonthlyConfig, selectedMonth, setSelectedMonth } = useAppDataContext();

  const config = useMemo(
    () => (data ? getMonthlyConfig(data.monthlyConfigs, selectedMonth) : null),
    [data, selectedMonth]
  );
  const [investmentPercentage, setInvestmentPercentage] = useState("10");
  const [personalPercentageMarcos, setPersonalPercentageMarcos] = useState("5");
  const [personalPercentageWife, setPersonalPercentageWife] = useState("5");

  useEffect(() => {
    if (!config) return;

    setInvestmentPercentage(String(config.investmentPercentage));
    setPersonalPercentageMarcos(String(config.personalPercentageMarcos));
    setPersonalPercentageWife(String(config.personalPercentageWife));
  }, [config]);

  const saveConfig = async () => {
    const nextInvestment = parseAmountInput(investmentPercentage || String(config?.investmentPercentage ?? 0));
    const nextMarcos = parseAmountInput(personalPercentageMarcos || String(config?.personalPercentageMarcos ?? 0));
    const nextWife = parseAmountInput(personalPercentageWife || String(config?.personalPercentageWife ?? 0));
    const validationError = validateMonthlyPercentages(nextInvestment, nextMarcos, nextWife);

    if (!isValidMonthKey(selectedMonth)) {
      Alert.alert("Mes invalido", "Usa el formato YYYY-MM, por ejemplo 2026-05.");
      return;
    }

    if (validationError) {
      Alert.alert("Porcentaje invalido", validationError);
      return;
    }

    await saveMonthlyConfig({
      month: selectedMonth,
      investmentPercentage: nextInvestment,
      personalPercentageMarcos: nextMarcos,
      personalPercentageWife: nextWife
    });

    Alert.alert("Configuracion guardada", "Los porcentajes se usaran en el dashboard y el cierre.");
  };

  const loadCurrentConfig = () => {
    if (!config) return;

    setInvestmentPercentage(String(config.investmentPercentage));
    setPersonalPercentageMarcos(String(config.personalPercentageMarcos));
    setPersonalPercentageWife(String(config.personalPercentageWife));
  };

  return (
    <Screen isLoading={isLoading} title="Configuracion mensual">
      <Card>
        <TextInputField label="Mes" onChangeText={setSelectedMonth} placeholder="YYYY-MM" value={selectedMonth} />
        <TextInputField
          keyboardType="numeric"
          label="Porcentaje inversion"
          onChangeText={setInvestmentPercentage}
          placeholder="10"
          value={investmentPercentage}
        />
        <TextInputField
          keyboardType="numeric"
          label="Porcentaje personal Marcos"
          onChangeText={setPersonalPercentageMarcos}
          placeholder="5"
          value={personalPercentageMarcos}
        />
        <TextInputField
          keyboardType="numeric"
          label="Porcentaje personal esposa"
          onChangeText={setPersonalPercentageWife}
          placeholder="5"
          value={personalPercentageWife}
        />
        <PrimaryButton label="Cargar valores guardados" onPress={loadCurrentConfig} variant="secondary" />
        <PrimaryButton label="Guardar configuracion" onPress={saveConfig} />
      </Card>
    </Screen>
  );
}
