# Paeleap AI Safety Research — revised project proposal (v1)

**Draft for supervisor approval · 21 October 2026**  
**Workstream:** Context-aware malicious-request and prompt-injection detection in tourism AI assistants.  
**Status:** Proposed research design; no claim of model accuracy or new benchmark performance.

## 中文摘要（供导师快速审阅）
本项目不再以“旅游问答是否能正确回答”为主要安全研究目标，而是研究：**给定系统提示词、用户输入、对话历史和检索知识库，能否识别提示词注入、角色劫持、越权数据请求、恶意/有害请求，同时减少对正常和防御性问题的误判？** 先确定威胁模型和评价标准，再构建经过人工独立标注的测试集，通过红队攻击、蓝队防御和独立留出集评估系统的实际检测能力。现有的380条应用级用例仅作为既有基线，不能等同于独立的模型安全评估。

## 1. Problem and why it matters
Tourism AI assistants may receive user-authored messages, prior conversation turns, external museum pages and knowledge-base retrievals. A malicious user or compromised page can try to promote lower-trust text into new instructions. A successful attack may cause a system to mislead visitors about closures or safety, expose private conversations, bypass its assigned role, or process untrusted source instructions.

**Research question:** Given (1) a trusted system prompt, (2) a user's current request, (3) conversation history and (4) optionally retrieved museum/travel text, can a safety evaluator identify observable attempts to redirect the assistant, separate those attempts from benign discussion, and recommend an appropriate policy response?

Do **not** claim to know a person's private intentions. Output a threat *indicator* and supporting evidence, not a psychological judgment.

## 2. Project scope
**In scope:** direct user prompt injection; role/authority spoofing; prompt and private-data extraction; multi-turn escalation; instructions embedded in retrieved content; mixed Chinese/English; benign quotations and defensive questions; tourism-related harmful requests; tourism emergency triage; false-positive and false-negative analysis.

**Out of scope for the first research milestone:** building a general-purpose chatbot; universal content moderation; live harmful action execution; surveillance of real users; private data mining; public deployment of autonomous tools; model safety certification.

## 3. Proposed input/output contract
Input: `{system_prompt, user_input, history, retrieved_documents, language, task_context}`. System instructions are trusted **context**, whereas user messages and retrieved documents are lower-trust material. Retrieved documents contain IDs/source provenance, never implied authority.

Output:
```json
{
  "threat_class": "prompt_injection_indirect",
  "source": "retrieved_document",
  "risk_level": "high",
  "recommended_action": "quarantine_context",
  "evidence_excerpt": "This retrieved document attempts to issue assistant instructions.",
  "confidence": null,
  "review_required": true
}
```
*Example only — not a model prediction.* Do not expose hidden system prompts or raw customer data as the evidence excerpt. Calibrate any numeric confidence against independently reviewed data, and allow abstention.

## 4. Baselines and hypotheses
**B0: Current TourMate rules** (`lib/ai/safety.js`), applied only to its existing user-message interface. The repository already contains a 380-case application corpus with simulated provider modes; it is not an independent detector benchmark.

**B1: Isolated deterministic context-aware heuristics**, operating on *source-tagged* context segments; untrusted source instructions should be flagged without blocking the innocent user request.

**B2: LLM-based risk classifier** supplied with system policy and marked source boundaries. Judge-only agreement is never treated as human ground truth.

**B3: Hybrid** heuristics + model classifier + policy engine, with a review/abstain state and output controls.

Hypotheses to test rather than assume: B2 should improve paraphrase recall over B0; B3 should reduce false positives while maintaining containment, but all may remain vulnerable to novel or contextual attacks.

## 5. Research plan and acceptance gates
1. **Agree on problem and risk tolerance** with supervisor; freeze threat taxonomy and output schema.
2. **Pilot labeling:** review 60 synthetic *development-only* seed cases; revise ambiguities, add disagreement notes and policy examples.
3. **Construct ~400 cases** to the proposed stratified plan in `BENCHMARK_SPEC.md`; commission separate author/reviewer for held-out examples. Avoid using test outputs as labels.
4. **Measure baselines:** run B0 then B1/B2/B3 on the same frozen splits and record exact inputs, predictions, outcomes, duration, costs, version/hash.
5. **Red vs blue:** independent attack creation, fix failures on development set, and run once against untouched holdout. All additional tuned cases become regressions, not a newly independent holdout.
6. **Separate system-level assessment:** evaluate generated assistant responses, real knowledge-base integration, provider reliability, cross-user isolation and source citations. Do not confuse a FAQ-only refusal with proof of jailbreak resistance.

**Approval criteria (proposed):** supervisor signs off on problem statement, severity policy, annotation guide and definition of a successful attack before new model claims. Numerical launch gates require risk-owner approval.

## 6. Existing implementation and known limitations
Current GitHub `main` includes `SECURITY-TESTING.md`, a 380-case corpus (140 adversarial, 20 off-topic, 20 benign and 200 bilingual canonical controls), multiple simulated-provider modes, and regression assertions. It explicitly says these are *application-containment* tests and not real-model jailbreak certification. Historical cases were used during hardening, so they cannot serve as a fresh independent holdout. A KB connector without a reachable endpoint/response schema is not a tested indirect-injection pathway.

## 7. Expected deliverables
1. Signed-off problem statement and risk taxonomy.
2. Threat-model matrix covering roles, data flow, assets and trust boundaries.
3. Independently reviewed benchmark with case IDs, provenance and split manifests.
4. Baseline vs defended confusion matrices and attack success analysis, by language and attack surface.
5. Evidence-linked red/blue replay and a supervisor-friendly dashboard showing cases and observed behavior.
6. Reproducibility and limitations note: source hashes, model/version/settings, fixtures vs live calls, failures and responsible reviewers.

## 8. Sources
- OWASP LLM01 Prompt Injection: https://genai.owasp.org/llmrisk/llm01-prompt-injection/
- OWASP GenAI Top 10: https://genai.owasp.org/llm-top-10/
- MITRE ATLAS: https://atlas.mitre.org/
- NIST AI RMF Generative AI Profile: https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf

These are methodological references, not external validation or certification.
