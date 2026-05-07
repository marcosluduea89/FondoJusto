import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppData } from "../models";
import { PEOPLE } from "../models/person";
import { seedData } from "./seedData";

const STORAGE_KEY = "@fondojusto/app-data";

function normalizeData(data: AppData): AppData {
  return {
    ...data,
    people: data.people ?? PEOPLE,
    monthStates: data.monthStates ?? []
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
