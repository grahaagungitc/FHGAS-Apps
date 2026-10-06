import { test } from "node:test";
import assert from "node:assert/strict";

import { createDigitalSignature } from "./saa.ts";

test("createDigitalSignature produces a stable timestamped signature", () => {
  const timestamp = "2026-10-06T00:00:00.000Z";
  const value = createDigitalSignature(
    {
      requestId: "req_123",
      signerName: "Alice",
      signerRole: "HOD",
      decision: "APPROVED",
    },
    timestamp,
  );

  const reorderedValue = createDigitalSignature(
    {
      decision: "APPROVED",
      signerRole: "HOD",
      signerName: "Alice",
      requestId: "req_123",
    },
    timestamp,
  );

  assert.match(value.signature, /^[a-f0-9]{64}$/);
  assert.ok(value.timestamp);
  assert.equal(value.signature, reorderedValue.signature);
  assert.ok(new Date(value.timestamp).toISOString() === value.timestamp);
});
