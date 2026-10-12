# Product & Delivery Roadmap

**Version:** 0.1 — Draft  
**Date:** 10 October 2026

This roadmap is outcome-based rather than a fixed calendar estimate. Dates and staffing should be added after product choices and the canonical project's deployment constraints are confirmed.

## Phase 0 — Confirm the product boundary

**Goal:** Remove assumptions that could materially change the MVP.

- Confirm initial audience and first modification categories.
- Confirm photo-based AI concept preview as the first interaction.
- Choose private/guest behavior, retention and deletion policy, image limits, disclaimers, provider budget, and supported browsers.
- Verify the canonical WebDev project, environment variables, storage permissions, and image-generation availability.

**Exit gate:** Approved MVP scope and a testable definition of a “good concept preview.”

## Phase 1 — Clickable and functional prototype

**Goal:** Demonstrate the complete user journey with minimum feature breadth.

- Replace starter example page with branded workspace and clear instructions.
- Build upload, local preview, validation, and a minimal wrap color/finish picker.
- Implement server-side generation flow through the existing helper if verified.
- Show job status, source/result comparison, retry, clear failure states, and limitations notice.
- Save a basic project and support delete.
- Add unit/component tests and a browser smoke-test checklist.

**Exit gate:** A test user can complete upload → edit → compare → save without developer intervention; failures recover gracefully.

## Phase 2 — Controlled quality evaluation

**Goal:** Learn whether outputs are useful, not merely impressive in a demo.

- Run a rights-cleared photo test set across view angles, lighting, paint colors, and occlusion.
- Score requested-change success and preservation of vehicle details separately.
- Compare repeated prompt-only results and record latency/error/cost.
- Run short usability sessions and test whether users understand the disclaimer.
- Identify common segmentation failures and decide if masks/manual correction are needed.

**Exit gate:** Product stakeholders accept defined quality and cost thresholds for a limited pilot, or choose a deterministic/hybrid alternative.

## Phase 3 — Limited pilot hardening

**Goal:** Allow a small invited cohort to use the product safely.

- Complete auth/authorization and private asset access checks.
- Enforce upload validation, quotas, rate limits, safe logging, and provider timeouts.
- Implement retention and deletion workflows and publish an appropriate privacy notice.
- Add observability for generation success, latency, failures, and cost.
- Add prompt/config versioning and quality feedback capture.

**Exit gate:** Security/privacy review complete; no cross-user asset access; operational support owner identified.

## Phase 4 — Expand modification control

**Goal:** Support use cases with demonstrated demand.

- Add mask-guided recoloring and optional user-corrected masks.
- Add decals/graphics and wheel styles only after separate quality evaluation.
- Add saved variants, export/download, and controlled sharing if users request them.
- Maintain explicit “concept only” positioning.

**Exit gate:** Each new category has its own acceptance criteria and representative test set.

## Phase 5 — Optional 3D configurator pilot

**Goal:** Determine if a narrow model-specific 3D configurator adds enough value.

- Identify one target vehicle and secure a technically suitable, commercially usable asset.
- Build a separate Three.js spike with paint material, camera rotation, and one part option.
- Measure authoring/asset cost, browser performance, and perceived accuracy.
- Compare user outcomes with photo editing.

**Exit gate:** Expand to more cars only if asset rights, model quality, authoring economics, and user value are proven.

## Dependencies and risks

- Project canonicalization and deployment permissions.
- Working server-side image service and permitted image-editing models.
- Image storage access and deletion behavior.
- Rights-cleared evaluation photos and licensed 3D assets if Phase 5 is pursued.
- Product choices on retention, pricing, audience, and the initial modification set.

## Immediate next action

Use the existing starter as the foundation for Phase 0/1. Confirm the unresolved questions in SRD.md, then implement only the thin vertical slice: upload a car photo, select wrap color/finish, request one preview, compare it with the original, and save/delete the concept.
