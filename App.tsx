import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuthContext } from "./src/hooks/AuthContext";
import { AppDataProvider } from "./src/hooks/AppDataContext";
import { HouseholdProvider, useHouseholdContext } from "./src/hooks/HouseholdContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AuthScreen } from "./src/screens/AuthScreen";
import { HouseholdSetupScreen } from "./src/screens/HouseholdSetupScreen";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";

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
    <AppDataProvider householdId={household.id}>
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
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(true);
  const hideWelcome = useCallback(() => setIsWelcomeVisible(false), []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        {isWelcomeVisible ? (
          <>
            <StatusBar style="dark" />
            <WelcomeScreen onFinish={hideWelcome} />
          </>
        ) : (
          <Root />
        )}
      </AuthProvider>
    </SafeAreaProvider>
  );
}
