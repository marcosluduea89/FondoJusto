import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import { useAuthContext } from "./AuthContext";

interface Household {
  id: string;
  name: string;
}

interface HouseholdContextValue {
  createHousehold: (name: string) => Promise<void>;
  household: Household | null;
  isLoading: boolean;
  refreshHousehold: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const [household, setHousehold] = useState<Household | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshHousehold = async () => {
    if (!user) {
      setHousehold(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("household_members")
      .select("household_id, households(id, name)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      setIsLoading(false);
      throw error;
    }

    const householdData = Array.isArray(data?.households) ? data?.households[0] : data?.households;
    setHousehold(householdData ? { id: householdData.id, name: householdData.name } : null);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshHousehold().catch(() => setIsLoading(false));
  }, [user?.id]);

  const createHousehold = async (name: string) => {
    if (!user) return;

    const householdName = name.trim() || "Mi hogar";
    const { data: newHousehold, error: householdError } = await supabase
      .from("households")
      .insert({ created_by: user.id, name: householdName })
      .select("id, name")
      .single();

    if (householdError) throw householdError;

    const { error: memberError } = await supabase.from("household_members").insert({
      household_id: newHousehold.id,
      role: "owner",
      user_id: user.id
    });

    if (memberError) throw memberError;

    const { error: profileError } = await supabase.from("profiles").upsert({
      display_name: user.email ?? "Usuario",
      id: user.id
    });

    if (profileError) throw profileError;

    const { error: settingsError } = await supabase.from("app_settings").upsert({
      household_id: newHousehold.id
    });

    if (settingsError) throw settingsError;

    setHousehold({ id: newHousehold.id, name: newHousehold.name });
  };

  const value = useMemo<HouseholdContextValue>(
    () => ({
      createHousehold,
      household,
      isLoading,
      refreshHousehold
    }),
    [household, isLoading, user?.id]
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHouseholdContext(): HouseholdContextValue {
  const context = useContext(HouseholdContext);

  if (!context) {
    throw new Error("useHouseholdContext debe usarse dentro de HouseholdProvider");
  }

  return context;
}
