import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
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
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignIn = mode === "sign_in";

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setConfirmationEmail("");
  };

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
        setConfirmationEmail(normalizedEmail);
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
        <View style={styles.hero}>
          <Text style={styles.title}>Finanzas compartidas para tu hogar</Text>
          <Text style={styles.copy}>
            {isSignIn
              ? "Entra para sincronizar tus datos entre dispositivos."
              : "Crea tu cuenta y despues invita a tu pareja o conviviente."}
          </Text>
        </View>

        <View style={styles.tabs}>
          <Pressable
            accessibilityRole="button"
            onPress={() => changeMode("sign_in")}
            style={[styles.tab, isSignIn && styles.activeTab]}
          >
            <Text style={[styles.tabText, isSignIn && styles.activeTabText]}>Entrar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => changeMode("sign_up")}
            style={[styles.tab, !isSignIn && styles.activeTab]}
          >
            <Text style={[styles.tabText, !isSignIn && styles.activeTabText]}>Crear cuenta</Text>
          </Pressable>
        </View>

        {confirmationEmail ? (
          <View style={styles.confirmationBox}>
            <Text style={styles.confirmationTitle}>Email de confirmacion enviado</Text>
            <Text style={styles.confirmationText}>
              Revisa {confirmationEmail}. Despues de confirmar, volve a entrar con tu contrasena.
            </Text>
          </View>
        ) : null}

        <TextInputField
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="tu@email.com"
          value={email}
        />
        <View style={styles.passwordGroup}>
          <TextInputField
            autoCapitalize="none"
            autoCorrect={false}
            label="Contrasena"
            onChangeText={setPassword}
            placeholder="Minimo 6 caracteres"
            secureTextEntry={!showPassword}
            value={password}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowPassword((currentValue) => !currentValue)}
            style={styles.passwordToggle}
          >
            <Text style={styles.passwordToggleText}>{showPassword ? "Ocultar" : "Mostrar"}</Text>
          </Pressable>
        </View>

        <PrimaryButton
          label={isSubmitting ? (isSignIn ? "Entrando..." : "Creando cuenta...") : isSignIn ? "Entrar" : "Crear cuenta"}
          onPress={isSubmitting ? () => undefined : submit}
        />
      </Card>

      <View style={styles.noteBox}>
        <Text style={styles.note}>
          Tus datos se guardan en tu hogar compartido y se sincronizan con Supabase cuando inicias sesion.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  activeTabText: {
    color: "#ffffff"
  },
  confirmationBox: {
    backgroundColor: colors.softGreen,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12
  },
  confirmationText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  confirmationTitle: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "900"
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21
  },
  hero: {
    gap: 6
  },
  note: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  noteBox: {
    paddingHorizontal: 4
  },
  passwordGroup: {
    gap: 8
  },
  passwordToggle: {
    alignSelf: "flex-end",
    paddingHorizontal: 2,
    paddingVertical: 2
  },
  passwordToggleText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "900"
  },
  tab: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  tabs: {
    backgroundColor: colors.background,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    padding: 4
  },
  tabText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  }
});
