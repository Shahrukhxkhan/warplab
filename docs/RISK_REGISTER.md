# Risk Register

**Version:** 0.1 — Draft  
**Date:** 10 October 2026

Likelihood and impact are initial qualitative estimates, not measured results.

| ID | Risk | Likelihood / impact | Mitigation and owner | Trigger / review |
|---|---|---|---|---|
| R-01 | Generative edits change vehicle details unrelated to the requested modification. | High / High | Position outputs as concepts; use prompt constraints; measure preservation separately; test masks or deterministic overlays. Product + ML engineering. | Repeated visible drift or users interpreting output as exact. Review each model/prompt release. |
| R-02 | Photo quality, angle, occlusion, glare, or background causes unusable results. | High / Medium | Provide photo guidance and quality feedback; create representative test set; define unsupported scenarios. Product + CV. | High rejection/retry rates for a photo category. |
| R-03 | Sensitive photo data or metadata is retained or exposed unexpectedly. | Medium / High | Private storage, EXIF policy, access checks, documented retention/deletion, third-party disclosure, minimal logs. Security/privacy owner. | Any unauthorized access or deletion mismatch. |
| R-04 | Malicious or oversized uploads exploit parsers or consume storage/compute. | Medium / High | Strict allowlist, signatures, decode/re-encode, size/dimension caps, randomized names, isolated storage, rate limits. Engineering. | Validation bypass, abnormal resource usage, parser alert. |
| R-05 | Provider outage, rate limit, policy block, or API change prevents previews. | Medium / High | Provider adapter, timeout/backoff, categorized errors, health metrics, graceful fallback and provider portability. Engineering/operations. | Error-rate threshold exceeded or provider changes contract. |
| R-06 | Per-preview cost or latency makes product impractical. | Medium / High | Measure cost and p50/p95; resize intelligently; quotas; limit retries; compare models and deterministic approaches. Product/finance. | Budget/latency threshold exceeded after baseline. |
| R-07 | User assumes generated view is a guaranteed installed result or fitment confirmation. | Medium / High | Prominent, plain-language disclaimer; prohibit technical/fitment guarantee claims; test comprehension. Product/legal review. | Usability tests show false assumptions or customer complaint. |
| R-08 | 3D assets are unavailable, inaccurate, or not licensed for commercial use. | High / Medium | Defer broad 3D; verify rights and model fidelity per vehicle; budget authoring effort; pilot one model only. Product/legal. | Any asset fails rights or technical gate. |
| R-09 | Prototype starter's helpers or credentials differ in canonical deployment. | Medium / Medium | Verify canonical project, storage permissions, image-service config, schemas, migrations, and tests before integrating. Engineering. | First end-to-end staging test fails. |
| R-10 | Scope expands to “all modifications” before quality is validated. | High / Medium | Limit MVP to wrap color/finish; add categories only with separate evidence and acceptance criteria. Product owner. | New requests block thin vertical slice or quality evaluation. |
| R-11 | Cross-user project/media access due to insecure ID handling. | Low–Medium / High | Enforce ownership on every query and signed URL issuance; integration-test with two users; never trust client owner IDs. Security. | Any unauthorized read/write in test or monitoring. |
| R-12 | Unsupported image licensing or user rights create complaints. | Medium / Medium | Require user representation that they may upload the photo; use rights-cleared internal evaluation data; provide report/takedown workflow as appropriate. Product/legal. | Rights complaint or unclear source of test asset. |

## Assumptions needing owner assignment

Assign product owner, engineering owner, privacy/legal reviewer, and pilot operations contact before external pilot. Establish quantitative severity, likelihood, and thresholds after baseline measurements.
