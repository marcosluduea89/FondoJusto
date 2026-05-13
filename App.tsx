import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppDataProvider } from "./src/hooks/AppDataContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

// Punto de entrada de la app: envuelve toda la experiencia con navegacion.
export default function App() {
  return (
    <SafeAreaProvider>
      <AppDataProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </AppDataProvider>
    </SafeAreaProvider>
  );
}
