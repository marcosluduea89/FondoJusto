import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";

// Caja reutilizable para agrupar informacion relacionada sin duplicar estilos.
export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.softBorder,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    gap: 12,
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8
  }
});
