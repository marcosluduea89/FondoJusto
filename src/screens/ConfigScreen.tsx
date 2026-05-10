import { Alert } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { MonthSelector } from "../components/MonthSelector";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TextInputField } from "../components/TextInputField";
import { useAppDataContext } from "../hooks/AppDataContext";
import { getMonthlyConfig } from "../services/finance";
import { parseAmountInput } from "../utils/currency";
import { isValidMonthKey, validateMonthlyPercentages } from "../utils/validation";

// Pantalla para ajustar porcentajes mensuales sin tocar las reglas de calculo.
export function ConfigScreen() {
  const {
    data,
    isLoading,
    saveMonthlyConfig,
    saveAppSettings,
    selectedMonth,
    setSelectedMonth,
    updatePersonNames
  } = useAppDataContext();

  const config = useMemo(
    () => (data ? getMonthlyConfig(data.monthlyConfigs, selectedMonth) : null),
    [data, selectedMonth]
  );
  const [investmentPercentage, setInvestmentPercentage] = useState("10");
  const [personalPercentageMarcos, setPersonalPercentageMarcos] = useState("5");
  const [personalPercentageWife, setPersonalPercentageWife] = useState("5");
  const [marcosName, setMarcosName] = useState("Marcos");
  const [wifeName, setWifeName] = useState("Esposa");
  const [closeDay, setCloseDay] = useState("5");

  useEffect(() => {
    if (!config) return;

    setInvestmentPercentage(String(config.investmentPercentage));
    setPersonalPercentageMarcos(String(config.personalPercentageMarcos));
    setPersonalPercentageWife(String(config.personalPercentageWife));
  }, [config]);

  useEffect(() => {
    if (!data) return;
    setCloseDay(String(data.appSettings?.closeDay ?? 5));
  }, [data?.appSettings, data]);

  useEffect(() => {
    const marcos = data?.people.find((person) => person.id === "marcos");
    const wife = data?.people.find((person) => person.id === "wife");

    setMarcosName(marcos?.name ?? "Marcos");
    setWifeName(wife?.name ?? "Esposa");
  }, [data?.people]);

  const saveConfig = async () => {
    const nextInvestment = parseAmountInput(investmentPercentage || String(config?.investmentPercentage ?? 0));
    const nextMarcos = parseAmountInput(personalPercentageMarcos || String(config?.personalPercentageMarcos ?? 0));
    const nextWife = parseAmountInput(personalPercentageWife || String(config?.personalPercentageWife ?? 0));
    const nextCloseDay = Number(closeDay);
    const validationError = validateMonthlyPercentages(nextInvestment, nextMarcos, nextWife);

    if (!isValidMonthKey(selectedMonth)) {
      Alert.alert("Mes invalido", "Usa el formato YYYY-MM, por ejemplo 2026-05.");
      return;
    }

    if (validationError) {
      Alert.alert("Porcentaje invalido", validationError);
      return;
    }

    if (!Number.isInteger(nextCloseDay) || nextCloseDay < 1 || nextCloseDay > 31) {
      Alert.alert("Dia de cierre invalido", "Ingresa un numero entre 1 y 31.");
      return;
    }

    await saveMonthlyConfig({
      month: selectedMonth,
      investmentPercentage: nextInvestment,
      personalPercentageMarcos: nextMarcos,
      personalPercentageWife: nextWife
    });

    await saveAppSettings(nextCloseDay);

    Alert.alert(
      "Configuracion guardada",
      "Los porcentajes y el dia de cierre se usaran en el dashboard y en el cierre automatico."
    );
  };

  const loadCurrentConfig = () => {
    if (!config || !data) return;

    setInvestmentPercentage(String(config.investmentPercentage));
    setPersonalPercentageMarcos(String(config.personalPercentageMarcos));
    setPersonalPercentageWife(String(config.personalPercentageWife));
    setCloseDay(String(data.appSettings?.closeDay ?? 5));
  };

  const savePeople = async () => {
    if (!marcosName.trim() || !wifeName.trim()) {
      Alert.alert("Nombre invalido", "Los nombres no pueden quedar vacios.");
      return;
    }

    await updatePersonNames({ marcos: marcosName, wife: wifeName });
    Alert.alert("Personas guardadas", "Los nombres se actualizaron en toda la app.");
  };

  return (
    <Screen isLoading={isLoading} title="Configuracion mensual">
      <Card>
        <TextInputField label="Persona 1" onChangeText={setMarcosName} placeholder="Marcos" value={marcosName} />
        <TextInputField label="Persona 2" onChangeText={setWifeName} placeholder="Esposa" value={wifeName} />
        <PrimaryButton label="Guardar personas" onPress={savePeople} />
      </Card>

      <Card>
        <MonthSelector label="Mes" onChange={setSelectedMonth} value={selectedMonth} />
        <TextInputField
          keyboardType="numeric"
          label="Porcentaje inversion"
          onChangeText={setInvestmentPercentage}
          placeholder="10"
          value={investmentPercentage}
        />
        <TextInputField
          keyboardType="numeric"
          label={`Porcentaje personal ${marcosName || "Persona 1"}`}
          onChangeText={setPersonalPercentageMarcos}
          placeholder="5"
          value={personalPercentageMarcos}
        />
        <TextInputField
          keyboardType="numeric"
          label={`Porcentaje personal ${wifeName || "Persona 2"}`}
          onChangeText={setPersonalPercentageWife}
          placeholder="5"
          value={personalPercentageWife}
        />
        <TextInputField
          keyboardType="numeric"
          label="Dia de cierre"
          onChangeText={setCloseDay}
          placeholder="5"
          value={closeDay}
        />
        <PrimaryButton label="Cargar valores guardados" onPress={loadCurrentConfig} variant="secondary" />
        <PrimaryButton label="Guardar configuracion" onPress={saveConfig} />
      </Card>
    </Screen>
  );
}
