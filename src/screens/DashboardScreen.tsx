import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { Card } from "../components/Card";
import { EvolutionSummaryCard } from "../components/EvolutionSummaryCard";
import { MonthSelector } from "../components/MonthSelector";
import { Screen } from "../components/Screen";
import { StatRow } from "../components/StatRow";
import { useAppDataContext } from "../hooks/AppDataContext";
import { calculateMonthlySummary, getMonthlyConfig } from "../services/finance";
import { colors } from "../theme/colors";
import { formatARS } from "../utils/currency";
import { formatMonthLabel } from "../utils/dates";
import { getPersonName } from "../utils/people";

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
  const marcosName = getPersonName(data?.people, "marcos");
  const wifeName = getPersonName(data?.people, "wife");

  return (
    <Screen isLoading={isLoading} title="Dashboard mensual">
      <MonthSelector label="Mes seleccionado" onChange={setSelectedMonth} value={selectedMonth} />

      {summary && (
        <>
          <Card>
            <EvolutionSummaryCard
              closes={data?.monthlyCloses ?? []}
              selectedMonth={selectedMonth}
              summary={summary}
            />
          </Card>

          <Card>
            <Text style={styles.month}>{formatMonthLabel(selectedMonth)}</Text>
            <StatRow label="Total ingresos" value={formatARS(summary.totalIncome)} />
            <StatRow label="Total gastos comunes" value={formatARS(summary.totalCommonExpenses)} />
            <StatRow label="Monto de inversion" value={formatARS(summary.investmentAmount)} />
            <StatRow label="Fondo comun restante" tone="positive" value={formatARS(summary.remainingCommonFund)} />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Dinero personal</Text>
            <StatRow label={`${marcosName} base`} value={formatARS(summary.personalAmountMarcos)} />
            <StatRow label={`Reintegros ${marcosName}`} value={formatARS(summary.pendingReimbursementsMarcos)} />
            <StatRow label={`${marcosName} final`} tone="positive" value={formatARS(summary.finalPersonalAmountMarcos)} />
            <StatRow label={`${wifeName} base`} value={formatARS(summary.personalAmountWife)} />
            <StatRow label={`Reintegros ${wifeName}`} value={formatARS(summary.pendingReimbursementsWife)} />
            <StatRow label={`${wifeName} final`} tone="positive" value={formatARS(summary.finalPersonalAmountWife)} />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Ingresos del mes</Text>
            {monthIncomes.length ? (
              monthIncomes.map((income) => (
                <StatRow
                  key={income.id}
                  label={`${income.description} (${getPersonName(data?.people, income.personId)})`}
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
