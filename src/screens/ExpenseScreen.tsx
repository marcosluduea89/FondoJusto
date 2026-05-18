import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useMemo, useState } from "react";
import { Card } from "../components/Card";
import { DateSelector } from "../components/DateSelector";
import { MonthSelector } from "../components/MonthSelector";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { TextInputField } from "../components/TextInputField";
import { useAppDataContext } from "../hooks/AppDataContext";
import { EXPENSE_CATEGORIES, Expense, ExpenseCategory, PaymentSource, PersonId } from "../models";
import { colors } from "../theme/colors";
import { formatAmountInput, formatARS, parseAmountInput } from "../utils/currency";
import { getTodayISODate } from "../utils/dates";
import { createId } from "../utils/ids";
import { categoryLabels, paymentSourceLabels } from "../utils/labels";
import { getConfiguredPeople, getPersonName } from "../utils/people";
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
  const people = getConfiguredPeople(data?.people);

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

  const changeDate = (nextDate: string) => {
    setDate(nextDate);
    setSelectedMonth(nextDate.slice(0, 7));
  };

  const changeCategory = (nextCategory: ExpenseCategory) => {
    setCategory(nextCategory);
    if (nextCategory === "inversion") {
      setIsCommonExpense("no");
    }
  };

  const editExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setSelectedMonth(expense.month);
    setCategory(expense.category);
    setDescription(expense.description);
    setAmount(formatAmountInput(String(expense.amount)));
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
        <MonthSelector label="Mes" onChange={setSelectedMonth} value={selectedMonth} />
        <SegmentedControl
          label="Categoria"
          onChange={changeCategory}
          options={EXPENSE_CATEGORIES.map((item) => ({ label: categoryLabels[item], value: item }))}
          value={category}
        />
        <TextInputField label="Descripcion" onChangeText={setDescription} placeholder="Detalle del gasto" value={description} />
        <TextInputField
          keyboardType="numeric"
          label="Monto"
          onChangeText={(value) => setAmount(formatAmountInput(value))}
          placeholder="Ej: 50.000"
          value={amount}
        />
        <SegmentedControl
          label="Pagado por"
          onChange={setPaidBy}
          options={people.map((person) => ({ label: person.name, value: person.id }))}
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
        <DateSelector label="Fecha" onChange={changeDate} value={date} />
        <PrimaryButton label={editingExpenseId ? "Actualizar gasto" : "Guardar gasto"} onPress={saveExpense} />
        {editingExpenseId && <PrimaryButton label="Cancelar edicion" onPress={resetForm} variant="secondary" />}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Gastos del mes</Text>
        {monthExpenses.length ? (
          monthExpenses.map((expense) => (
            <View key={expense.id} style={[styles.record, editingExpenseId === expense.id && styles.activeRecord]}>
              <View style={styles.recordMain}>
                <View style={styles.recordText}>
                  <Text numberOfLines={1} style={styles.recordTitle}>
                    {expense.description}
                  </Text>
                  <Text numberOfLines={2} style={styles.recordMeta}>
                    {categoryLabels[expense.category]} · {getPersonName(data?.people, expense.paidBy)} ·{" "}
                    {paymentSourceLabels[expense.paymentSource]} · {expense.date}
                  </Text>
                </View>
                <Text style={styles.recordAmount}>{formatARS(expense.amount)}</Text>
              </View>
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" onPress={() => editExpense(expense)} style={styles.actionButton}>
                  <Text style={styles.actionText}>Editar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => removeExpense(expense.id)}
                  style={[styles.actionButton, styles.deleteButton]}
                >
                  <Text style={[styles.actionText, styles.deleteText]}>Eliminar</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No hay gastos cargados para este mes.</Text>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    backgroundColor: colors.softGreen,
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 84,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  actionText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "900"
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end"
  },
  activeRecord: {
    backgroundColor: colors.softGreen,
    borderColor: colors.primary
  },
  deleteButton: {
    backgroundColor: "#fff4f2",
    borderColor: colors.danger
  },
  deleteText: {
    color: colors.danger
  },
  empty: {
    color: colors.muted,
    fontSize: 14
  },
  record: {
    borderColor: colors.softBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 10
  },
  recordAmount: {
    color: colors.text,
    flexShrink: 0,
    fontSize: 17,
    fontWeight: "900"
  },
  recordMain: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  recordMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  recordText: {
    flex: 1,
    gap: 2
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
