"use client";

import { Eye } from "lucide-react";
import { useEffect, useState } from "react";

const SESSION_KEY = "tabayyun-visit-counted";
const SESSION_COUNT_KEY = "tabayyun-visit-count";
let visitRequest: Promise<number> | null = null;

function getOrRecordVisit(): Promise<number> {
  const savedCount = Number(sessionStorage.getItem(SESSION_COUNT_KEY));
  if (sessionStorage.getItem(SESSION_KEY) === "1" && Number.isSafeInteger(savedCount) && savedCount >= 0) {
    return Promise.resolve(savedCount);
  }

  if (visitRequest) return visitRequest;

  visitRequest = fetch("/api/visits", {
    method: "POST",
    cache: "no-store",
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { count?: unknown };
      if (typeof data.count !== "number" || !Number.isSafeInteger(data.count) || data.count < 0) {
        throw new Error("Réponse du compteur invalide");
      }
      sessionStorage.setItem(SESSION_KEY, "1");
      sessionStorage.setItem(SESSION_COUNT_KEY, String(data.count));
      return data.count;
    })
    .catch((error: unknown) => {
      visitRequest = null;
      throw error;
    });

  return visitRequest;
}

interface VisitCounterProps {
  locale: string;
}

export default function VisitCounter({ locale }: VisitCounterProps) {
  const [count, setCount] = useState<number | null>(null);
  const isArabic = locale === "ar";

  useEffect(() => {
    let active = true;
    getOrRecordVisit()
      .then((nextCount) => {
        if (active) setCount(nextCount);
      })
      .catch((error: unknown) => {
        console.warn("Compteur de visites indisponible", error);
      });

    return () => {
      active = false;
    };
  }, []);

  if (count === null) return null;

  const formattedCount = new Intl.NumberFormat(isArabic ? "ar" : "fr-FR").format(count);

  return (
    <p className="mt-3 inline-flex items-center justify-center gap-1.5" aria-live="polite">
      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
      <span>
        {isArabic ? `${formattedCount} زيارة` : `${formattedCount} visite${count > 1 ? "s" : ""}`}
      </span>
    </p>
  );
}
