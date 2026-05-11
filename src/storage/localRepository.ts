import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppData } from "../models";
import { DEFAULT_GOALS, Goal } from "../models/goal";
import { PEOPLE } from "../models/person";
import { seedData } from "./seedData";

const STORAGE_KEY = "@fondojusto/app-data";

function normalizeGoals(goals?: Goal[]): Goal[] {
  return DEFAULT_GOALS.map((defaultGoal) => ({
    ...defaultGoal,
    ...goals?.find((goal) => goal.id === defaultGoal.id)
  }));
}

function normalizeData(data: AppData): AppData {
  return {
    ...data,
    people: data.people ?? PEOPLE,
    goals: normalizeGoals(data.goals),
    monthStates: data.monthStates ?? [],
    appSettings: {
      closeDay: data.appSettings?.closeDay ?? 31,
      discountPersonalOverages: data.appSettings?.discountPersonalOverages ?? true
    }
  };
}

// Contrato de persistencia. Una segunda etapa puede implementar esto con Google Sheets/Drive.
export interface AppRepository {
  load(): Promise<AppData>;
  save(data: AppData): Promise<void>;
  reset(): Promise<AppData>;
}

// Repositorio local del MVP: guarda todo el estado como JSON en el dispositivo.
export const localRepository: AppRepository = {
  async load() {
    const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
      return seedData;
    }

    return normalizeData(JSON.parse(storedValue) as AppData);
  },

  async save(data) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  async reset() {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return seedData;
  }
};
