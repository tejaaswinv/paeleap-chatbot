import test from "node:test";
import assert from "node:assert/strict";
import { buildTrustPassport } from "../lib/ai/trust-passport.js";

test("curated answers disclose approved-record provenance without claiming live verification",()=>{
  const receipt=buildTrustPassport({status:"allowed",mode:"evidence_composition",
    sources:[{name:"museum",url:"https://example.org"}],personaVersion:3});
  assert.deepEqual(receipt,{
    schemaVersion:1,basis:"curated_knowledge",referenceCount:1,
    knowledgeVersion:3,liveChecked:false,linksChecked:false,limitedByProvider:false
  });
  assert.equal(Object.isFrozen(receipt),true);
});

test("profile identity, safety notices, and out-of-scope answers have distinct provenance",()=>{
  assert.equal(buildTrustPassport({status:"allowed",mode:"persona_identity"}).basis,"published_profile");
  for(const status of ["blocked","emergency","sanitized"]){
    const receipt=buildTrustPassport({status,sources:[{}],providerDegraded:false});
    assert.equal(receipt.basis,"safety_notice");
    assert.equal(receipt.referenceCount,0);
  }
  assert.equal(buildTrustPassport({status:"redirected"}).basis,"unanswered");
});

test("provider failures are disclosed but source links are never upgraded to checked",()=>{
  const r=buildTrustPassport({status:"allowed",mode:"curated_faq_fallback",
    providerDegraded:true,sources:[{}]});
  assert.equal(r.limitedByProvider,true);
  assert.equal(r.liveChecked,false);
  assert.equal(r.linksChecked,false);
  assert.equal(r.knowledgeVersion,null);
});

test("bogus versions or huge reference lists do not create fabricated assurance",()=>{
  assert.equal(buildTrustPassport({status:"allowed",personaVersion:Infinity}).knowledgeVersion,null);
  assert.equal(buildTrustPassport({status:"allowed",personaVersion:-1}).knowledgeVersion,null);
  assert.equal(buildTrustPassport({status:"allowed",sources:new Array(100)}).referenceCount,12);
});

test("social support receipts are based on the published profile, not fabricated evidence", () => {
  const receipt=buildTrustPassport({status:"allowed",mode:"conversation_support",sources:[],personaVersion:1});
  assert.equal(receipt.basis,"published_profile");
  assert.equal(receipt.referenceCount,0);
  assert.equal(receipt.liveChecked,false);
});

test("ScamShield is safety advice, not a curated fact or a verified seller",()=>{
  const r=buildTrustPassport({status:"allowed",mode:"scam_prevention",personaVersion:1});
  assert.equal(r.basis,"safety_notice");
  assert.equal(r.referenceCount,0);
  assert.equal(r.liveChecked,false);
  assert.equal(r.linksChecked,false);
});
