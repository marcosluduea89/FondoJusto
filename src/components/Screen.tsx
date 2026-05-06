import { ReactNode } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

interface ScreenProps {
  title: string;
  isLoading?: boolean;
  children: ReactNode;
}

// Contenedor comun de pantalla con titulo, scroll y estado de carga.
export function Screen({ title, isLoading, children }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{title}</Text>
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
    paddingBottom: 32
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800"
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
