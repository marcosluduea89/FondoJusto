import { Alert, Share, StyleSheet, Text } from "react-native";
import { useMemo, useState } from "react";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TextInputField } from "../components/TextInputField";
import { useAppDataContext } from "../hooks/AppDataContext";
import { buildBackupText, parseBackupText } from "../services/backup";
import { colors } from "../theme/colors";

// Backup local sin servidor: exporta JSON y permite restaurarlo pegando el contenido.
export function BackupScreen() {
  const { data, importData, isLoading } = useAppDataContext();
  const [importText, setImportText] = useState("");
  const backupText = useMemo(() => (data ? buildBackupText(data) : ""), [data]);

  const shareBackup = async () => {
    if (!backupText) return;

    await Share.share({
      title: "Backup FondoJusto",
      message: backupText
    });
  };

  const confirmImport = () => {
    Alert.alert("Importar backup", "Esto reemplazara todos los datos locales actuales.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Importar",
        style: "destructive",
        onPress: async () => {
          try {
            const parsedData = parseBackupText(importText);
            await importData(parsedData);
            setImportText("");
            Alert.alert("Backup importado", "Los datos locales fueron reemplazados correctamente.");
          } catch (error) {
            Alert.alert(
              "Backup invalido",
              error instanceof Error ? error.message : "No se pudo leer el backup pegado."
            );
          }
        }
      }
    ]);
  };

  return (
    <Screen isLoading={isLoading} title="Backup">
      <Card>
        <Text style={styles.title}>Exportar</Text>
        <Text style={styles.note}>
          Comparte un JSON con todos los ingresos, gastos, reintegros, cierres y configuraciones locales.
        </Text>
        <PrimaryButton label="Exportar backup" onPress={shareBackup} />
      </Card>

      <Card>
        <Text style={styles.title}>Importar</Text>
        <Text style={styles.note}>Pega un backup exportado previamente para restaurar la app.</Text>
        <TextInputField
          label="JSON de backup"
          multiline
          onChangeText={setImportText}
          placeholder="{ ... }"
          value={importText}
        />
        <PrimaryButton label="Importar backup" onPress={confirmImport} variant="danger" />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  }
});
