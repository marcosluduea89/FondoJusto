import { Alert, StyleSheet, Text } from "react-native";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { MonthSelector } from "../components/MonthSelector";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { StatRow } from "../components/StatRow";
import { TextInputField } from "../components/TextInputField";
import { useAppDataContext } from "../hooks/AppDataContext";
import { useAuthContext } from "../hooks/AuthContext";
import { useHouseholdContext } from "../hooks/HouseholdContext";
import { Goal } from "../models";
import { DEFAULT_GOALS } from "../models/goal";
import { getMonthlyConfig } from "../services/finance";
import { formatAmountInput, formatARS, parseAmountInput } from "../utils/currency";
import { colors } from "../theme/colors";
import {
  isValidMonthKey,
  validateGoalAllocationPercentages,
  validateMonthlyPercentages
} from "../utils/validation";

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
  const { signOut, user } = useAuthContext();
  const { household } = useHouseholdContext();

  const config = useMemo(
    () => (data ? getMonthlyConfig(data.monthlyConfigs, selectedMonth) : null),
    [data, selectedMonth]
  );
  const [investmentPercentage, setInvestmentPercentage] = useState("10");
  const [goalsPercentage, setGoalsPercentage] = useState("0");
  const [personalPercentageMarcos, setPersonalPercentageMarcos] = useState("5");
  const [personalPercentageWife, setPersonalPercentageWife] = useState("5");
  const [marcosName, setMarcosName] = useState("Marcos");
  const [wifeName, setWifeName] = useState("Esposa");
  const [closeDay, setCloseDay] = useState("31");
  const [estimatedMonthlyIncome, setEstimatedMonthlyIncome] = useState("");
  const [basicBasketAmount, setBasicBasketAmount] = useState("1.370.000");
  const [discountPersonalOverages, setDiscountPersonalOverages] = useState<"yes" | "no">("yes");
  const [goalInputs, setGoalInputs] = useState(
    DEFAULT_GOALS.map((goal) => ({
      id: goal.id,
      name: goal.name,
      currentAmount: "",
      targetAmount: "",
      allocationPercentage: String(goal.allocationPercentage)
    }))
  );

  useEffect(() => {
    if (!config) return;

    setInvestmentPercentage(String(config.investmentPercentage));
    setGoalsPercentage(String(config.goalsPercentage));
    setPersonalPercentageMarcos(String(config.personalPercentageMarcos));
    setPersonalPercentageWife(String(config.personalPercentageWife));
  }, [config]);

  useEffect(() => {
    if (!data) return;
    setCloseDay(String(data.appSettings?.closeDay ?? 31));
    setEstimatedMonthlyIncome(
      data.appSettings?.estimatedMonthlyIncome
        ? formatAmountInput(String(data.appSettings.estimatedMonthlyIncome))
        : ""
    );
    setBasicBasketAmount(formatAmountInput(String(data.appSettings?.basicBasketAmount ?? 1370000)));
    setDiscountPersonalOverages(data.appSettings?.discountPersonalOverages ?? true ? "yes" : "no");
    setGoalInputs(
      data.goals.map((goal) => ({
        id: goal.id,
        name: goal.name,
        currentAmount: goal.currentAmount ? formatAmountInput(String(goal.currentAmount)) : "",
        targetAmount: goal.targetAmount ? formatAmountInput(String(goal.targetAmount)) : "",
        allocationPercentage: String(goal.allocationPercentage)
      }))
    );
  }, [data?.appSettings, data]);

  useEffect(() => {
    const marcos = data?.people.find((person) => person.id === "marcos");
    const wife = data?.people.find((person) => person.id === "wife");

    setMarcosName(marcos?.name ?? "Marcos");
    setWifeName(wife?.name ?? "Esposa");
  }, [data?.people]);

  const totalMonthlyAllocationInput = useMemo(
    () =>
      parseAmountInput(investmentPercentage) +
      parseAmountInput(goalsPercentage) +
      parseAmountInput(personalPercentageMarcos) +
      parseAmountInput(personalPercentageWife),
    [goalsPercentage, investmentPercentage, personalPercentageMarcos, personalPercentageWife]
  );
  const activeGoalAllocationTotal = useMemo(
    () =>
      goalInputs
        .filter((goal) => goal.name.trim() && parseAmountInput(goal.targetAmount) > 0)
        .reduce((total, goal) => total + parseAmountInput(goal.allocationPercentage), 0),
    [goalInputs]
  );
  const hasGoalsAllocation = parseAmountInput(goalsPercentage) > 0;
  const isMonthlyAllocationValid = totalMonthlyAllocationInput <= 100;
  const isGoalAllocationValid =
    !hasGoalsAllocation || Math.abs(activeGoalAllocationTotal - 100) <= 0.01;
  const missingGoalAllocation = Math.max(0, 100 - activeGoalAllocationTotal);
  const shouldShowMissingGoalAllocation =
    hasGoalsAllocation && activeGoalAllocationTotal < 100 && missingGoalAllocation > 0.01;
  const estimatedIncomeValue = parseAmountInput(estimatedMonthlyIncome);
  const basicBasketValue = parseAmountInput(basicBasketAmount);
  const estimatedAllocationsAmount = estimatedIncomeValue * (totalMonthlyAllocationInput / 100);
  const estimatedCommonFund = estimatedIncomeValue - estimatedAllocationsAmount;
  const isBelowBasicBasket =
    estimatedIncomeValue > 0 && basicBasketValue > 0 && estimatedCommonFund < basicBasketValue;

  const saveConfig = async () => {
    const nextInvestment = parseAmountInput(investmentPercentage || String(config?.investmentPercentage ?? 0));
    const nextGoalsPercentage = parseAmountInput(goalsPercentage || String(config?.goalsPercentage ?? 0));
    const nextMarcos = parseAmountInput(personalPercentageMarcos || String(config?.personalPercentageMarcos ?? 0));
    const nextWife = parseAmountInput(personalPercentageWife || String(config?.personalPercentageWife ?? 0));
    const nextCloseDay = Number(closeDay);
    const nextEstimatedMonthlyIncome = parseAmountInput(estimatedMonthlyIncome);
    const nextBasicBasketAmount = parseAmountInput(basicBasketAmount);
    const nextGoals: Goal[] = goalInputs.map((goalInput) => ({
      id: goalInput.id,
      name: goalInput.name.trim(),
      currentAmount: parseAmountInput(goalInput.currentAmount),
      targetAmount: parseAmountInput(goalInput.targetAmount),
      allocationPercentage: parseAmountInput(goalInput.allocationPercentage)
    }));
    const validationError = validateMonthlyPercentages(nextInvestment, nextGoalsPercentage, nextMarcos, nextWife);
    const activeGoalAllocations = nextGoals
      .filter((goal) => goal.name.trim() && goal.targetAmount > 0)
      .map((goal) => goal.allocationPercentage);
    const goalAllocationError = validateGoalAllocationPercentages(nextGoalsPercentage, activeGoalAllocations);

    if (!isValidMonthKey(selectedMonth)) {
      Alert.alert("Mes invalido", "Usa el formato YYYY-MM, por ejemplo 2026-05.");
      return;
    }

    if (validationError) {
      Alert.alert("Porcentaje invalido", validationError);
      return;
    }

    if (goalAllocationError) {
      Alert.alert("Distribucion de objetivos invalida", goalAllocationError);
      return;
    }

    if (!Number.isInteger(nextCloseDay) || nextCloseDay < 1 || nextCloseDay > 31) {
      Alert.alert("Dia de cierre invalido", "Ingresa un numero entre 1 y 31.");
      return;
    }

    if (nextEstimatedMonthlyIncome < 0 || nextBasicBasketAmount < 0) {
      Alert.alert("Estimacion invalida", "El ingreso estimado y la canasta basica no pueden ser negativos.");
      return;
    }

    if (
      nextGoals.some(
        (goal) => goal.currentAmount < 0 || goal.targetAmount < 0 || goal.allocationPercentage < 0
      )
    ) {
      Alert.alert("Objetivo invalido", "Los montos y porcentajes de objetivos no pueden ser negativos.");
      return;
    }

    await saveMonthlyConfig({
      month: selectedMonth,
      investmentPercentage: nextInvestment,
      goalsPercentage: nextGoalsPercentage,
      personalPercentageMarcos: nextMarcos,
      personalPercentageWife: nextWife
    });

    await saveAppSettings(
      nextCloseDay,
      discountPersonalOverages === "yes",
      nextEstimatedMonthlyIncome,
      nextBasicBasketAmount
    );
    await saveGoals(nextGoals);

    Alert.alert(
      "Configuracion guardada",
      "Las asignaciones mensuales, objetivos y el dia de cierre se usaran en el dashboard."
    );
  };

  const loadCurrentConfig = () => {
    if (!config || !data) return;

    setInvestmentPercentage(String(config.investmentPercentage));
    setGoalsPercentage(String(config.goalsPercentage));
    setPersonalPercentageMarcos(String(config.personalPercentageMarcos));
    setPersonalPercentageWife(String(config.personalPercentageWife));
    setCloseDay(String(data.appSettings?.closeDay ?? 31));
    setEstimatedMonthlyIncome(
      data.appSettings?.estimatedMonthlyIncome
        ? formatAmountInput(String(data.appSettings.estimatedMonthlyIncome))
        : ""
    );
    setBasicBasketAmount(formatAmountInput(String(data.appSettings?.basicBasketAmount ?? 1370000)));
    setDiscountPersonalOverages(data.appSettings?.discountPersonalOverages ?? true ? "yes" : "no");
    setGoalInputs(
      data.goals.map((goal) => ({
        id: goal.id,
        name: goal.name,
        currentAmount: goal.currentAmount ? formatAmountInput(String(goal.currentAmount)) : "",
        targetAmount: goal.targetAmount ? formatAmountInput(String(goal.targetAmount)) : "",
        allocationPercentage: String(goal.allocationPercentage)
      }))
    );
  };

  const updateGoalInput = (
    goalId: string,
    field: "name" | "currentAmount" | "targetAmount" | "allocationPercentage",
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

  const closeSession = () => {
    Alert.alert("Cerrar sesion", "Vas a salir de tu cuenta en este celular.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesion",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudo cerrar sesion.";
            Alert.alert("Supabase", message);
          }
        }
      }
    ]);
  };

  return (
    <Screen isLoading={isLoading} title="Configuracion mensual">
      <Card>
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <StatRow label="Usuario" value={user?.email ?? "Sin email"} />
        <StatRow label="Hogar" value={household?.name ?? "Sin hogar"} />
        <PrimaryButton label="Cerrar sesion" onPress={closeSession} variant="secondary" />
      </Card>

      <Card>
        <TextInputField label="Persona 1" onChangeText={setMarcosName} placeholder="Marcos" value={marcosName} />
        <TextInputField label="Persona 2" onChangeText={setWifeName} placeholder="Esposa" value={wifeName} />
        <PrimaryButton label="Guardar personas" onPress={savePeople} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Estimacion mensual</Text>
        <TextInputField
          keyboardType="numeric"
          label="Ingreso mensual estimado"
          onChangeText={(value) => setEstimatedMonthlyIncome(formatAmountInput(value))}
          placeholder="Ej: 2.000.000"
          value={estimatedMonthlyIncome}
        />
        <TextInputField
          keyboardType="numeric"
          label="Canasta basica"
          onChangeText={(value) => setBasicBasketAmount(formatAmountInput(value))}
          placeholder="1.370.000"
          value={basicBasketAmount}
        />
        <StatRow label="Asignaciones estimadas" value={formatARS(estimatedAllocationsAmount)} />
        <StatRow
          label="Fondo comun estimado"
          tone={isBelowBasicBasket ? "warning" : "positive"}
          value={formatARS(estimatedCommonFund)}
        />
        <StatRow label="Canasta basica" value={formatARS(basicBasketValue)} />
        {isBelowBasicBasket && (
          <Text style={styles.warning}>
            El fondo comun estimado queda por debajo de la canasta basica.
          </Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Asignaciones mensuales</Text>
        <MonthSelector label="Mes" onChange={setSelectedMonth} value={selectedMonth} />
        <TextInputField
          keyboardType="numeric"
          label="Inversion (%)"
          onChangeText={setInvestmentPercentage}
          placeholder="10"
          value={investmentPercentage}
        />
        <TextInputField
          keyboardType="numeric"
          label="Objetivos (%)"
          onChangeText={setGoalsPercentage}
          placeholder="10"
          value={goalsPercentage}
        />
        <TextInputField
          keyboardType="numeric"
          label={`Personal ${marcosName || "Persona 1"} (%)`}
          onChangeText={setPersonalPercentageMarcos}
          placeholder="5"
          value={personalPercentageMarcos}
        />
        <TextInputField
          keyboardType="numeric"
          label={`Personal ${wifeName || "Persona 2"} (%)`}
          onChangeText={setPersonalPercentageWife}
          placeholder="5"
          value={personalPercentageWife}
        />
        <StatRow
          label="Total asignado"
          tone={isMonthlyAllocationValid ? "positive" : "warning"}
          value={`${totalMonthlyAllocationInput}% / 100%`}
        />
        {!isMonthlyAllocationValid && (
          <Text style={styles.warning}>Las asignaciones mensuales no pueden superar el 100%.</Text>
        )}
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
            <TextInputField
              keyboardType="numeric"
              label="% dentro de objetivos"
              onChangeText={(value) => updateGoalInput(goal.id, "allocationPercentage", value)}
              placeholder={String(DEFAULT_GOALS[index]?.allocationPercentage ?? 0)}
              value={goal.allocationPercentage}
            />
          </Fragment>
        ))}
        <StatRow
          label="Distribucion objetivos"
          tone={isGoalAllocationValid ? "positive" : "warning"}
          value={`${activeGoalAllocationTotal}% / 100%`}
        />
        {shouldShowMissingGoalAllocation && (
          <Text style={styles.warning}>Falta distribuir {missingGoalAllocation}% para completar el 100%.</Text>
        )}
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
  },
  warning: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18
  }
});
