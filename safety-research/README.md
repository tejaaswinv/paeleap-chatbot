# Start here — supervisor review and next coding steps

1. Open `PROJECT_PROPOSAL.md` and `THREAT_MODEL.md`. Request supervisor approval of the problem, scope, risk taxonomy and definition of a successful attack. **Do not tune the detector before agreeing on these.**
2. Review `BENCHMARK_SPEC.md`. The 400-case counts are **targets**; `seed_cases.jsonl` contains **60 draft-only cases** that need two independent reviewers.
3. Run `node safety-research/validate-cases.mjs` from the repo root. This checks structure and counts, **not model performance**.
4. Design the B1 standalone detector interface `analyze({system_prompt,user_input,history,retrieved_documents})` with source-tagged input segments, a category, recommended action, evidence and abstention.
5. Add a local evaluation CLI that compares predictions with **reviewed** annotations. Preserve every observed failure. Never call live Miaoqu or museum services from unit tests.
6. Have the red team author fresh holdout data away from the defender's code; launch provider-backed RAG tests only after secured staging approval.

## What already exists elsewhere in the repo
`SECURITY-TESTING.md`, `scripts/redteam.mjs`, and `tests/fixtures/redteam-cases.mjs` contain the prior 380-case fixed-FAQ application assessment. This branch does NOT claim that data or its test pass counts were generated anew.

## Safety and privacy
- No actual provider API credentials or visitor information in seed cases.
- No production code modified, no AI model provider calls made.
- Never equate an out-of-scope user query with an attack.
- Never count a blocked FAQ response as evidence that an open-ended model resisted injection.
