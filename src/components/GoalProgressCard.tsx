import { StyleSheet, Text, View } from "react-native";
import { Goal } from "../models";
import { colors } from "../theme/colors";
import { formatARS } from "../utils/currency";

interface GoalProgressCardProps {
  goals: Goal[];
}

export function GoalProgressCard({ goals }: GoalProgressCardProps) {
  const visibleGoals = goals.filter((goal) => goal.name.trim() && goal.targetAmount > 0);

  if (!visibleGoals.length) {
    return (
      <View>
        <Text style={styles.sectionTitle}>Objetivos</Text>
        <Text style={styles.empty}>Carga hasta 3 objetivos desde Configuracion.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Objetivos</Text>
      {visibleGoals.map((goal) => {
        const progress = Math.max(0, Math.min(1, goal.currentAmount / goal.targetAmount));
        const percentage = Math.round(progress * 100);
        const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

        return (
          <View key={goal.id} style={styles.goal}>
            <View style={styles.header}>
              <Text style={styles.goalName}>{goal.name}</Text>
              <Text style={styles.percentage}>{percentage}%</Text>
            </View>
            <Text style={styles.amounts}>
              {formatARS(goal.currentAmount)} / {formatARS(goal.targetAmount)}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${percentage}%` }]} />
            </View>
            <Text style={styles.remaining}>Faltan {formatARS(remaining)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  amounts: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800"
  },
  container: {
    gap: 12
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  fill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: "100%"
  },
  goal: {
    gap: 6
  },
  goalName: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "900"
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  percentage: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "900"
  },
  remaining: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  },
  track: {
    backgroundColor: colors.background,
    borderRadius: 999,
    height: 10,
    overflow: "hidden"
  }
});
