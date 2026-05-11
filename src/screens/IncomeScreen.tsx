import { Alert, StyleSheet, View } from "react-native";
import { useMemo, useState } from "react";
import { Card } from "../components/Card";
import { MonthSelector } from "../components/MonthSelector";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { StatRow } from "../components/StatRow";
import { TextInputField } from "../components/TextInputField";
import { useAppDataContext } from "../hooks/AppDataContext";
import { Income, PersonId } from "../models";
import { formatAmountInput, formatARS, parseAmountInput } from "../utils/currency";
import { getTodayISODate } from "../utils/dates";
import { createId } from "../utils/ids";
import { getConfiguredPeople, getPersonName } from "../utils/people";
import { isValidISODate, isValidMonthKey } from "../utils/validation";

// Formulario para cargar ingresos de Marcos, esposa u otros conceptos familiares.
export function IncomeScreen() {
  const {
    data,
    addIncome,
    updateIncome,
    deleteIncome,
    getMonthStatus,
    isLoading,
    selectedMonth,
    setSelectedMonth
  } = useAppDataContext();
  const [personId, setPersonId] = useState<PersonId>("marcos");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayISODate());
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);

  const monthIncomes = useMemo(
    () => data?.incomes.filter((income) => income.month === selectedMonth) ?? [],
    [data, selectedMonth]
  );
  const people = getConfiguredPeople(data?.people);

  const resetForm = () => {
    setEditingIncomeId(null);
    setPersonId("marcos");
    setDescription("");
    setAmount("");
    setDate(getTodayISODate());
  };

  const editIncome = (income: Income) => {
    setEditingIncomeId(income.id);
    setSelectedMonth(income.month);
    setPersonId(income.personId);
    setDescription(income.description);
    setAmount(formatAmountInput(String(income.amount)));
    setDate(income.date);
  };

  const saveIncome = async () => {
    const parsedAmount = parseAmountInput(amount);
    const monthStatus = getMonthStatus(selectedMonth);

    if (monthStatus === "closed") {
      Alert.alert("Mes cerrado", "Reabri el mes desde Cierre mensual antes de modificar ingresos.");
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
      Alert.alert("Monto invalido", "El ingreso debe ser mayor a cero.");
      return;
    }

    const income: Income = {
      id: editingIncomeId ?? createId("income"),
      month: selectedMonth,
      personId,
      description: description.trim() || "Ingreso",
      amount: parsedAmount,
      date
    };

    if (editingIncomeId) {
      await updateIncome(income);
    } else {
      await addIncome(income);
    }

    resetForm();
    Alert.alert("Ingreso guardado", "El ingreso quedo registrado en el mes seleccionado.");
  };

  const removeIncome = (incomeId: string) => {
    Alert.alert("Eliminar ingreso", "Esta accion no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteIncome(incomeId);
          if (editingIncomeId === incomeId) resetForm();
        }
      }
    ]);
  };

  return (
    <Screen isLoading={isLoading} title="Cargar ingreso">
      <Card>
        <MonthSelector label="Mes" onChange={setSelectedMonth} value={selectedMonth} />
        <SegmentedControl
          label="Persona"
          onChange={setPersonId}
          options={people.map((person) => ({ label: person.name, value: person.id }))}
          value={personId}
        />
        <TextInputField label="Descripcion" onChangeText={setDescription} placeholder="Sueldo, extra..." value={description} />
        <TextInputField
          keyboardType="numeric"
          label="Monto"
          onChangeText={(value) => setAmount(formatAmountInput(value))}
          placeholder="Ej: 1.200.000"
          value={amount}
        />
        <TextInputField label="Fecha" onChangeText={setDate} placeholder="YYYY-MM-DD" value={date} />
        <PrimaryButton label={editingIncomeId ? "Actualizar ingreso" : "Guardar ingreso"} onPress={saveIncome} />
        {editingIncomeId && <PrimaryButton label="Cancelar edicion" onPress={resetForm} variant="secondary" />}
      </Card>

      <Card>
        <SegmentedControl
          label="Ingresos del mes"
          onChange={(incomeId) => {
            const income = monthIncomes.find((item) => item.id === incomeId);
            if (income) editIncome(income);
          }}
          options={
            monthIncomes.length
              ? monthIncomes.map((income) => ({
                  label: `${income.description} - ${formatARS(income.amount)}`,
                  value: income.id
                }))
              : [{ label: "Sin ingresos", value: "none" }]
          }
          value={editingIncomeId ?? "none"}
        />
        {monthIncomes.map((income) => (
          <View key={income.id} style={styles.record}>
            <StatRow label={`${income.description} (${getPersonName(data?.people, income.personId)})`} value={formatARS(income.amount)} />
            <PrimaryButton label="Editar" onPress={() => editIncome(income)} variant="secondary" />
            <PrimaryButton label="Eliminar" onPress={() => removeIncome(income.id)} variant="danger" />
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
