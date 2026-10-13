"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";
import { CitizenProfile } from "./types";

interface ProfileContextType {
  profile: CitizenProfile;
  setProfile: (p: CitizenProfile) => void;
  updateProfile: (p: Partial<CitizenProfile>) => void;
  clearProfile: () => void;
  loadDemoProfile: (type: "farmer" | "student" | "vulnerable_family" | "senior_citizen") => void;
}

const STORAGE_KEY = "policypilot_citizen_profile";

const DEFAULT_PROFILE: CitizenProfile = {
  state: "TS",
  age: 42,
  annual_income_inr: 120000,
  occupation: "farmer",
  category: "OBC",
  landholding_acres: 2.5,
  gender: "female",
  is_institutional_landholder: false,
  is_government_employee: false,
  is_income_tax_payee: false,
  residence_area: "rural",
  owns_pucca_house: false,
  has_motorized_vehicle: false,
  has_kcc_above_50k: false,
  goal: "farming financial support",
};

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(callback: () => void) {
  listeners.push(callback);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
  }
  return () => {
    listeners = listeners.filter((l) => l !== callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", callback);
    }
  };
}

function getSnapshot(): string {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved;
    } catch {
      // ignore
    }
  }
  return JSON.stringify(DEFAULT_PROFILE);
}

function getServerSnapshot(): string {
  return JSON.stringify(DEFAULT_PROFILE);
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const profileJson = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const profile: CitizenProfile = React.useMemo(() => {
    try {
      return JSON.parse(profileJson);
    } catch {
      return DEFAULT_PROFILE;
    }
  }, [profileJson]);

  const setProfile = (newProfile: CitizenProfile) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
      } catch {
        // ignore
      }
    }
    emitChange();
  };

  const updateProfile = (updates: Partial<CitizenProfile>) => {
    const merged = { ...profile, ...updates };
    setProfile(merged);
  };

  const clearProfile = () => {
    const empty: CitizenProfile = {};
    setProfile(empty);
  };

  const loadDemoProfile = (type: "farmer" | "student" | "vulnerable_family" | "senior_citizen") => {
    if (type === "farmer") {
      setProfile({
        state: "TS",
        age: 45,
        annual_income_inr: 140000,
        occupation: "farmer",
        category: "OBC",
        landholding_acres: 3.2,
        gender: "male",
        disability_percent: 0,
        is_minority: false,
        is_institutional_landholder: false,
        is_government_employee: false,
        is_mts_or_class_iv: false,
        has_constitutional_post_holder: false,
        has_specified_elected_representative: false,
        has_pensioner_above_10k_non_mts: false,
        is_income_tax_payee: false,
        has_practicing_professional: false,
        is_nri_or_foreign_resident: false,
        residence_area: "rural",
        owns_pucca_house: false,
        lives_in_kutcha_house: true,
        has_more_than_two_pucca_rooms: false,
        has_motorized_vehicle: false,
        has_mechanized_agri_equipment: false,
        has_kcc_above_50k: false,
        has_registered_non_agri_enterprise: false,
        earns_above_15k_monthly: false,
        pays_professional_tax: false,
        goal: "agricultural subsidy and input investment support",
      });
    } else if (type === "student") {
      setProfile({
        state: "TS",
        age: 19,
        annual_income_inr: 180000,
        occupation: "student",
        category: "SC",
        education_level: "undergraduate",
        gender: "female",
        landholding_acres: 0,
        disability_percent: 0,
        is_minority: false,
        residence_area: "rural",
        goal: "post-matric college tuition scholarship and hostel support",
      });
    } else if (type === "vulnerable_family") {
      setProfile({
        state: "DL",
        age: 38,
        annual_income_inr: 95000,
        occupation: "daily-wage worker",
        category: "EWS",
        gender: "female",
        landholding_acres: 0,
        disability_percent: 0,
        is_minority: true,
        residence_area: "rural",
        owns_pucca_house: false,
        lives_in_kutcha_house: true,
        has_more_than_two_pucca_rooms: false,
        has_motorized_vehicle: false,
        has_mechanized_agri_equipment: false,
        has_kcc_above_50k: false,
        is_government_employee: false,
        has_registered_non_agri_enterprise: false,
        earns_above_15k_monthly: false,
        is_income_tax_payee: false,
        pays_professional_tax: false,
        goal: "health cover and family social welfare assistance",
      });
    } else if (type === "senior_citizen") {
      setProfile({
        state: "TS",
        age: 74,
        annual_income_inr: 850000,
        occupation: "retired",
        category: "GEN",
        gender: "male",
        landholding_acres: 0,
        disability_percent: 0,
        is_minority: false,
        residence_area: "urban",
        goal: "AB PM-JAY senior citizen health coverage (70+ pathway)",
      });
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        setProfile,
        updateProfile,
        clearProfile,
        loadDemoProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
