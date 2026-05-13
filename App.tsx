import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuthContext } from "./src/hooks/AuthContext";
import { AppDataProvider } from "./src/hooks/AppDataContext";
import { HouseholdProvider, useHouseholdContext } from "./src/hooks/HouseholdContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AuthScreen } from "./src/screens/AuthScreen";
import { HouseholdSetupScreen } from "./src/screens/HouseholdSetupScreen";

function AuthenticatedRoot() {
  const { household, isLoading } = useHouseholdContext();

  if (isLoading || !household) {
    return (
      <>
        <StatusBar style="dark" />
        <HouseholdSetupScreen />
      </>
    );
  }

  return (
    <AppDataProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </AppDataProvider>
  );
}

function Root() {
  const { session } = useAuthContext();

  if (!session) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthScreen />
      </>
    );
  }

  return (
    <HouseholdProvider>
      <AuthenticatedRoot />
    </HouseholdProvider>
  );
}

// Punto de entrada de la app: envuelve toda la experiencia con navegacion.
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
