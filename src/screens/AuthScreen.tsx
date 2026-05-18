import { Alert, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TextInputField } from "../components/TextInputField";
import { useAuthContext } from "../hooks/AuthContext";
import { colors } from "../theme/colors";

type AuthMode = "sign_in" | "sign_up";

export function AuthScreen() {
  const { isLoading, signIn, signUp } = useAuthContext();
  const [mode, setMode] = useState<AuthMode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignIn = mode === "sign_in";

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert("Datos incompletos", "Ingresa email y contrasena.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Contrasena corta", "Usa al menos 6 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignIn) {
        await signIn(normalizedEmail, password);
      } else {
        await signUp(normalizedEmail, password);
        Alert.alert(
          "Cuenta creada",
          "Revisa tu correo para confirmar la cuenta. El enlace deberia volver a abrir FondoJusto."
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo completar la operacion.";
      Alert.alert("Supabase", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen isLoading={isLoading} title="FondoJusto">
      <Card>
        <Text style={styles.title}>{isSignIn ? "Entrar" : "Crear cuenta"}</Text>
        <Text style={styles.copy}>
          {isSignIn
            ? "Accede para preparar la sincronizacion entre celulares."
            : "Crea tu usuario para despues compartir los datos con tu pareja."}
        </Text>

        <TextInputField
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="tu@email.com"
          value={email}
        />
        <TextInputField
          autoCapitalize="none"
          autoCorrect={false}
          label="Contrasena"
          onChangeText={setPassword}
          placeholder="Minimo 6 caracteres"
          secureTextEntry
          value={password}
        />

        <PrimaryButton
          label={isSubmitting ? "Procesando..." : isSignIn ? "Entrar" : "Crear cuenta"}
          onPress={submit}
        />
        <PrimaryButton
          label={isSignIn ? "Crear una cuenta" : "Ya tengo cuenta"}
          onPress={() => setMode(isSignIn ? "sign_up" : "sign_in")}
          variant="secondary"
        />
      </Card>

      <View style={styles.noteBox}>
        <Text style={styles.note}>
          Por ahora los datos financieros siguen guardandose localmente. Este paso deja lista la identidad para conectar el hogar compartido.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21
  },
  note: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  noteBox: {
    paddingHorizontal: 4
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  }
});
