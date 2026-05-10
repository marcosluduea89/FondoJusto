import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LineChart, PieChart } from "react-native-gifted-charts";
import { Card } from "../components/Card";
import { MonthSelector } from "../components/MonthSelector";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { StatRow } from "../components/StatRow";
import { useAppDataContext } from "../hooks/AppDataContext";
import { EXPENSE_CATEGORIES, ExpenseCategory } from "../models";
import { colors } from "../theme/colors";
import { buildYAxisLabels } from "../utils/chart";
import { formatARS } from "../utils/currency";
import { calculateMonthlySummary, getMonthlyConfig } from "../services/finance";
import { formatMonthLabel, isFutureMonth } from "../utils/dates";
import { categoryLabels } from "../utils/labels";

interface BarProps {
  color: string;
  label: string;
  maxValue: number;
  value: number;
}

interface CategoryTotal {
  category: ExpenseCategory;
  total: number;
}

interface LinePoint {
  label: string;
  value: number;
}

type GraphView = "all" | "evolution" | "expenses";
type MonthScope = "all_months" | "selected_month";

const CATEGORY_COLORS = [
  "#0f7b6c",
  "#3867d6",
  "#b42318",
  "#9a6700",
  "#7c3aed",
  "#0f766e",
  "#c2410c",
  "#475569"
];

// Barra horizontal proporcional. Se usa para evitar dependencias extra de graficas.
function MetricBar({ color, label, maxValue, value }: BarProps) {
  const percentage = maxValue > 0 ? Math.max(4, Math.min(100, (value / maxValue) * 100)) : 0;

  return (
    <View style={styles.metric}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{formatARS(value)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { backgroundColor: color, width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

// Pantalla de graficas: permite ver evolucion, gastos por categoria o ambas vistas.
export function GraphScreen() {
  const { data, isLoading, selectedMonth, setSelectedMonth } = useAppDataContext();
  const [graphView, setGraphView] = useState<GraphView>("all");
  const [monthScope, setMonthScope] = useState<MonthScope>("all_months");

  const shouldShowEvolution = graphView === "all" || graphView === "evolution";
  const shouldShowExpenses = graphView === "all" || graphView === "expenses";

  const monthKeys = useMemo(() => {
    if (!data) return [];

    const months = new Set<string>();
    data.incomes.forEach((income) => months.add(income.month));
    data.expenses.forEach((expense) => months.add(expense.month));

    return Array.from(months)
      .filter((month) => !isFutureMonth(month))
      .sort((left, right) => left.localeCompare(right));
  }, [data]);

  const monthlySummaries = useMemo(
    () =>
      data
        ? monthKeys.map((month) => {
            const config = getMonthlyConfig(data.monthlyConfigs, month);
            return {
              month,
              ...calculateMonthlySummary(
                data.incomes,
                data.expenses,
                data.reimbursements,
                config,
                month
              )
            };
          })
        : [],
    [data, monthKeys]
  );

  const visibleSummaries = useMemo(
    () =>
      monthScope === "selected_month"
        ? monthlySummaries.filter((summary) => summary.month <= selectedMonth)
        : monthlySummaries.slice(-6),
    [monthlySummaries, monthScope, selectedMonth]
  );

  const categoryTotals = useMemo<CategoryTotal[]>(() => {
    const expenses =
      data?.expenses.filter(
        (expense) =>
          expense.isCommonExpense &&
          !isFutureMonth(expense.month) &&
          (monthScope === "all_months" || expense.month === selectedMonth)
      ) ?? [];

    return EXPENSE_CATEGORIES.map((category) => ({
      category,
      total: expenses
        .filter((expense) => expense.category === category)
        .reduce((total, expense) => total + expense.amount, 0)
    })).filter((item) => item.total > 0);
  }, [data, monthScope, selectedMonth]);

  const maxCloseValue = useMemo(
    () =>
      visibleSummaries.reduce(
        (maxValue, summary) =>
          Math.max(
            maxValue,
            summary.totalIncome,
            summary.totalCommonExpenses,
            summary.investmentAmount,
            Math.abs(summary.remainingCommonFund)
          ),
        0
      ),
    [visibleSummaries]
  );
  const chartMaxValue = maxCloseValue > 0 ? maxCloseValue * 1.2 : 1;
  const chartSections = 4;
  const yAxisLabels = buildYAxisLabels(chartMaxValue, chartSections);
  const maxCategoryValue = categoryTotals.reduce((maxValue, item) => Math.max(maxValue, item.total), 0);
  const periodLabel = monthScope === "all_months" ? "Todos los meses" : `Hasta ${selectedMonth}`;
  const incomeLineData = useMemo<LinePoint[]>(
    () => visibleSummaries.map((summary) => ({ label: summary.month.slice(5, 7), value: summary.totalIncome })),
    [visibleSummaries]
  );
  const expenseLineData = useMemo<LinePoint[]>(
    () =>
      visibleSummaries.map((summary) => ({
        label: summary.month.slice(5, 7),
        value: summary.totalCommonExpenses
      })),
    [visibleSummaries]
  );
  const remainingLineData = useMemo<LinePoint[]>(
    () =>
      visibleSummaries.map((summary) => ({
        label: summary.month.slice(5, 7),
        value: Math.max(0, summary.remainingCommonFund)
      })),
    [visibleSummaries]
  );
  const pieData = useMemo(
    () =>
      categoryTotals.map((item, index) => ({
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        text: categoryLabels[item.category],
        value: item.total
      })),
    [categoryTotals]
  );

  return (
    <Screen isLoading={isLoading} title="Grafica">
      <Card>
        <Text style={styles.sectionTitle}>Filtros</Text>
        <SegmentedControl
          label="Que mostrar"
          onChange={setGraphView}
          options={[
            { label: "Todo", value: "all" },
            { label: "Evolucion", value: "evolution" },
            { label: "Gastos", value: "expenses" }
          ]}
          value={graphView}
        />
        <SegmentedControl
          label="Periodo"
          onChange={setMonthScope}
          options={[
            { label: "Todos los meses", value: "all_months" },
            { label: "Un mes", value: "selected_month" }
          ]}
          value={monthScope}
        />
        {monthScope === "selected_month" && (
          <MonthSelector
            label="Mes a filtrar"
            onChange={setSelectedMonth}
            value={selectedMonth}
          />
        )}
      </Card>

      {shouldShowEvolution && (
        <Card>
          <Text style={styles.sectionTitle}>Evolucion mensual</Text>
          <Text style={styles.note}>
            Para el mes seleccionado, las graficas muestran la evolución del mes hasta ese punto usando datos actuales, sin requerir cierre.
          </Text>
          <StatRow label="Periodo" value={periodLabel} />

          {visibleSummaries.length ? (
            <>
              {visibleSummaries.length > 1 && (
                <View style={styles.chartBox}>
                  <LineChart
                    areaChart
                    curved
                    data={incomeLineData}
                    data2={expenseLineData}
                    data3={remainingLineData}
                    color1="#0f7b6c"
                    color2="#b42318"
                    color3="#3867d6"
                    dataPointsColor1="#0f7b6c"
                    dataPointsColor2="#b42318"
                    dataPointsColor3="#3867d6"
                    height={180}
                    initialSpacing={8}
                    maxValue={chartMaxValue}
                    mostNegativeValue={0}
                    noOfSections={chartSections}
                    noOfSectionsBelowXAxis={0}
                    overflowTop={24}
                    rulesColor={colors.border}
                    spacing={42}
                    thickness={3}
                    width={280}
                    xAxisColor={colors.border}
                    yAxisColor={colors.border}
                    yAxisLabelTexts={yAxisLabels}
                    yAxisLabelWidth={46}
                    yAxisOffset={0}
                    yAxisTextStyle={styles.axisText}
                  />
                  <View style={styles.legendRow}>
                    <Text style={[styles.legend, { color: "#0f7b6c" }]}>Ingresos</Text>
                    <Text style={[styles.legend, { color: "#b42318" }]}>Gastos</Text>
                    <Text style={[styles.legend, { color: "#3867d6" }]}>Fondo</Text>
                  </View>
                </View>
              )}

              {visibleSummaries.map((summary) => (
                <View key={summary.month} style={styles.monthBlock}>
                  <Text style={styles.monthTitle}>{formatMonthLabel(summary.month)}</Text>
                  <MetricBar
                    color="#0f7b6c"
                    label="Ingresos"
                    maxValue={maxCloseValue}
                    value={summary.totalIncome}
                  />
                  <MetricBar
                    color="#b42318"
                    label="Gastos comunes"
                    maxValue={maxCloseValue}
                    value={summary.totalCommonExpenses}
                  />
                  <MetricBar
                    color="#3867d6"
                    label="Inversion"
                    maxValue={maxCloseValue}
                    value={summary.investmentAmount}
                  />
                  <MetricBar
                    color={summary.remainingCommonFund >= 0 ? "#2f9e44" : "#9a6700"}
                    label="Fondo restante"
                    maxValue={maxCloseValue}
                    value={summary.remainingCommonFund}
                  />
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.empty}>No hay datos para el periodo elegido.</Text>
          )}
        </Card>
      )}

      {shouldShowExpenses && (
        <Card>
          <Text style={styles.sectionTitle}>Gastos por categoria</Text>
          <StatRow label="Periodo" value={periodLabel} />

          {categoryTotals.length ? (
            <>
              <View style={styles.pieBox}>
                <PieChart
                  donut
                  data={pieData}
                  focusOnPress
                  innerRadius={58}
                  radius={96}
                  showText
                  textColor="#ffffff"
                  textSize={11}
                />
              </View>
              {categoryTotals.map((item, index) => (
                <MetricBar
                  color={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  key={item.category}
                  label={categoryLabels[item.category]}
                  maxValue={maxCategoryValue}
                  value={item.total}
                />
              ))}
            </>
          ) : (
            <Text style={styles.empty}>No hay gastos comunes cargados para el periodo elegido.</Text>
          )}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  axisText: {
    color: colors.muted,
    fontSize: 10
  },
  chartBox: {
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
    paddingTop: 4
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  fill: {
    borderRadius: 999,
    height: "100%"
  },
  legend: {
    fontSize: 12,
    fontWeight: "900"
  },
  legendRow: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "center"
  },
  metric: {
    gap: 6
  },
  metricHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  metricLabel: {
    color: colors.muted,
    flex: 1,
    fontSize: 13,
    fontWeight: "700"
  },
  metricValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800"
  },
  monthBlock: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 12
  },
  monthTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  note: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  pieBox: {
    alignItems: "center",
    paddingVertical: 8
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  },
  track: {
    backgroundColor: colors.background,
    borderRadius: 999,
    height: 10,
    overflow: "hidden"
  }
});
