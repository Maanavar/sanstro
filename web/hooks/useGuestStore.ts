"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "vinaadi-guest";

export type GuestRasi = {
  id: number;       // 1–12
  en: string;
  ta: string;
};

type GuestStore = {
  rasiId: number | null;
};

export const RASI_LIST: GuestRasi[] = [
  { id: 1,  en: "Mesham",     ta: "மேஷம்"      },
  { id: 2,  en: "Rishabam",   ta: "ரிஷபம்"     },
  { id: 3,  en: "Mithunam",   ta: "மிதுனம்"    },
  { id: 4,  en: "Kadagam",    ta: "கடகம்"      },
  { id: 5,  en: "Simmam",     ta: "சிம்மம்"    },
  { id: 6,  en: "Kanni",      ta: "கன்னி"      },
  { id: 7,  en: "Thulam",     ta: "துலாம்"     },
  { id: 8,  en: "Viruchigam", ta: "விருச்சிகம்" },
  { id: 9,  en: "Dhanusu",    ta: "தனுசு"      },
  { id: 10, en: "Magaram",    ta: "மகரம்"      },
  { id: 11, en: "Kumbam",     ta: "கும்பம்"    },
  { id: 12, en: "Meenam",     ta: "மீனம்"      },
];

export function useGuestStore() {
  const [rasiId, setRasiIdState] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<GuestStore>;
        if (parsed.rasiId !== undefined) setRasiIdState(parsed.rasiId);
      }
    } catch { /* ignore */ }
  }, []);

  const setRasi = useCallback((id: number | null) => {
    setRasiIdState(id);
    try {
      if (id === null) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ rasiId: id }));
      }
    } catch { /* ignore */ }
  }, []);

  const selectedRasi = RASI_LIST.find((r) => r.id === rasiId) ?? null;

  return { rasiId, selectedRasi, setRasi };
}
