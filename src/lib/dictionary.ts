import type { Locale } from "@/types";
import fr from "@/dictionaries/fr.json";
import ar from "@/dictionaries/ar.json";

export type Dictionary = typeof fr;

const dictionaries: Record<Locale, Dictionary> = {
  fr,
  ar,
};

export function getDictionary(locale: string): Dictionary {
  if (locale === "ar") {
    return dictionaries.ar;
  }
  return dictionaries.fr;
}
