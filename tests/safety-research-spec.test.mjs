import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateSeedCases } from "../safety-research/validate-cases.mjs";

test("safety research seed has 60 separate, explicitly unreviewed development examples", () => {
  const raw=readFileSync(new URL("../safety-research/seed_cases.jsonl",import.meta.url),"utf8");
  const result=validateSeedCases(raw);
  assert.equal(result.count,60);
  assert.equal(result.by_family.indirect_kb,10);
  assert.equal(result.by_family.benign_quotation,8);
  assert.match(result.sha256,/^[a-f0-9]{64}$/);
});
test("invalid or duplicated seed labels are rejected rather than silently scoring", () => {
  const raw=readFileSync(new URL("../safety-research/seed_cases.jsonl",import.meta.url),"utf8");
  const rows=raw.trim().split("\n");
  const broken=rows.map((x,i)=>i===1?rows[0]:x).join("\n")+"\n";
  assert.throws(()=>validateSeedCases(broken),/Duplicate/);
});
