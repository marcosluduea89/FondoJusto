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
import { Income, PersonId } from "../models";
import { colors } from "../theme/colors";
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

  const changeDate = (nextDate: string) => {
    setDate(nextDate);
    setSelectedMonth(nextDate.slice(0, 7));
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
        <DateSelector label="Fecha" onChange={changeDate} value={date} />
        <PrimaryButton label={editingIncomeId ? "Actualizar ingreso" : "Guardar ingreso"} onPress={saveIncome} />
        {editingIncomeId && <PrimaryButton label="Cancelar edicion" onPress={resetForm} variant="secondary" />}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Ingresos del mes</Text>
        {monthIncomes.length ? (
          monthIncomes.map((income) => (
            <View key={income.id} style={[styles.record, editingIncomeId === income.id && styles.activeRecord]}>
              <View style={styles.recordMain}>
                <View style={styles.recordText}>
                  <Text numberOfLines={1} style={styles.recordTitle}>
                    {income.description}
                  </Text>
                  <Text numberOfLines={1} style={styles.recordMeta}>
                    {getPersonName(data?.people, income.personId)} · {income.date}
                  </Text>
                </View>
                <Text style={styles.recordAmount}>{formatARS(income.amount)}</Text>
              </View>
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" onPress={() => editIncome(income)} style={styles.actionButton}>
                  <Text style={styles.actionText}>Editar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => removeIncome(income.id)}
                  style={[styles.actionButton, styles.deleteButton]}
                >
                  <Text style={[styles.actionText, styles.deleteText]}>Eliminar</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No hay ingresos cargados para este mes.</Text>
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
    fontSize: 13
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
