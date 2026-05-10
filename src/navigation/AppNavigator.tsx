import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BackupScreen } from "../screens/BackupScreen";
import { ConfigScreen } from "../screens/ConfigScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { ExpenseScreen } from "../screens/ExpenseScreen";
import { GraphScreen } from "../screens/GraphScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { IncomeScreen } from "../screens/IncomeScreen";
import { MonthlyDetailScreen } from "../screens/MonthlyDetailScreen";
import { colors } from "../theme/colors";

export type RootTabParamList = {
  Dashboard: undefined;
  Income: undefined;
  Expense: undefined;
  Config: undefined;
  Detail: undefined;
  Graph: undefined;
  Backup: undefined;
  History: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

// Navegacion principal del MVP: cada pestana representa una tarea cotidiana.
export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border }
      }}
    >
      <Tab.Screen component={DashboardScreen} name="Dashboard" options={{ title: "Inicio" }} />
      <Tab.Screen component={IncomeScreen} name="Income" options={{ title: "Ingreso" }} />
      <Tab.Screen component={ExpenseScreen} name="Expense" options={{ title: "Gasto" }} />
      <Tab.Screen component={ConfigScreen} name="Config" options={{ title: "Config" }} />
      <Tab.Screen component={MonthlyDetailScreen} name="Detail" options={{ title: "Detalle" }} />
      <Tab.Screen component={GraphScreen} name="Graph" options={{ title: "Grafica" }} />
      <Tab.Screen component={BackupScreen} name="Backup" options={{ title: "Backup" }} />
      <Tab.Screen component={HistoryScreen} name="History" options={{ title: "Historial" }} />
    </Tab.Navigator>
  );
}
