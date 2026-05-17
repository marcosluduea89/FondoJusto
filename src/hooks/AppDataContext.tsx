import { createContext, ReactNode, useContext } from "react";
import { useAppData } from "./useAppData";

type AppDataContextValue = ReturnType<typeof useAppData>;

const AppDataContext = createContext<AppDataContextValue | null>(null);

// Provider global para que cualquier pantalla pueda leer y modificar los datos locales.
export function AppDataProvider({ children, householdId }: { children: ReactNode; householdId?: string }) {
  const value = useAppData(householdId);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

// Hook de acceso seguro al contexto. Falla temprano si se usa fuera del provider.
export function useAppDataContext(): AppDataContextValue {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppDataContext debe usarse dentro de AppDataProvider");
  }

  return context;
}
