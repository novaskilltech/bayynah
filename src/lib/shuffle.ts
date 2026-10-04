/**
 * Générateur pseudo-aléatoire déterministe avec graine (PRNG).
 * Permet un mélange aléatoire reproductible sans discordance SSR/Client (hydration mismatch).
 */
export function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Algorithme de Fisher-Yates avec générateur pseudo-aléatoire congruente linéaire.
 * Renvoie un nouveau tableau mélangé de manière déterministe selon la graine.
 */
export function shuffleWithSeed<T>(array: readonly T[], seed: number): T[] {
  const result = [...array];
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }

  return result;
}
