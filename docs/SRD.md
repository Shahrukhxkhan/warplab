# Software Requirements Document (SRD)

**Project:** Car Modification Visualizer  
**Document version:** 0.1 — Draft for prototype  
**Date:** 10 October 2026  
**Status:** Initial baseline; assumptions require product-owner confirmation

## 1. Purpose

The product is a browser-based application that helps a car owner explore visual concepts for exterior modifications before discussing or commissioning physical work. A user supplies a photograph of a vehicle, chooses a modification, and receives a concept preview. The preview is an aesthetic aid, not a fitment, color-calibration, installation, legal-compliance, or engineering guarantee.

This SRD defines the first prototype and a path to a broader product. It is intentionally centered on an upload-photo workflow because it can be validated without obtaining a comprehensive licensed 3D vehicle catalog.

## 2. Product objectives and success criteria

The prototype should demonstrate that a user can go from a suitable source photo to a saved, comparable modification concept with little guidance. It should help the team measure whether users understand the preview's limitations, whether requested changes appear convincing, and where image editing fails.

Prototype success criteria:

- A first-time user can upload an image, select a modification, generate a preview, and identify the result as a concept image in a moderated usability test.
- A user can compare the original and generated image and save or remove the project.
- Failed generation produces an understandable recovery path, not a lost project or indefinite spinner.
- A small evaluation set records preservation of vehicle identity and requested-change quality across varied photos.
- No API secrets are exposed to the browser, and uploaded images are subject to explicit retention and deletion behavior.

No numeric quality or latency thresholds are approved yet. The R&D plan proposes baselines to measure first, then set thresholds from evidence.

## 3. Users and operating assumptions

### Primary user

A car owner or enthusiast exploring wrap colors, wrap finishes, graphics, wheels, stance, or exterior styling ideas.

### Secondary users (later)

A wrap shop or customization business may use saved concepts during consultation. This is not an MVP commitment.

### Assumptions to validate

- Initial users are adults using a modern desktop or mobile browser.
- The first iteration is English-language and responsive.
- The user owns, or has permission to use, the uploaded photograph.
- MVP scope is exterior visual concepts, not mechanical compatibility or parts ordering.
- The initial preferred backend remains TypeScript because the supplied starter already uses it. Go or Rust can be evaluated later for isolated services if measured needs justify a second runtime.
- The AI integration is optional/configurable and must fail gracefully when unavailable.

## 4. Scope

### In scope — prototype

1. Public landing/workspace page explaining what the tool does.
2. Upload one vehicle photo in an approved raster format.
3. Local preview and basic suitability guidance (vehicle visible, adequate resolution, one main car, unobstructed panels where possible).
4. Choose a modification category and enter a short optional instruction.
5. Configure wrap color and finish from a small curated set; allow a free-text concept description.
6. Submit a generation job through the server-side image-generation integration.
7. Display original and generated image with a comparison control.
8. Retry generation, edit the prompt/options, delete an image, and save a named concept.
9. Provide clear disclosure that AI output can change unintended details and is not a production/fitment specification.
10. Basic authentication and project persistence if enabled by the hosting environment; prototype may also allow a clearly labeled temporary/guest flow if persistence/auth is not ready.

### Candidate later features (not MVP commitments)

- Vehicle make/model/year catalog and multi-angle capture.
- Wheel/ride-height/body-kit previews with part-specific controls.
- Segmentation-based local recoloring and hand-editable masks.
- Interactive 3D configurator with accurate licensed vehicle meshes.
- Provider/shop collaboration, estimates, product catalogs, payments, or ordering.
- Mobile app, video, augmented reality, or production color/fitment measurement.

### Out of scope

- Claims that a generated image precisely predicts installed vinyl, paint, wheel fitment, suspension geometry, or road legality.
- Automated purchasing or contacting an installer.
- Training a new foundation image model during the prototype.
- Storing vehicle identity documents, registration details, or sensitive personal information.

## 5. User journeys

### Journey A — create a concept

1. User opens the visualizer and reads a short privacy/preview notice.
2. User selects a photo. The app validates format, size, and dimensions and shows a local preview.
3. User selects “Wrap,” picks a color and finish, optionally enters guidance, and starts preview generation.
4. The app shows progress and allows cancellation where supported.
5. The app shows the generated result next to the source, labels it as AI-generated, and offers retry/edit/save.
6. User names the concept and saves it, or downloads/shares only through an explicit action.

### Journey B — recover from a weak result

User marks the result as wrong or retries with more specific guidance. The app preserves the source, the selected options, and previous successful results until the user deletes them. Provider errors and content rejection are explained in plain language without exposing internal error payloads.

### Journey C — delete data

User deletes a concept or uploaded photo. The interface confirms the scope of deletion in-product, removes the project association, and the storage lifecycle removes derived artifacts according to the documented retention rule. Deletion behavior must be tested end to end.

## 6. Functional requirements

Priority: **P0** required for the initial prototype; **P1** desirable soon after; **P2** later.

### FR-01 Upload and validation (P0)

- Accept only explicitly allowed image types, initially JPEG, PNG, and WebP if supported by all processing components.
- Validate file signature/content server-side; do not trust filename or browser-supplied MIME type alone.
- Enforce configurable byte and pixel-dimension limits and display them before upload.
- Assign a server-generated opaque object key; never use the user's original filename as a storage path.
- Reject unsupported, corrupt, or oversized files with actionable errors.
- Strip EXIF metadata where feasible before persistence or third-party processing; document any exception.

### FR-02 Modification selection (P0)

- Provide a limited, maintainable catalog of wrap colors and finishes, plus a free-text instruction.
- Capture a structured modification object separately from the natural-language prompt.
- Distinguish “wrap/color concept” from “physical part replacement” so the UI does not imply that one model behavior covers all modification types.

### FR-03 Generation (P0)

- Call the image service only on the server.
- Send an explicit prompt that identifies the requested edit and asks to preserve the vehicle, camera view, environment, and unchanged components where possible.
- Record provider/model identifier, request status, timestamps, and non-sensitive failure category.
- Do not store raw API keys or provider secrets in project/client settings or logs.
- Support pending, succeeded, failed, and cancelled/expired job states.
- Apply request throttling and reasonable per-user usage limits.

### FR-04 Preview and comparison (P0)

- Display source and output at a useful size with a side-by-side or before/after slider.
- Preserve aspect ratio; support zoom or open-at-full-size.
- Label output “AI concept preview — may differ from real materials, fitment, and installation.”

### FR-05 Save and manage concepts (P0/P1)

- A saved project includes title, timestamps, original image reference, generated result reference(s), selected modification settings, and generation metadata needed for debugging.
- A user can rename, re-open, and delete their own projects.
- Authorization checks must ensure users cannot access another user's image or project by changing an ID.
- If guest mode is offered, its persistence, ownership, and deletion semantics must be explicit.

### FR-06 Accessibility and responsive use (P0)

- Core workflow is keyboard operable, has visible focus states, labels, useful alt text, and accessible progress/error announcements.
- Layout adapts to mobile and desktop; upload and comparison are usable on touch devices.
- Respect reduced-motion preferences.

### FR-07 Observability (P1)

- Track coarse product events (upload accepted/rejected, generation requested/completed/failed, saved/deleted) without logging image bytes, prompts that may contain personal data, or secrets.
- Provide an operational dashboard for request volume, latency, failure rate, and provider spend when a production provider is selected.

## 7. Non-functional requirements

### Performance

- Initial page and controls should remain responsive while generation runs.
- Generation is asynchronous in UX terms; UI must not freeze during network calls.
- Record p50/p95 preview latency during testing before setting service-level targets.
- Images should be resized to a documented maximum suitable for the selected provider and product quality, with originals kept only if there is a defined need.

### Reliability

- Transient provider failures should be retryable with bounded backoff; avoid duplicate charges from repeated accidental submissions where provider idempotency is available.
- Existing saved projects remain available if generation is down.
- The UI must distinguish validation, moderation, provider, timeout, and application errors.

### Security and privacy

- Enforce authentication/ownership at every project and media access boundary.
- Use expiring or signed media access where appropriate; default to private storage.
- Define consent, deletion, retention, and third-party processing disclosures before public release.
- Apply upload defense in depth: allowlists, signature inspection, size caps, safe generated filenames, isolated storage, and image rewriting/scanning where feasible.
- Avoid processing or retaining license plates and EXIF location data beyond what is required. Do not promise anonymity if the photo includes identifying details.

### Maintainability

- Keep the image provider behind a narrow service interface, so provider/model can be changed without rewriting the UI or project model.
- Keep product-domain types and validation shared between client and server where practical.
- Record decisions that introduce provider lock-in, public asset access, or new language/runtime services.

## 8. Data model (logical)

- **User:** account identity provided by the auth layer; no duplicate credential store.
- **Project:** id, owner id, title, created/updated timestamps, lifecycle state.
- **Asset:** id, project id, role (`source`, `preview`), storage key, MIME type, dimensions, byte size, created timestamp, deletion state.
- **ModificationConfig:** category, color/material/finish identifiers, free-text description, versioned structured JSON.
- **GenerationJob:** id, project id, status, provider/model alias, prompt-template version, request time, completion time, error category, output asset id.

Avoid storing unnecessary raw prompt text, provider payloads, or user metadata. Set retention policy before launch.

## 9. Acceptance criteria for the prototype

- A valid test photo can be uploaded and previewed; invalid formats and oversized files are rejected with clear messages.
- A user can select at least one wrap color/finish and trigger generation through a server-side provider helper.
- A successful preview is displayed with the source image and limitation disclosure.
- A failed request preserves the input and permits retry without requiring a full restart.
- A saved project can be reopened by its owner and cannot be retrieved by a different test user.
- Deleting a project removes its references and follows the agreed object-retention behavior.
- API secrets are not present in browser bundles, network responses, or ordinary application logs.
- Keyboard-only and narrow-screen smoke tests pass for the primary workflow.

## 10. Open questions

1. Which users are the first target: individual owners, wrap shops, or both?
2. Is upload-photo AI concept generation the confirmed first MVP, or should the prototype instead start with a static template-based recolor tool?
3. Which modification categories are essential in the first usable demo: wrap only, decals, wheels, body styling, or a subset?
4. Are projects private by default? Is guest use acceptable?
5. What deletion and retention period should apply to source and generated images?
6. Should downloads include a visible concept watermark and disclaimer?
7. What providers, budget ceilings, and expected monthly use are acceptable?
8. Which reference-car models or real before/after photos can be used with permission for evaluation?
9. Is the product intended only for ideation or later for commercial shop quoting?
10. What geographic markets and privacy/legal review are in scope?

## 11. Starter-project fit

The attached `car-wrap-visualizer` reference is a scaffold, not a functioning end-user visualizer. It uses React 19/TypeScript in the client, Express with tRPC in the server, Drizzle/MySQL-compatible persistence, and storage helpers. Its `server/_core/imageGeneration.ts` already exposes an image-generation helper that accepts prompt and source-image references and stores outputs; the home page remains an example page. This means the prototype can likely extend existing paths rather than inventing a separate stack. The helper's runtime credentials, provider behavior, current model catalog, storage access policy, and actual deployment behavior still need verification before promising a live integration.
