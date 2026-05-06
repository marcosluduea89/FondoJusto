import { StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { StatRow } from "../components/StatRow";
import { useAppDataContext } from "../hooks/AppDataContext";
import { colors } from "../theme/colors";
import { formatARS } from "../utils/currency";
import { formatMonthLabel } from "../utils/dates";
import { categoryLabels, paymentSourceLabels, personLabels } from "../utils/labels";

// Historial basico para revisar cierres, gastos y reintegros sin depender de servidor.
export function HistoryScreen() {
  const { data, isLoading, resetDemoData } = useAppDataContext();

  return (
    <Screen isLoading={isLoading} title="Historial">
      <PrimaryButton label="Restaurar datos de ejemplo" onPress={resetDemoData} variant="secondary" />

      <Card>
        <Text style={styles.sectionTitle}>Cierres mensuales</Text>
        {data?.monthlyCloses.length ? (
          data.monthlyCloses
            .slice()
            .sort((left, right) => right.month.localeCompare(left.month))
            .map((close) => (
              <View key={close.id} style={styles.item}>
                <Text style={styles.itemTitle}>{formatMonthLabel(close.month)}</Text>
                <StatRow label="Ingresos" value={formatARS(close.totalIncome)} />
                <StatRow label="Gastos comunes" value={formatARS(close.totalCommonExpenses)} />
                <StatRow label="Fondo restante" value={formatARS(close.remainingCommonFund)} />
              </View>
            ))
        ) : (
          <Text style={styles.empty}>Todavia no hay cierres guardados.</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Gastos cargados</Text>
        {data?.expenses.map((expense) => (
          <View key={expense.id} style={styles.item}>
            <Text style={styles.itemTitle}>{expense.description}</Text>
            <Text style={styles.meta}>
              {expense.month} - {categoryLabels[expense.category]} - {personLabels[expense.paidBy]} -{" "}
              {paymentSourceLabels[expense.paymentSource]}
            </Text>
            <StatRow label="Monto" value={formatARS(expense.amount)} />
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Reintegros</Text>
        {data?.reimbursements.map((reimbursement) => (
          <View key={reimbursement.id} style={styles.item}>
            <Text style={styles.itemTitle}>
              {personLabels[reimbursement.personId]} - {reimbursement.status === "pending" ? "Pendiente" : "Aplicado"}
            </Text>
            <Text style={styles.meta}>
              Origen {reimbursement.sourceMonth} - Aplica {reimbursement.targetMonth}
            </Text>
            <StatRow label="Monto" value={formatARS(reimbursement.amount)} />
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: colors.muted,
    fontSize: 14
  },
  item: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 6,
    paddingTop: 10
  },
  itemTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  }
});
