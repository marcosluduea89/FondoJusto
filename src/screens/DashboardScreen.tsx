import { useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Card } from "../components/Card";
import { EvolutionSummaryCard } from "../components/EvolutionSummaryCard";
import { GoalProgressCard } from "../components/GoalProgressCard";
import { MonthSelector } from "../components/MonthSelector";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { StatRow } from "../components/StatRow";
import { useAppDataContext } from "../hooks/AppDataContext";
import { calculateMonthlySummary, getMonthlyConfig, getPersonalOverageCarryover } from "../services/finance";
import { colors } from "../theme/colors";
import { formatARS } from "../utils/currency";
import { formatMonthLabel } from "../utils/dates";
import { getPersonName } from "../utils/people";

type PersonalMoneyView = "marcos" | "wife" | "both";

// Pantalla de lectura rapida para entender como esta el mes seleccionado.
export function DashboardScreen() {
  const { data, isLoading, selectedMonth, setSelectedMonth } = useAppDataContext();
  const [personalMoneyView, setPersonalMoneyView] = useState<PersonalMoneyView>("marcos");

  const summary = useMemo(() => {
    if (!data) return null;

    const config = getMonthlyConfig(data.monthlyConfigs, selectedMonth);
    const personalCarryover = getPersonalOverageCarryover(data, selectedMonth);
    return calculateMonthlySummary(
      data.incomes,
      data.expenses,
      data.reimbursements,
      config,
      selectedMonth,
      personalCarryover
    );
  }, [data, selectedMonth]);

  const monthIncomes = useMemo(
    () => data?.incomes.filter((income) => income.month === selectedMonth) ?? [],
    [data, selectedMonth]
  );
  const marcosName = getPersonName(data?.people, "marcos");
  const wifeName = getPersonName(data?.people, "wife");
  const shouldShowMarcos = personalMoneyView === "marcos" || personalMoneyView === "both";
  const shouldShowWife = personalMoneyView === "wife" || personalMoneyView === "both";

  return (
    <Screen isLoading={isLoading} title="Dashboard mensual">
      <MonthSelector label="Mes seleccionado" onChange={setSelectedMonth} value={selectedMonth} />

      {summary && data && (
        <>
          <Card>
            <EvolutionSummaryCard
              closes={data?.monthlyCloses ?? []}
              data={data}
              selectedMonth={selectedMonth}
              summary={summary}
            />
          </Card>

          <Card>
            <Text style={styles.month}>{formatMonthLabel(selectedMonth)}</Text>
            <StatRow label="Total ingresos" value={formatARS(summary.totalIncome)} />
            <StatRow label="Total gastos comunes" value={formatARS(summary.totalCommonExpenses)} />
            <StatRow label="Fondo comun restante" tone="positive" value={formatARS(summary.remainingCommonFund)} />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Inversion</Text>
            <StatRow label="Asignado" value={formatARS(summary.investmentAmount)} />
            <StatRow label="Usado" value={formatARS(summary.investmentUsed)} />
            <StatRow
              label="Disponible"
              tone={summary.availableInvestmentAmount >= 0 ? "positive" : "warning"}
              value={formatARS(summary.availableInvestmentAmount)}
            />
          </Card>

          <Card>
            <GoalProgressCard goals={data.goals} />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Dinero personal</Text>
            <SegmentedControl
              label="Ver"
              onChange={setPersonalMoneyView}
              options={[
                { label: marcosName, value: "marcos" },
                { label: wifeName, value: "wife" },
                { label: "Ambos", value: "both" }
              ]}
              value={personalMoneyView}
            />
            {shouldShowMarcos && (
              <>
                <StatRow label={`${marcosName} asignado`} value={formatARS(summary.personalAmountMarcos)} />
                <StatRow label={`Reintegros ${marcosName}`} value={formatARS(summary.pendingReimbursementsMarcos)} />
                {summary.personalCarryoverMarcos > 0 && (
                  <StatRow label={`Descuento anterior ${marcosName}`} value={formatARS(summary.personalCarryoverMarcos)} />
                )}
                <StatRow label={`Gastos personales ${marcosName}`} value={formatARS(summary.personalExpensesMarcos)} />
                <StatRow
                  label={`${marcosName} disponible`}
                  tone={summary.availablePersonalAmountMarcos >= 0 ? "positive" : "warning"}
                  value={formatARS(summary.availablePersonalAmountMarcos)}
                />
              </>
            )}
            {shouldShowWife && (
              <>
                <StatRow label={`${wifeName} asignado`} value={formatARS(summary.personalAmountWife)} />
                <StatRow label={`Reintegros ${wifeName}`} value={formatARS(summary.pendingReimbursementsWife)} />
                {summary.personalCarryoverWife > 0 && (
                  <StatRow label={`Descuento anterior ${wifeName}`} value={formatARS(summary.personalCarryoverWife)} />
                )}
                <StatRow label={`Gastos personales ${wifeName}`} value={formatARS(summary.personalExpensesWife)} />
                <StatRow
                  label={`${wifeName} disponible`}
                  tone={summary.availablePersonalAmountWife >= 0 ? "positive" : "warning"}
                  value={formatARS(summary.availablePersonalAmountWife)}
                />
              </>
            )}
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
            El disponible personal se recalcula con ingresos, reintegros y gastos personales del mes.
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
