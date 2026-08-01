import assert from "node:assert/strict";
import test from "node:test";
import { estimateCost } from "./pricing.ts";

test("estimates input and output independently", () => {
  const pricing = { input: 2.5, output: 10 };

  assert.equal(estimateCost(1_000_000, pricing, "input"), 2.5);
  assert.equal(estimateCost(500_000, pricing, "output"), 5);
});

test("returns null when a model has no public pricing", () => {
  assert.equal(estimateCost(1_000, undefined), null);
});
