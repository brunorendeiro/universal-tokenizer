import assert from "node:assert/strict";
import test from "node:test";
import { idsToSegments } from "./token-segments.ts";

test("reconstructs cumulative decoder output as visible segments", () => {
  const decoded = new Map([
    ["1", "Hello"],
    ["1,2", "Hello "],
    ["1,2,3", "Hello world"],
  ]);

  const segments = idsToSegments(
    [1, 2, 3],
    (ids) => decoded.get(ids.join(",")) ?? "",
  );

  assert.deepEqual(segments, ["Hello", " ", "world"]);
  assert.equal(segments.join(""), "Hello world");
});
