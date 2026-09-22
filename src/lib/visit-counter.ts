export const GLOBAL_VISIT_COUNTER_KEY = "global";

export interface VisitCounterStore {
  upsert(args: {
    where: { key: string };
    create: { key: string; count: bigint };
    update: { count: { increment: bigint } };
    select: { count: true };
  }): Promise<{ count: bigint }>;
}

/** Incrémente atomiquement le compteur global et retourne une valeur JSON-safe. */
export async function incrementVisitCounter(store: VisitCounterStore): Promise<number> {
  const result = await store.upsert({
    where: { key: GLOBAL_VISIT_COUNTER_KEY },
    create: { key: GLOBAL_VISIT_COUNTER_KEY, count: BigInt(1) },
    update: { count: { increment: BigInt(1) } },
    select: { count: true },
  });

  const count = Number(result.count);
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError("Le compteur de visites dépasse la plage JSON sûre.");
  }

  return count;
}
