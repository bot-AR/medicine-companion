'use client';

import { create } from 'zustand';
import type { UserProfile, Medicine, DoseSchedule, DoseLog, Theme } from '@medicine/shared';

interface AppState {
  profile: UserProfile | null;
  medicines: Medicine[];
  schedules: DoseSchedule[];
  doseLogs: DoseLog[];
  theme: Theme;

  setProfile: (p: UserProfile | null) => void;
  setMedicines: (m: Medicine[]) => void;
  addMedicine: (m: Medicine) => void;
  updateMedicine: (m: Medicine) => void;
  removeMedicine: (id: string) => void;
  setSchedules: (s: DoseSchedule[]) => void;
  addSchedule: (s: DoseSchedule) => void;
  setDoseLogs: (l: DoseLog[]) => void;
  addDoseLog: (l: DoseLog) => void;
  setTheme: (t: Theme) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  medicines: [],
  schedules: [],
  doseLogs: [],
  theme: 'light',

  setProfile: (profile) => set({ profile }),
  setMedicines: (medicines) => set({ medicines }),
  addMedicine: (m) => set((s) => ({ medicines: [...s.medicines, m] })),
  updateMedicine: (m) =>
    set((s) => ({
      medicines: s.medicines.map((med) => (med.id === m.id ? m : med)),
    })),
  removeMedicine: (id) =>
    set((s) => ({ medicines: s.medicines.filter((m) => m.id !== id) })),
  setSchedules: (schedules) => set({ schedules }),
  addSchedule: (s) => set((st) => ({ schedules: [...st.schedules, s] })),
  setDoseLogs: (doseLogs) => set({ doseLogs }),
  addDoseLog: (l) => set((s) => ({ doseLogs: [...s.doseLogs, l] })),
  setTheme: (theme) => set({ theme }),
}));
