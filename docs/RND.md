# Research & Development (R&D) Plan

**Project:** Car Modification Visualizer  
**Version:** 0.1 — Draft  
**Date:** 10 October 2026

## 1. R&D goal

Determine the least costly, safest technical path to a useful preview that preserves the user's car photograph while visibly applying a selected exterior modification. The first R&D cycle should validate the AI/photo workflow before investing in broad 3D vehicle coverage.

## 2. Core hypotheses

- **H1 — User value:** Users find a photo-based concept preview useful enough to complete a guided upload-and-edit workflow.
- **H2 — Wrap quality:** A prompt-driven image model can create an appealing wrap concept, but may not consistently preserve vehicle identity and unrelated details.
- **H3 — Control:** Applying edits only within a vehicle/panel mask will improve localization and repeatability over prompt-only edits.
- **H4 — 3D economics:** A browser 3D workflow becomes attractive only for supported vehicle models with appropriate geometry, materials, and licenses.
- **H5 — Honest positioning:** Users understand the difference between a creative concept image and a guaranteed physical result when the UI labels it clearly.

## 3. Research findings and technical implications

### 3.1 AI image editing

Current image APIs expose workflows for editing an existing image and, in some cases, editing a masked portion of an image. OpenAI's image documentation describes image edits, reference images, and masks for identifying regions to replace, as well as a multi-turn API path for iterative editing [1]. Google's image-generation documentation also describes text-and-image editing and prompts that request changes while matching the original scene's lighting and perspective [2].

**Implication:** Use an image-editing model behind an adapter for concept previews. Test actual supported API behavior, image input/output sizes, latency, price, content policy, and storage/retention terms before selecting a production provider. Model output must be treated as probabilistic. Do not promise that text prompting alone will preserve every body detail.

### 3.2 Segmentation and masks

Vehicle-panel masks can constrain a color or material edit to doors, hood, bumper, roof, or other chosen body regions. One available automotive segmentation reference lists 3,833 annotated images across 23 part classes, including doors, lights, mirrors, hood, trunk, and wheels [3]. This demonstrates that car-part segmentation is an established task, but it does not establish adequate accuracy across all camera angles, vehicle styles, damage, occlusion, or user-uploaded conditions.

**Implication:** Compare three masking levels: (a) prompt-only edits; (b) automatic whole-car mask; (c) part-level mask with user correction. Do not assume a public dataset can be used in commercial training without checking its current license and terms. A model trained on one dataset may not generalize to every real-world photo.

### 3.3 Browser 3D

Three.js provides browser rendering building blocks including a WebGL renderer, materials, texture classes, controls, and model loaders [4]. A 3D visualizer can provide repeatable colors, camera orbit, and deterministic swaps when the model and assets are correct. It also needs accurate car geometry, UV mapping/material zones, trim/part variants, and licensed assets. A generic model can render beautifully while still not representing a user's exact car.

**Implication:** Defer a catalog-wide 3D configurator. Build a small 3D spike only if a suitable, licensed vehicle asset can be obtained for a chosen make/model and there is a product reason for view rotation or repeatable material previews.

### 3.4 Upload safety and privacy

OWASP recommends defense in depth for uploads, including a narrow extension allowlist, content-type checks that are not trusted alone, signature validation, server-generated filenames, upload-size limits, authorization, storage outside the web root or on a separate host, and safe content handling [5]. NIST presents its Privacy Framework as a voluntary tool for identifying and managing privacy risk [6].

**Implication:** Keep uploads private by default; validate on the server; remove unnecessary metadata; define retention and deletion; disclose any third-party image processing; use opaque object keys and authorization checks. A photo can contain a license plate, home, faces, or location metadata even when it is “just a car photo.”

## 4. Approaches to compare

### A. Prompt-only image editing

Send the photo plus carefully templated instructions to preserve camera angle, scene, vehicle make/shape, and all non-target details while changing wrap appearance. This is the fastest baseline and least engineering-heavy option. It is also the least deterministic.

### B. Segmentation-guided recolor/edit

Generate a vehicle or body-panel mask, optionally ask the user to correct it, and constrain image editing to that mask. Compare prompt-only and mask-guided results on identical photos. This may improve localization but requires testing segmentation quality and edges around windows, mirrors, wheel arches, shadows, and reflections.

### C. Deterministic 2D overlay/material recolor

For simple color/finish exploration, use a user-editable mask or manually marked region and apply a color/material transform while preserving image detail. This can be more repeatable than generative edits for basic color changes, but it requires accurate masking and may look less natural for reflections, texture, lighting, complex graphics, or changing physical parts.

### D. Small 3D configurator spike

Load one appropriately licensed GLTF model in Three.js and test paint material, wheel asset swap, camera orbit, and performance. Measure asset acquisition/authoring effort separately; runtime rendering is not the only cost.

### E. Hybrid

Use deterministic controls for stable color/material changes, segmentation for region selection, and AI for creative decals or stylistic concepts. This is the recommended longer-term direction if results warrant it.

## 5. Prototype experiments

### Experiment 1 — Photo quality and prompt-only feasibility

Collect a small consented/rights-cleared test set of varied car photos: side view, front three-quarter, rear three-quarter; bright/dim; light/dark paint; varied occlusion. Establish a versioned prompt template. Generate a wrap color/finish concept for each test photo and record provider/model, settings, failure mode, latency, and cost.

### Experiment 2 — Mask-guided comparison

For the same photos and requested modifications, generate or draw vehicle/body masks and compare edits inside vs. outside the target. Include an optional correction interaction. Record edge leakage, missed panels, reflections, windows/tires incorrectly recolored, and body-detail preservation.

### Experiment 3 — Deterministic recoloring

Build a simple mask/color overlay baseline. Test whether users prefer its repeatability or AI's visual richness, and under what task conditions. Compare editing time and result acceptance.

### Experiment 4 — User comprehension

Ask users to create a concept, then ask whether the preview guarantees exact material shade, real vehicle fitment, or installed result. Revise notice placement and language if users overinterpret the preview.

### Experiment 5 — 3D asset spike (conditional)

Proceed only when a suitable licensed model is identified. Check browser render time, download size, mobile performance, camera controls, material zones, ability to replace wheels, and authoring hours per vehicle. One model is a feasibility test, not evidence of catalog scalability.

## 6. Evaluation rubric

Score each result on a 1–5 scale, with annotators recording an example and confidence:

1. **Requested change:** Is the selected color/finish/style clearly present?
2. **Vehicle preservation:** Are silhouette, major body features, and car identity recognizably preserved?
3. **Region control:** Did unchanged glass, lights, tires, and environment remain largely intact?
4. **Image coherence:** Are shadows, reflections, perspective, and panel boundaries plausible?
5. **Repeatability:** Do repeated runs for the same input produce sufficiently comparable edits?
6. **User utility:** Would the user keep, revise, or reject the concept?
7. **Operational measures:** p50/p95 latency, completion/error rate, cost per successful preview, moderation blocks, and support incidents.

Before testing, define an internal acceptance bar with product stakeholders. Avoid presenting a single aggregate score that hides critical failures. Keep separate thresholds for “attractive concept” and “preserves unchanged vehicle details.”

## 7. R&D sequencing and decision gates

- **Gate 0 — Inputs ready:** Confirm audience, MVP modification categories, consented/rights-cleared images, provider availability, and budget envelope.
- **Gate 1 — Baseline:** Run prompt-only edits and record failures. If results are too inconsistent for concept use, test mask-guided or deterministic recoloring before expanding UX.
- **Gate 2 — Control:** Compare segmentation/masking and user correction. Continue only if measured improvement justifies engineering complexity.
- **Gate 3 — Product choice:** Decide between AI-only, controlled 2D, hybrid, or a narrow 3D pilot based on quality, cost, latency, and user comprehension.
- **Gate 4 — Limited pilot:** Set explicit retention, provider policy, rate limits, observability, and customer-facing disclaimer before broader access.

## 8. Technical recommendation

For the first prototype, use the existing React/TypeScript + Express/tRPC stack and its server-side image-generation helper where the runtime integration is verified. Keep a provider adapter and prompt-template version. Begin with wrap color/finish only, because it is easier to evaluate than physical body-part replacement. Preserve the uploaded original and generated output separately, show a comparison, and label all outputs as concepts. Add a deterministic overlay or segmentation correction if prompt-only tests show region leakage. Evaluate 3D only as a separate, gated asset-driven experiment.

The starter includes a server helper that accepts a prompt and original image references and saves returned image bytes to object storage; that is promising scaffolding, not proof that the deployed credentials, provider model, cost, or end-to-end UX are ready. Verify those operational details in the canonical project before relying on them.

## 9. References

[1]: https://developers.openai.com/api/docs/guides/image-generation "OpenAI Image generation and editing API documentation"
[2]: https://ai.google.dev/gemini-api/docs/image-generation "Google Gemini image generation and editing documentation"
[3]: https://docs.ultralytics.com/datasets/segment/carparts-seg/ "Ultralytics Carparts Segmentation Dataset documentation"
[4]: https://threejs.org/docs/ "Three.js documentation"
[5]: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html "OWASP File Upload Cheat Sheet"
[6]: https://www.nist.gov/privacy-framework "NIST Privacy Framework"
