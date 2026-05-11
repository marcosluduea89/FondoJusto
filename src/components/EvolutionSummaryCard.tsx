import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { AppData, MonthlyClose } from "../models";
import {
  calculateDailyEvolution,
  getMonthlyConfig,
  getPersonalOverageCarryover,
  MonthlySummary
} from "../services/finance";
import { colors } from "../theme/colors";
import { buildYAxisLabels } from "../utils/chart";
import { formatARS } from "../utils/currency";
import { getMonthRange, getPreviousMonthKey } from "../utils/dates";
import { EvolutionGranularity, GranularityToggle } from "./GranularityToggle";
import { SegmentedControl } from "./SegmentedControl";

type DashboardMetric = "income" | "expenses" | "investment" | "fund";

interface EvolutionSummaryCardProps {
  closes: MonthlyClose[];
  data: AppData;
  selectedMonth: string;
  summary: MonthlySummary;
}

interface MetricConfig {
  color: string;
  label: string;
  getValue: (point: EvolutionPoint) => number;
}

interface EvolutionPoint {
  month: string;
  totalIncome: number;
  totalCommonExpenses: number;
  investmentAmount: number;
  remainingCommonFund: number;
}

const METRIC_CONFIG: Record<DashboardMetric, MetricConfig> = {
  income: {
    color: "#0f7b6c",
    label: "Ingresos",
    getValue: (close) => close.totalIncome
  },
  expenses: {
    color: "#b42318",
    label: "Gastos",
    getValue: (close) => close.totalCommonExpenses
  },
  investment: {
    color: "#7c3aed",
    label: "Inversion",
    getValue: (close) => close.investmentAmount
  },
  fund: {
    color: "#3867d6",
    label: "Fondo",
    getValue: (close) => close.remainingCommonFund
  }
};

// Tarjeta compacta de inicio para ver una metrica historica sin entrar a la pestana Grafica.
export function EvolutionSummaryCard({ closes, data, selectedMonth, summary }: EvolutionSummaryCardProps) {
  const [metric, setMetric] = useState<DashboardMetric>("income");
  const [granularity, setGranularity] = useState<EvolutionGranularity>("month");
  const metricConfig = METRIC_CONFIG[metric];
  const selectedPoint = useMemo<EvolutionPoint>(
    () => ({
      month: selectedMonth,
      totalIncome: summary.totalIncome,
      totalCommonExpenses: summary.totalCommonExpenses,
      investmentAmount: summary.investmentAmount,
      remainingCommonFund: summary.remainingCommonFund
    }),
    [selectedMonth, summary]
  );
  const previousClose = useMemo(
    () => closes.find((close) => close.month === getPreviousMonthKey(selectedMonth)),
    [closes, selectedMonth]
  );
  const visibleCloses = useMemo(
    () => {
      const previousPoints = closes
        .filter((close) => close.month < selectedMonth)
        .slice()
        .sort((left, right) => left.month.localeCompare(right.month))
        .slice(-5);

      const pointByMonth = new Map<string, EvolutionPoint>(
        [...previousPoints, selectedPoint].map((point) => [point.month, point])
      );
      const firstMonth = previousPoints[0]?.month ?? selectedMonth;

      return getMonthRange(firstMonth, selectedMonth).map(
        (month) =>
          pointByMonth.get(month) ?? {
            month,
            totalIncome: 0,
            totalCommonExpenses: 0,
            investmentAmount: 0,
            remainingCommonFund: 0
          }
      );
    },
    [closes, selectedMonth, selectedPoint]
  );
  const currentValue = metricConfig.getValue(selectedPoint);
  const hasCurrentData =
    summary.totalIncome > 0 ||
    summary.totalCommonExpenses > 0 ||
    summary.investmentAmount > 0 ||
    summary.pendingReimbursementsMarcos > 0 ||
    summary.pendingReimbursementsWife > 0;
  const previousValue = previousClose ? metricConfig.getValue(previousClose) : 0;
  const difference = currentValue - previousValue;
  const percentage = previousValue !== 0 ? (difference / Math.abs(previousValue)) * 100 : 0;
  const maxValue = visibleCloses.reduce(
    (max, close) => Math.max(max, Math.abs(metricConfig.getValue(close))),
    0
  );
  const chartMaxValue = maxValue > 0 ? maxValue * 1.2 : 1;
  const chartSections = 3;
  const yAxisLabels = buildYAxisLabels(chartMaxValue, chartSections);
  const lineData = visibleCloses.map((close) => ({
    label: close.month.slice(5, 7),
    value: Math.max(0, metricConfig.getValue(close))
  }));
  const dailyLineData = useMemo(() => {
    const config = getMonthlyConfig(data.monthlyConfigs, selectedMonth);
    const personalCarryover = getPersonalOverageCarryover(data, selectedMonth);

    return calculateDailyEvolution(data, config, selectedMonth, personalCarryover).map((point) => ({
      label: point.label,
      value: Math.max(0, metricConfig.getValue({ month: selectedMonth, ...point }))
    }));
  }, [data, metricConfig, selectedMonth]);
  const activeLineData = granularity === "day" ? dailyLineData : lineData;
  const activeMaxValue = activeLineData.reduce((max, point) => Math.max(max, point.value), 0);
  const activeChartMaxValue = activeMaxValue > 0 ? activeMaxValue * 1.2 : chartMaxValue;
  const activeYAxisLabels = buildYAxisLabels(activeChartMaxValue, chartSections);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Evolucion</Text>
        <Text style={styles.metricName}>{metricConfig.label}</Text>
        <Text style={styles.amount}>{formatARS(currentValue)}</Text>
        {!hasCurrentData ? (
          <Text style={styles.empty}>Sin datos para este mes.</Text>
        ) : previousClose ? (
          <Text style={[styles.variation, difference >= 0 ? styles.positive : styles.negative]}>
            {difference >= 0 ? "+" : ""}
            {formatARS(difference)} ({percentage.toFixed(1)}%) vs cierre anterior
          </Text>
        ) : (
          <Text style={styles.empty}>Sin cierre del mes anterior comparable.</Text>
        )}
        {hasCurrentData && (
          <View style={styles.availableBox}>
            <Text style={styles.availableLabel}>Saldo disponible</Text>
            <Text
              style={[
                styles.availableAmount,
                summary.remainingCommonFund >= 0 ? styles.positive : styles.negative
              ]}
            >
              {formatARS(summary.remainingCommonFund)}
            </Text>
          </View>
        )}
      </View>

      <SegmentedControl
        label="Metrica"
        onChange={setMetric}
        options={[
          { label: "Ingresos", value: "income" },
          { label: "Gastos", value: "expenses" },
          { label: "Inversion", value: "investment" },
          { label: "Fondo", value: "fund" }
        ]}
        value={metric}
      />

      <View style={styles.modeRow}>
        <Text style={styles.modeLabel}>{granularity === "month" ? "Por mes" : "Por dia"}</Text>
        <GranularityToggle onChange={setGranularity} value={granularity} />
      </View>

      {activeLineData.length > 1 ? (
        <View style={styles.chart}>
          <LineChart
            areaChart
            data={activeLineData}
            color1={metricConfig.color}
            dataPointsColor1={metricConfig.color}
            height={150}
            hideRules={false}
            initialSpacing={8}
            maxValue={activeChartMaxValue}
            mostNegativeValue={0}
            noOfSections={chartSections}
            noOfSectionsBelowXAxis={0}
            overflowTop={18}
            rulesColor={colors.border}
            spacing={48}
            thickness={3}
            width={280}
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            yAxisLabelTexts={activeYAxisLabels}
            yAxisLabelWidth={46}
            yAxisOffset={0}
            yAxisTextStyle={styles.axisText}
          />
        </View>
      ) : (
        <Text style={styles.empty}>
          {granularity === "month"
            ? "Todavia no hay suficientes cierres para dibujar la linea."
            : "Todavia no hay suficientes movimientos diarios para dibujar la linea."}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  amount: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900"
  },
  axisText: {
    color: colors.muted,
    fontSize: 10
  },
  availableAmount: {
    fontSize: 18,
    fontWeight: "900"
  },
  availableBox: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  availableLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  chart: {
    alignItems: "center",
    overflow: "hidden"
  },
  container: {
    gap: 12
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  header: {
    gap: 4
  },
  metricName: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: "900"
  },
  modeLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  modeRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  negative: {
    color: colors.danger
  },
  positive: {
    color: colors.primaryDark
  },
  variation: {
    fontSize: 14,
    fontWeight: "800"
  }
});
