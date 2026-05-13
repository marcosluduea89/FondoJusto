import { Alert, StyleSheet, Text } from "react-native";
import { useMemo } from "react";
import { Card } from "../components/Card";
import { MonthSelector } from "../components/MonthSelector";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { StatRow } from "../components/StatRow";
import { useAppDataContext } from "../hooks/AppDataContext";
import { calculateMonthlyCloseSummary, getMonthlyConfig, getPersonalOverageCarryover } from "../services/finance";
import { colors } from "../theme/colors";
import { formatARS } from "../utils/currency";
import { isValidMonthKey } from "../utils/validation";
import { getPersonName } from "../utils/people";

// Cierre mensual: aplica reintegros pendientes, genera nuevos y guarda el resultado historico.
export function CloseMonthScreen() {
  const {
    data,
    getMonthStatus,
    isLoading,
    performMonthlyClose,
    reopenMonth,
    selectedMonth,
    setSelectedMonth
  } = useAppDataContext();
  const monthStatus = getMonthStatus(selectedMonth);
  const marcosName = getPersonName(data?.people, "marcos");
  const wifeName = getPersonName(data?.people, "wife");

  const summary = useMemo(() => {
    if (!data) return null;

    const config = getMonthlyConfig(data.monthlyConfigs, selectedMonth);
    const personalCarryover = getPersonalOverageCarryover(data, selectedMonth);
    return calculateMonthlyCloseSummary(
      data.incomes,
      data.expenses,
      data.reimbursements,
      config,
      selectedMonth,
      personalCarryover
    );
  }, [data, selectedMonth]);
  const totalMonthlyAllocations = summary
    ? summary.investmentAmount + summary.goalsAmount + summary.personalAmountMarcos + summary.personalAmountWife
    : 0;

  const saveClose = async () => {
    await performMonthlyClose(selectedMonth);
    Alert.alert("Cierre guardado", "Se aplicaron reintegros pendientes y se guardo el cierre mensual.");
  };

  const confirmClose = () => {
    if (!isValidMonthKey(selectedMonth)) {
      Alert.alert("Mes invalido", "Usa el formato YYYY-MM, por ejemplo 2026-05.");
      return;
    }

    Alert.alert(
      monthStatus === "closed" ? "Recalcular cierre" : "Cerrar mes",
      monthStatus === "closed"
        ? "Este mes ya esta cerrado. Si continuas, se recalcula el cierre con los datos actuales."
        : "Este cierre guardara el resumen del mes, aplicara reintegros pendientes y creara reintegros para el mes siguiente.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: monthStatus === "closed" ? "Recalcular" : "Cerrar mes", onPress: saveClose }
      ]
    );
  };

  const confirmReopen = () => {
    Alert.alert("Reabrir mes", "Vas a poder editar ingresos y gastos de este mes nuevamente.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Reabrir", onPress: () => reopenMonth(selectedMonth) }
    ]);
  };

  return (
    <Screen isLoading={isLoading} title="Cierre mensual">
      <MonthSelector label="Mes a cerrar" onChange={setSelectedMonth} value={selectedMonth} />

      {summary && (
        <Card>
          <Text style={styles.title}>Resumen previo</Text>
          <Text style={styles.status}>Estado del mes: {monthStatus}</Text>
          <StatRow label="Ingresos" value={formatARS(summary.totalIncome)} />
          <StatRow label="Gastos comunes" value={formatARS(summary.totalCommonExpenses)} />
          <StatRow label="Asignaciones mensuales" value={formatARS(totalMonthlyAllocations)} />
          <StatRow label="Inversion" value={formatARS(summary.investmentAmount)} />
          <StatRow label="Inversion usada" value={formatARS(summary.investmentUsed)} />
          <StatRow label="Inversion disponible" value={formatARS(summary.availableInvestmentAmount)} />
          <StatRow label="Objetivos" value={formatARS(summary.goalsAmount)} />
          <StatRow label={`Personal ${marcosName}`} value={formatARS(summary.personalAmountMarcos)} />
          {summary.personalCarryoverMarcos > 0 && (
            <StatRow label={`Descuento anterior ${marcosName}`} value={formatARS(summary.personalCarryoverMarcos)} />
          )}
          <StatRow label={`Gastos personales ${marcosName}`} value={formatARS(summary.personalExpensesMarcos)} />
          <StatRow
            label={`${marcosName} disponible`}
            value={formatARS(summary.availablePersonalAmountMarcos)}
          />
          <StatRow label={`Personal ${wifeName}`} value={formatARS(summary.personalAmountWife)} />
          {summary.personalCarryoverWife > 0 && (
            <StatRow label={`Descuento anterior ${wifeName}`} value={formatARS(summary.personalCarryoverWife)} />
          )}
          <StatRow label={`Gastos personales ${wifeName}`} value={formatARS(summary.personalExpensesWife)} />
          <StatRow
            label={`${wifeName} disponible`}
            value={formatARS(summary.availablePersonalAmountWife)}
          />
          <StatRow label="Fondo comun disponible" tone="positive" value={formatARS(summary.remainingCommonFund)} />
          <Text style={styles.note}>
            Al cerrar, los reintegros pendientes del mes quedan aplicados y los gastos comunes pagados con dinero
            personal generan reintegros para el mes siguiente.
          </Text>
          <PrimaryButton
            label={monthStatus === "closed" ? "Recalcular cierre mensual" : "Guardar cierre mensual"}
            onPress={confirmClose}
          />
          {monthStatus === "closed" && (
            <PrimaryButton label="Reabrir mes para editar" onPress={confirmReopen} variant="secondary" />
          )}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  },
  status: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "capitalize"
  }
});
