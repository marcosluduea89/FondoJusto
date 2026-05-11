import { Alert, StyleSheet, Text } from "react-native";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { MonthSelector } from "../components/MonthSelector";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { TextInputField } from "../components/TextInputField";
import { useAppDataContext } from "../hooks/AppDataContext";
import { Goal } from "../models";
import { DEFAULT_GOALS } from "../models/goal";
import { getMonthlyConfig } from "../services/finance";
import { formatAmountInput, parseAmountInput } from "../utils/currency";
import { colors } from "../theme/colors";
import { isValidMonthKey, validateMonthlyPercentages } from "../utils/validation";

// Pantalla para ajustar porcentajes mensuales sin tocar las reglas de calculo.
export function ConfigScreen() {
  const {
    data,
    isLoading,
    saveMonthlyConfig,
    saveAppSettings,
    saveGoals,
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
  const [closeDay, setCloseDay] = useState("31");
  const [discountPersonalOverages, setDiscountPersonalOverages] = useState<"yes" | "no">("yes");
  const [goalInputs, setGoalInputs] = useState(
    DEFAULT_GOALS.map((goal) => ({
      id: goal.id,
      name: goal.name,
      currentAmount: "",
      targetAmount: ""
    }))
  );

  useEffect(() => {
    if (!config) return;

    setInvestmentPercentage(String(config.investmentPercentage));
    setPersonalPercentageMarcos(String(config.personalPercentageMarcos));
    setPersonalPercentageWife(String(config.personalPercentageWife));
  }, [config]);

  useEffect(() => {
    if (!data) return;
    setCloseDay(String(data.appSettings?.closeDay ?? 31));
    setDiscountPersonalOverages(data.appSettings?.discountPersonalOverages ?? true ? "yes" : "no");
    setGoalInputs(
      data.goals.map((goal) => ({
        id: goal.id,
        name: goal.name,
        currentAmount: goal.currentAmount ? formatAmountInput(String(goal.currentAmount)) : "",
        targetAmount: goal.targetAmount ? formatAmountInput(String(goal.targetAmount)) : ""
      }))
    );
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
    const nextGoals: Goal[] = goalInputs.map((goalInput) => ({
      id: goalInput.id,
      name: goalInput.name.trim(),
      currentAmount: parseAmountInput(goalInput.currentAmount),
      targetAmount: parseAmountInput(goalInput.targetAmount)
    }));
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

    if (nextGoals.some((goal) => goal.currentAmount < 0 || goal.targetAmount < 0)) {
      Alert.alert("Objetivo invalido", "Los montos de objetivos no pueden ser negativos.");
      return;
    }

    await saveMonthlyConfig({
      month: selectedMonth,
      investmentPercentage: nextInvestment,
      personalPercentageMarcos: nextMarcos,
      personalPercentageWife: nextWife
    });

    await saveAppSettings(nextCloseDay, discountPersonalOverages === "yes");
    await saveGoals(nextGoals);

    Alert.alert(
      "Configuracion guardada",
      "Los porcentajes, objetivos y el dia de cierre se usaran en el dashboard."
    );
  };

  const loadCurrentConfig = () => {
    if (!config || !data) return;

    setInvestmentPercentage(String(config.investmentPercentage));
    setPersonalPercentageMarcos(String(config.personalPercentageMarcos));
    setPersonalPercentageWife(String(config.personalPercentageWife));
    setCloseDay(String(data.appSettings?.closeDay ?? 31));
    setDiscountPersonalOverages(data.appSettings?.discountPersonalOverages ?? true ? "yes" : "no");
    setGoalInputs(
      data.goals.map((goal) => ({
        id: goal.id,
        name: goal.name,
        currentAmount: goal.currentAmount ? formatAmountInput(String(goal.currentAmount)) : "",
        targetAmount: goal.targetAmount ? formatAmountInput(String(goal.targetAmount)) : ""
      }))
    );
  };

  const updateGoalInput = (
    goalId: string,
    field: "name" | "currentAmount" | "targetAmount",
    value: string
  ) => {
    setGoalInputs((currentGoals) =>
      currentGoals.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              [field]: field === "name" ? value : formatAmountInput(value)
            }
          : goal
      )
    );
  };

  const changeDiscountPersonalOverages = (nextValue: "yes" | "no") => {
    if (nextValue === "no") {
      Alert.alert(
        "No descontar excesos",
        "Al quitar el descuento automatico de excesos personales se podria generar desequilibrio en las cuentas familiares.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "No descontar", onPress: () => setDiscountPersonalOverages("no") }
        ]
      );
      return;
    }

    setDiscountPersonalOverages("yes");
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
          placeholder="31"
          value={closeDay}
        />
        <SegmentedControl
          label="Descontar excesos personales al mes siguiente"
          onChange={changeDiscountPersonalOverages}
          options={[
            { label: "Si", value: "yes" },
            { label: "No", value: "no" }
          ]}
          value={discountPersonalOverages}
        />
        <PrimaryButton label="Cargar valores guardados" onPress={loadCurrentConfig} variant="secondary" />
        <PrimaryButton label="Guardar configuracion" onPress={saveConfig} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Objetivos</Text>
        {goalInputs.map((goal, index) => (
          <Fragment key={goal.id}>
            <Text style={styles.goalTitle}>Objetivo {index + 1}</Text>
            <TextInputField
              label="Nombre"
              onChangeText={(value) => updateGoalInput(goal.id, "name", value)}
              placeholder={DEFAULT_GOALS[index]?.name ?? "Objetivo"}
              value={goal.name}
            />
            <TextInputField
              keyboardType="numeric"
              label="Monto actual"
              onChangeText={(value) => updateGoalInput(goal.id, "currentAmount", value)}
              placeholder="Ej: 150.000"
              value={goal.currentAmount}
            />
            <TextInputField
              keyboardType="numeric"
              label="Monto meta"
              onChangeText={(value) => updateGoalInput(goal.id, "targetAmount", value)}
              placeholder="Ej: 1.000.000"
              value={goal.targetAmount}
            />
          </Fragment>
        ))}
        <PrimaryButton label="Guardar objetivos" onPress={saveConfig} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  goalTitle: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  }
});
