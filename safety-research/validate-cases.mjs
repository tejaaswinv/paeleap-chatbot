#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";

export function validateSeedCases(raw) {
  const lines = String(raw).split(/\r?\n/).filter(Boolean);
  const cases = lines.map((s, n) => {
    try { return JSON.parse(s); } catch { throw new Error("Invalid JSON at line "+(n+1)); }
  });
  const ids = new Set();
  const familyCount = {};
  const allowedActions = new Set(["allow","redirect","block","quarantine_context","review","emergency"]);
  const allowedThreats = new Set(["none","scope_only","prompt_injection_direct","prompt_injection_indirect","harmful_request","emergency"]);
  for(const row of cases) {
    if(!/^SEED-\d{3}$/.test(row.id)||ids.has(row.id))throw Error("Duplicate/invalid case ID: "+row.id);
    ids.add(row.id);
    if(!["en","zh"].includes(row.language))throw Error("Unknown language: "+row.id);
    if(typeof row.user_input!=="string"||!row.user_input.trim())throw Error("Missing question: "+row.id);
    if(!Array.isArray(row.history)||typeof row.retrieved_text!=="string")throw Error("Malformed context: "+row.id);
    if(!allowedActions.has(row.gold_action)||!allowedThreats.has(row.gold_threat))throw Error("Invalid action/threat: "+row.id);
    if(row.surface==="retrieved_document" && !row.retrieved_text)throw Error("Missing retrieved text: "+row.id);
    if(row.surface!=="retrieved_document"&&row.retrieved_text)throw Error("Unexpected retrieved text: "+row.id);
    if(row.surface==="conversation_history" && !row.history.length)throw Error("Missing prior turns: "+row.id);
    if(row.split!=="development"||row.annotation_status!=="draft_requires_independent_review")throw Error("Improperly claimed review: "+row.id);
    familyCount[row.family]=(familyCount[row.family]||0)+1;
  }
  if(cases.length!==60)throw Error("Expected 60 draft seed cases, got "+cases.length);
  const expected={legitimate_tourism:12,out_of_scope:8,benign_quotation:8,direct_override:10,multi_turn:6,indirect_kb:10,harmful:3,emergency:3};
  if(JSON.stringify(familyCount)!==JSON.stringify(expected))throw Error("Family distribution changed: "+JSON.stringify(familyCount));
  return {count:cases.length,by_family:familyCount,sha256:createHash("sha256").update(raw).digest("hex"),annotation_status:"DRAFT_ONLY_NOT_HUMAN_REVIEWED"};
}
const path=join(dirname(fileURLToPath(import.meta.url)),"seed_cases.jsonl");
if(process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1]) {
  const report=validateSeedCases(readFileSync(path,"utf8"));
  process.stdout.write(JSON.stringify(report,null,2)+"\n");
}
