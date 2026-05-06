import { Alert, StyleSheet, View } from "react-native";
import { useMemo, useState } from "react";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { StatRow } from "../components/StatRow";
import { TextInputField } from "../components/TextInputField";
import { useAppDataContext } from "../hooks/AppDataContext";
import { EXPENSE_CATEGORIES, Expense, ExpenseCategory, PaymentSource, PersonId } from "../models";
import { formatARS, parseAmountInput } from "../utils/currency";
import { getTodayISODate } from "../utils/dates";
import { createId } from "../utils/ids";
import { categoryLabels, paymentSourceLabels, personLabels } from "../utils/labels";
import { isValidISODate, isValidMonthKey } from "../utils/validation";

// Formulario para gastos comunes o no comunes, incluyendo pagos desde dinero personal.
export function ExpenseScreen() {
  const {
    data,
    addExpense,
    updateExpense,
    deleteExpense,
    getMonthStatus,
    isLoading,
    selectedMonth,
    setSelectedMonth
  } = useAppDataContext();
  const [category, setCategory] = useState<ExpenseCategory>("comida");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<PersonId>("marcos");
  const [paymentSource, setPaymentSource] = useState<PaymentSource>("common_fund");
  const [isCommonExpense, setIsCommonExpense] = useState<"yes" | "no">("yes");
  const [date, setDate] = useState(getTodayISODate());
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const monthExpenses = useMemo(
    () => data?.expenses.filter((expense) => expense.month === selectedMonth) ?? [],
    [data, selectedMonth]
  );

  const resetForm = () => {
    setEditingExpenseId(null);
    setCategory("comida");
    setDescription("");
    setAmount("");
    setPaidBy("marcos");
    setPaymentSource("common_fund");
    setIsCommonExpense("yes");
    setDate(getTodayISODate());
  };

  const editExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setSelectedMonth(expense.month);
    setCategory(expense.category);
    setDescription(expense.description);
    setAmount(String(expense.amount));
    setPaidBy(expense.paidBy);
    setPaymentSource(expense.paymentSource);
    setIsCommonExpense(expense.isCommonExpense ? "yes" : "no");
    setDate(expense.date);
  };

  const saveExpense = async () => {
    const parsedAmount = parseAmountInput(amount);
    const monthStatus = getMonthStatus(selectedMonth);

    if (monthStatus === "closed") {
      Alert.alert("Mes cerrado", "Reabri el mes desde Cierre mensual antes de modificar gastos.");
      return;
    }

    if (!isValidMonthKey(selectedMonth)) {
      Alert.alert("Mes invalido", "Usa el formato YYYY-MM, por ejemplo 2026-05.");
      return;
    }

    if (!isValidISODate(date)) {
      Alert.alert("Fecha invalida", "Usa el formato YYYY-MM-DD, por ejemplo 2026-05-31.");
      return;
    }

    if (parsedAmount <= 0) {
      Alert.alert("Monto invalido", "El gasto debe ser mayor a cero.");
      return;
    }

    const expense: Expense = {
      id: editingExpenseId ?? createId("expense"),
      month: selectedMonth,
      category,
      description: description.trim() || categoryLabels[category],
      amount: parsedAmount,
      paidBy,
      paymentSource,
      isCommonExpense: isCommonExpense === "yes",
      date
    };

    if (editingExpenseId) {
      await updateExpense(expense);
    } else {
      await addExpense(expense);
    }

    resetForm();
    Alert.alert("Gasto guardado", "El gasto quedo registrado correctamente.");
  };

  const removeExpense = (expenseId: string) => {
    Alert.alert("Eliminar gasto", "Tambien se eliminaran reintegros vinculados a ese gasto.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteExpense(expenseId);
          if (editingExpenseId === expenseId) resetForm();
        }
      }
    ]);
  };

  return (
    <Screen isLoading={isLoading} title="Cargar gasto">
      <Card>
        <TextInputField label="Mes" onChangeText={setSelectedMonth} placeholder="YYYY-MM" value={selectedMonth} />
        <SegmentedControl
          label="Categoria"
          onChange={setCategory}
          options={EXPENSE_CATEGORIES.map((item) => ({ label: categoryLabels[item], value: item }))}
          value={category}
        />
        <TextInputField label="Descripcion" onChangeText={setDescription} placeholder="Detalle del gasto" value={description} />
        <TextInputField keyboardType="numeric" label="Monto" onChangeText={setAmount} placeholder="Ej: 50000" value={amount} />
        <SegmentedControl
          label="Pagado por"
          onChange={setPaidBy}
          options={[
            { label: "Marcos", value: "marcos" },
            { label: "Esposa", value: "wife" }
          ]}
          value={paidBy}
        />
        <SegmentedControl
          label="Fuente de pago"
          onChange={setPaymentSource}
          options={[
            { label: "Fondo comun", value: "common_fund" },
            { label: "Dinero personal", value: "personal_money" }
          ]}
          value={paymentSource}
        />
        <SegmentedControl
          label="Es gasto comun?"
          onChange={setIsCommonExpense}
          options={[
            { label: "Si", value: "yes" },
            { label: "No", value: "no" }
          ]}
          value={isCommonExpense}
        />
        <TextInputField label="Fecha" onChangeText={setDate} placeholder="YYYY-MM-DD" value={date} />
        <PrimaryButton label={editingExpenseId ? "Actualizar gasto" : "Guardar gasto"} onPress={saveExpense} />
        {editingExpenseId && <PrimaryButton label="Cancelar edicion" onPress={resetForm} variant="secondary" />}
      </Card>

      <Card>
        <SegmentedControl
          label="Gastos del mes"
          onChange={(expenseId) => {
            const expense = monthExpenses.find((item) => item.id === expenseId);
            if (expense) editExpense(expense);
          }}
          options={
            monthExpenses.length
              ? monthExpenses.map((expense) => ({
                  label: `${expense.description} - ${formatARS(expense.amount)}`,
                  value: expense.id
                }))
              : [{ label: "Sin gastos", value: "none" }]
          }
          value={editingExpenseId ?? "none"}
        />
        {monthExpenses.map((expense) => (
          <View key={expense.id} style={styles.record}>
            <StatRow label={expense.description} value={formatARS(expense.amount)} />
            <StatRow label="Categoria" value={categoryLabels[expense.category]} />
            <StatRow label="Pagado por" value={personLabels[expense.paidBy]} />
            <StatRow label="Fuente" value={paymentSourceLabels[expense.paymentSource]} />
            <PrimaryButton label="Editar" onPress={() => editExpense(expense)} variant="secondary" />
            <PrimaryButton label="Eliminar" onPress={() => removeExpense(expense.id)} variant="danger" />
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  record: {
    borderTopColor: "#d8ddd7",
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 10
  }
});
