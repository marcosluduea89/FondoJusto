import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AppDataProvider } from "./src/hooks/AppDataContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

// Punto de entrada de la app: envuelve toda la experiencia con navegacion.
export default function App() {
  return (
    <AppDataProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </AppDataProvider>
  );
}
