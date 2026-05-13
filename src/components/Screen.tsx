import { ReactNode } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

interface ScreenProps {
  title: string;
  isLoading?: boolean;
  children: ReactNode;
}

// Contenedor comun de pantalla con titulo, scroll y estado de carga.
export function Screen({ title, isLoading, children }: ScreenProps) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Cargando datos...</Text>
          </View>
        ) : (
          children
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    gap: 16,
    padding: 16,
    paddingTop: 14,
    paddingBottom: 48
  },
  header: {
    borderLeftColor: colors.primary,
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 2
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34
  },
  loading: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 48
  },
  loadingText: {
    color: colors.muted,
    fontSize: 15
  }
});
