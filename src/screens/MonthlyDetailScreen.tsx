import { StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { StatRow } from "../components/StatRow";
import { TextInputField } from "../components/TextInputField";
import { useAppDataContext } from "../hooks/AppDataContext";
import { colors } from "../theme/colors";
import { formatARS } from "../utils/currency";
import { categoryLabels, paymentSourceLabels, personLabels } from "../utils/labels";

// Detalle operativo del mes: muestra movimientos, reintegros y estado en una sola pantalla.
export function MonthlyDetailScreen() {
  const { data, getMonthStatus, isLoading, selectedMonth, setSelectedMonth } = useAppDataContext();
  const incomes = data?.incomes.filter((income) => income.month === selectedMonth) ?? [];
  const expenses = data?.expenses.filter((expense) => expense.month === selectedMonth) ?? [];
  const reimbursements =
    data?.reimbursements.filter(
      (reimbursement) =>
        reimbursement.sourceMonth === selectedMonth ||
        reimbursement.targetMonth === selectedMonth ||
        reimbursement.appliedMonth === selectedMonth
    ) ?? [];

  return (
    <Screen isLoading={isLoading} title="Detalle mensual">
      <TextInputField label="Mes" onChangeText={setSelectedMonth} placeholder="YYYY-MM" value={selectedMonth} />

      <Card>
        <Text style={styles.sectionTitle}>Estado</Text>
        <StatRow label="Mes seleccionado" value={selectedMonth} />
        <StatRow label="Estado del mes" value={getMonthStatus(selectedMonth)} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Ingresos</Text>
        {incomes.length ? (
          incomes.map((income) => (
            <View key={income.id} style={styles.record}>
              <Text style={styles.recordTitle}>{income.description}</Text>
              <Text style={styles.meta}>{personLabels[income.personId]} - {income.date}</Text>
              <StatRow label="Monto" value={formatARS(income.amount)} />
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No hay ingresos cargados para este mes.</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Gastos</Text>
        {expenses.length ? (
          expenses.map((expense) => (
            <View key={expense.id} style={styles.record}>
              <Text style={styles.recordTitle}>{expense.description}</Text>
              <Text style={styles.meta}>
                {categoryLabels[expense.category]} - {personLabels[expense.paidBy]} -{" "}
                {paymentSourceLabels[expense.paymentSource]}
              </Text>
              <StatRow label="Monto" value={formatARS(expense.amount)} />
              <StatRow label="Gasto comun" value={expense.isCommonExpense ? "Si" : "No"} />
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No hay gastos cargados para este mes.</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Reintegros</Text>
        {reimbursements.length ? (
          reimbursements.map((reimbursement) => (
            <View key={reimbursement.id} style={styles.record}>
              <Text style={styles.recordTitle}>
                {personLabels[reimbursement.personId]} - {reimbursement.status}
              </Text>
              <Text style={styles.meta}>
                Origen {reimbursement.sourceMonth} - Aplica {reimbursement.targetMonth}
              </Text>
              <StatRow label="Monto" value={formatARS(reimbursement.amount)} />
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No hay reintegros relacionados con este mes.</Text>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: colors.muted,
    fontSize: 14
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  record: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 6,
    paddingTop: 10
  },
  recordTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  }
});
