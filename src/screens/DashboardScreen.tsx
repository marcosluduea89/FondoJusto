import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { StatRow } from "../components/StatRow";
import { TextInputField } from "../components/TextInputField";
import { useAppDataContext } from "../hooks/AppDataContext";
import { calculateMonthlySummary, getMonthlyConfig } from "../services/finance";
import { colors } from "../theme/colors";
import { formatARS } from "../utils/currency";
import { formatMonthLabel } from "../utils/dates";
import { personLabels } from "../utils/labels";

// Pantalla de lectura rapida para entender como esta el mes seleccionado.
export function DashboardScreen() {
  const { data, isLoading, selectedMonth, setSelectedMonth } = useAppDataContext();

  const summary = useMemo(() => {
    if (!data) return null;

    const config = getMonthlyConfig(data.monthlyConfigs, selectedMonth);
    return calculateMonthlySummary(
      data.incomes,
      data.expenses,
      data.reimbursements,
      config,
      selectedMonth
    );
  }, [data, selectedMonth]);

  const monthIncomes = useMemo(
    () => data?.incomes.filter((income) => income.month === selectedMonth) ?? [],
    [data, selectedMonth]
  );

  return (
    <Screen isLoading={isLoading} title="Dashboard mensual">
      <TextInputField
        label="Mes seleccionado"
        onChangeText={setSelectedMonth}
        placeholder="YYYY-MM"
        value={selectedMonth}
      />

      {summary && (
        <>
          <Card>
            <Text style={styles.month}>{formatMonthLabel(selectedMonth)}</Text>
            <StatRow label="Total ingresos" value={formatARS(summary.totalIncome)} />
            <StatRow label="Total gastos comunes" value={formatARS(summary.totalCommonExpenses)} />
            <StatRow label="Monto de inversion" value={formatARS(summary.investmentAmount)} />
            <StatRow label="Fondo comun restante" tone="positive" value={formatARS(summary.remainingCommonFund)} />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Dinero personal</Text>
            <StatRow label="Marcos base" value={formatARS(summary.personalAmountMarcos)} />
            <StatRow label="Reintegros Marcos" value={formatARS(summary.pendingReimbursementsMarcos)} />
            <StatRow label="Marcos final" tone="positive" value={formatARS(summary.finalPersonalAmountMarcos)} />
            <StatRow label="Esposa base" value={formatARS(summary.personalAmountWife)} />
            <StatRow label="Reintegros esposa" value={formatARS(summary.pendingReimbursementsWife)} />
            <StatRow label="Esposa final" tone="positive" value={formatARS(summary.finalPersonalAmountWife)} />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Ingresos del mes</Text>
            {monthIncomes.length ? (
              monthIncomes.map((income) => (
                <StatRow
                  key={income.id}
                  label={`${income.description} (${personLabels[income.personId]})`}
                  value={formatARS(income.amount)}
                />
              ))
            ) : (
              <Text style={styles.empty}>No hay ingresos cargados para este mes.</Text>
            )}
          </Card>

          <Text style={styles.note}>
            Los reintegros pendientes se suman al dinero personal del mes cuando corresponde aplicarlos.
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  month: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  empty: {
    color: colors.muted,
    fontSize: 14
  },
  note: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  }
});
