import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";
import type { RootTabParamList } from "../navigation/types";

type MoreNavigation = BottomTabNavigationProp<RootTabParamList, "More">;
type MoreTarget = Exclude<keyof RootTabParamList, "Dashboard" | "Income" | "Expense" | "Config" | "More">;

interface MoreItem {
  label: string;
  target: MoreTarget;
}

const movementItems: MoreItem[] = [
  { label: "Cierre mensual", target: "Close" },
  { label: "Detalle del mes", target: "Detail" }
];

const reviewItems: MoreItem[] = [
  { label: "Graficas", target: "Graph" },
  { label: "Historial", target: "History" },
  { label: "Copia de seguridad", target: "Backup" }
];

function MenuRow({ item, onPress }: { item: MoreItem; onPress: (target: MoreTarget) => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(item.target)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text style={styles.rowLabel}>{item.label}</Text>
      <Text style={styles.chevron}>{">"}</Text>
    </Pressable>
  );
}

export function MoreScreen() {
  const navigation = useNavigation<MoreNavigation>();
  const openScreen = (target: MoreTarget) => navigation.navigate(target);

  return (
    <Screen title="Mas">
      <Card>
        <Text style={styles.sectionTitle}>Movimientos</Text>
        <View style={styles.list}>
          {movementItems.map((item) => (
            <MenuRow item={item} key={item.target} onPress={openScreen} />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Revision</Text>
        <View style={styles.list}>
          {reviewItems.map((item) => (
            <MenuRow item={item} key={item.target} onPress={openScreen} />
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chevron: {
    color: colors.muted,
    fontSize: 20,
    fontWeight: "800"
  },
  list: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden"
  },
  pressed: {
    backgroundColor: colors.softGreen
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: 14
  },
  rowLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  }
});
