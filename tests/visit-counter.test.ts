import assert from "node:assert/strict";
import { GLOBAL_VISIT_COUNTER_KEY, incrementVisitCounter } from "../src/lib/visit-counter";
import type { VisitCounterStore } from "../src/lib/visit-counter";

async function runSuite() {
  let value = BigInt(0);
  const calls: unknown[] = [];
  const store: VisitCounterStore = {
    async upsert(args) {
      calls.push(args);
      value += BigInt(1);
      return { count: value };
    },
  };

  assert.equal(await incrementVisitCounter(store), 1);
  assert.equal(await incrementVisitCounter(store), 2);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], {
    where: { key: GLOBAL_VISIT_COUNTER_KEY },
    create: { key: GLOBAL_VISIT_COUNTER_KEY, count: BigInt(1) },
    update: { count: { increment: BigInt(1) } },
    select: { count: true },
  });

  await assert.rejects(
    () => incrementVisitCounter({ upsert: async () => ({ count: BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1) }) }),
    RangeError
  );

  console.log("✅ Compteur de visites atomique et conversion JSON sûre validés.");
}

runSuite().catch((error) => {
  console.error(error);
  process.exit(1);
});
