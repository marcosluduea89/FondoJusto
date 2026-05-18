import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import { useAuthContext } from "./AuthContext";

interface Household {
  id: string;
  name: string;
}

interface HouseholdMember {
  displayName: string;
  role: string;
  userId: string;
}

interface HouseholdInvite {
  code: string;
  expiresAt: string;
}

interface HouseholdContextValue {
  activeInvite: HouseholdInvite | null;
  createHousehold: (name: string) => Promise<void>;
  createInviteCode: () => Promise<string>;
  household: Household | null;
  members: HouseholdMember[];
  isLoading: boolean;
  joinHousehold: (code: string) => Promise<void>;
  refreshAccountDetails: () => Promise<void>;
  refreshHousehold: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

function createCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pieces = Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]);

  return `${pieces.slice(0, 4).join("")}-${pieces.slice(4).join("")}`;
}

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const [activeInvite, setActiveInvite] = useState<HouseholdInvite | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAccountDetails = async (householdId = household?.id) => {
    if (!householdId) {
      setMembers([]);
      setActiveInvite(null);
      return;
    }

    const [membersResult, inviteResult] = await Promise.all([
      supabase.from("household_members").select("role, user_id").eq("household_id", householdId).order("role"),
      supabase
        .from("household_invites")
        .select("code, expires_at")
        .eq("household_id", householdId)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    if (membersResult.error) throw membersResult.error;
    if (inviteResult.error) throw inviteResult.error;

    const userIds = (membersResult.data ?? []).map((member) => member.user_id);
    const profilesResult = userIds.length
      ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
      : { data: [], error: null };

    if (profilesResult.error) throw profilesResult.error;

    const profileNames = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.display_name]));
    setMembers(
      (membersResult.data ?? []).map((member) => ({
        displayName: profileNames.get(member.user_id) ?? (member.user_id === user?.id ? user?.email ?? "Usuario actual" : "Miembro"),
        role: member.role,
        userId: member.user_id
      }))
    );
    setActiveInvite(inviteResult.data ? { code: inviteResult.data.code, expiresAt: inviteResult.data.expires_at } : null);
  };

  const refreshHousehold = async () => {
    if (!user) {
      setHousehold(null);
      setMembers([]);
      setActiveInvite(null);
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
    const nextHousehold = householdData ? { id: householdData.id, name: householdData.name } : null;
    setHousehold(nextHousehold);
    await refreshAccountDetails(nextHousehold?.id);
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
    await refreshAccountDetails(newHousehold.id);
  };

  const createInviteCode = async (): Promise<string> => {
    if (!user || !household) return "";

    const code = createCode();
    const { error } = await supabase.from("household_invites").insert({
      code,
      created_by: user.id,
      household_id: household.id
    });

    if (error) throw error;

    await refreshAccountDetails();
    return code;
  };

  const joinHousehold = async (code: string) => {
    const normalizedCode = code.trim().toUpperCase();
    const { error } = await supabase.rpc("join_household", { invite_code: normalizedCode });

    if (error) throw error;

    await refreshHousehold();
  };

  const value = useMemo<HouseholdContextValue>(
    () => ({
      activeInvite,
      createHousehold,
      createInviteCode,
      household,
      members,
      isLoading,
      joinHousehold,
      refreshAccountDetails,
      refreshHousehold
    }),
    [activeInvite, household, isLoading, members, user?.id]
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
