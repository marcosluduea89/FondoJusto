import { ReactNode } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOptionalAppDataContext } from "../hooks/AppDataContext";
import { SyncStatus } from "../hooks/useAppData";
import { colors } from "../theme/colors";

interface ScreenProps {
  title: string;
  isLoading?: boolean;
  children: ReactNode;
}

function formatSyncTime(value: string | null): string | null {
  if (!value) return null;

  return new Date(value).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getSyncLabel(status: SyncStatus): string {
  if (status.state === "loading") return "Sincronizando...";
  if (status.state === "saving") return "Guardando...";
  if (status.state === "error") return "Error de sincronizacion";

  return "Sincronizado";
}

function SyncStatusPill({ status }: { status: SyncStatus }) {
  if (!status.isCloudEnabled) return null;

  const lastUpdatedTime = formatSyncTime(status.lastUpdatedAt);
  const isError = status.state === "error";
  const isWorking = status.state === "loading" || status.state === "saving";

  return (
    <View style={[styles.syncPill, isError && styles.syncPillError]}>
      <View style={[styles.syncDot, isWorking && styles.syncDotWorking, isError && styles.syncDotError]} />
      <View style={styles.syncTextGroup}>
        <Text style={[styles.syncLabel, isError && styles.syncLabelError]}>{getSyncLabel(status)}</Text>
        {lastUpdatedTime && <Text style={styles.syncTime}>Ultima actualizacion: {lastUpdatedTime}</Text>}
      </View>
    </View>
  );
}

// Contenedor comun de pantalla con titulo, scroll y estado de carga.
export function Screen({ title, isLoading, children }: ScreenProps) {
  const appDataContext = useOptionalAppDataContext();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {appDataContext?.syncStatus && <SyncStatusPill status={appDataContext.syncStatus} />}
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
    gap: 10,
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
  },
  syncDot: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    height: 10,
    width: 10
  },
  syncDotError: {
    backgroundColor: colors.danger
  },
  syncDotWorking: {
    backgroundColor: colors.warning
  },
  syncLabel: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "800"
  },
  syncLabelError: {
    color: colors.danger
  },
  syncPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.softGreen,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  syncPillError: {
    backgroundColor: "#fff4f2",
    borderColor: "#f2b8b0"
  },
  syncTextGroup: {
    gap: 2
  },
  syncTime: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  }
});
