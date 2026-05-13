import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackupScreen } from "../screens/BackupScreen";
import { CloseMonthScreen } from "../screens/CloseMonthScreen";
import { ConfigScreen } from "../screens/ConfigScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { ExpenseScreen } from "../screens/ExpenseScreen";
import { GraphScreen } from "../screens/GraphScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { IncomeScreen } from "../screens/IncomeScreen";
import { MoreScreen } from "../screens/MoreScreen";
import { MonthlyDetailScreen } from "../screens/MonthlyDetailScreen";
import { colors } from "../theme/colors";
import type { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

const hiddenTabOptions = {
  tabBarButton: () => null,
  tabBarItemStyle: { display: "none" as const }
};

function TabIcon({ focused, label }: { focused: boolean; label: string }) {
  return (
    <View style={[styles.tabIcon, focused && styles.activeTabIcon]}>
      <Text style={[styles.tabIconText, focused && styles.activeTabIconText]}>{label}</Text>
    </View>
  );
}

// Navegacion principal: deja a mano lo cotidiano y agrupa lo secundario en Mas.
export function AppNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 24);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.softBorder,
          borderTopWidth: 1,
          elevation: 10,
          height: 70 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          shadowColor: "#000000",
          shadowOffset: { height: -2, width: 0 },
          shadowOpacity: 0.08,
          shadowRadius: 8
        }
      }}
    >
      <Tab.Screen
        component={DashboardScreen}
        name="Dashboard"
        options={{ title: "Inicio", tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="I" /> }}
      />
      <Tab.Screen
        component={IncomeScreen}
        name="Income"
        options={{ title: "Ingreso", tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="$" /> }}
      />
      <Tab.Screen
        component={ExpenseScreen}
        name="Expense"
        options={{ title: "Gasto", tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="-" /> }}
      />
      <Tab.Screen
        component={ConfigScreen}
        name="Config"
        options={{ title: "Ajustes", tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="A" /> }}
      />
      <Tab.Screen
        component={MoreScreen}
        name="More"
        options={{ title: "Mas", tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="+" /> }}
      />
      <Tab.Screen component={CloseMonthScreen} name="Close" options={{ title: "Cierre", ...hiddenTabOptions }} />
      <Tab.Screen component={MonthlyDetailScreen} name="Detail" options={{ title: "Mes", ...hiddenTabOptions }} />
      <Tab.Screen component={GraphScreen} name="Graph" options={{ title: "Graf", ...hiddenTabOptions }} />
      <Tab.Screen component={HistoryScreen} name="History" options={{ title: "Historial", ...hiddenTabOptions }} />
      <Tab.Screen component={BackupScreen} name="Backup" options={{ title: "Copia", ...hiddenTabOptions }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  activeTabIcon: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  activeTabIconText: {
    color: "#ffffff"
  },
  tabIcon: {
    alignItems: "center",
    backgroundColor: colors.softGreen,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    width: 34
  },
  tabIconText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "900"
  },
  tabItem: {
    paddingVertical: 2
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "900",
    paddingTop: 2
  }
});
