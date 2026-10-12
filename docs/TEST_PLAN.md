# Verification & Test Plan

**Version:** 0.1 — Draft  
**Date:** 10 October 2026

## 1. Test objectives

Verify that the prototype supports its core photo-to-preview flow, protects uploaded assets, communicates failures and limitations, and produces useful enough concepts to justify further investment. Test system behavior and generated-image quality separately: a technically successful API call is not necessarily a useful preview.

## 2. Test levels

### Unit tests

- Upload rules: accepted MIME/signatures, byte and pixel limits, corrupt data, unsupported formats.
- Modification configuration validation and prompt-template composition.
- Job state transitions: pending → succeeded, failed, cancelled/expired.
- Authorization helper and asset ownership checks.
- Storage key generation and safe error mapping.
- Provider adapter behavior with mocked success, timeout, rate-limit, malformed response, moderation rejection, and storage failure.

### Integration tests

- tRPC procedures with test DB and mocked image provider.
- Project creation, asset metadata, generation-job creation, result persistence, and deletion.
- Authenticated user cannot read or delete another user's project, job, or media.
- Provider failure leaves source project recoverable and does not create a false success record.
- Image output is decoded/validated before being saved.

### End-to-end tests

1. Open app, upload a supported photo, see source preview.
2. Choose wrap color/finish and request a preview.
3. Observe loading/progress and receive a result or safe error.
4. Compare original and output; retry with changed selection.
5. Save, reload, and reopen a project.
6. Delete project and verify access is removed.
7. Repeat at mobile viewport and keyboard-only interaction.

## 3. Functional test matrix

| Area | Positive case | Negative/edge case | Expected behavior |
|---|---|---|---|
| Upload | JPEG/PNG within configured bounds | spoofed MIME, wrong signature, huge file, corrupt image | Validate server-side; reject safely with helpful message |
| Photo guidance | Clear single-car side view | tiny, blurred, heavily occluded, multiple cars | Allow if technically valid but advise retaking; do not promise quality |
| Modification | Curated color/finish selection | malformed or disallowed free text/config | Validate and constrain request |
| Generation | Provider returns valid image | timeout, 429, 5xx, policy rejection, empty output | Categorized error, bounded retry, source retained |
| Persistence | Owner reopens project | another user guesses ID | Owner access only; unauthorized response |
| Deletion | Delete project and assets | storage deletion temporarily fails | Record pending deletion; retry/alert; do not report complete prematurely |
| UI | Desktop happy path | narrow viewport, keyboard, reduced motion | Controls remain accessible and usable |

## 4. Image quality evaluation

Create a consented or rights-cleared test set with variation in camera angle, lighting, background, vehicle color, body type, and panel visibility. Keep test inputs and provider settings fixed when comparing approaches. Do not use personal customer photos as benchmark data without consent and retention rules.

For each result, assess:

- Requested wrap color/finish is present.
- Body silhouette and distinctive vehicle features remain recognizable.
- Unchanged windows, glass, tires, wheels, lights, and background remain stable.
- Panel boundaries, shadows, and reflections look plausible.
- Any unintended alterations are documented.
- User would keep/revise/reject the concept.

Use at least two independent reviewers for a small initial set when feasible. Capture confidence and disagreement. Report category-level results and failure examples; do not hide severe failures in an average score. Establish minimum acceptable thresholds only after stakeholders review a baseline.

## 5. Security and privacy verification

- Verify browser bundles and network payloads contain no provider secrets.
- Verify private object access requires authorization or valid short-lived access.
- Try IDOR-style access using a second account and altered project/job/asset IDs.
- Confirm upload size/dimension caps, decoded-content validation, generated object keys, and MIME handling.
- Confirm EXIF/metadata policy and inspect sample processed files.
- Confirm rate limits and maximum concurrent generation behavior.
- Confirm logs omit image bytes, credentials, and sensitive raw provider payloads.
- Confirm deletion behavior for database rows, original images, derived images, thumbnails, and any backups/retention exceptions.
- Confirm the UI accurately discloses third-party processing and concept-preview limitations.

## 6. Performance and operational tests

Measure client responsiveness, upload time, provider wait time, full generation latency, storage latency, error rate, and cost per successful output. Report p50 and p95 where sample size supports it. Test a slow provider, repeated submits, browser refresh during pending job, and network interruption. Keep requests bounded; verify retries do not create uncontrolled duplicate jobs.

No numerical SLO is prescribed in this draft. Agree targets after observing baseline performance and provider pricing.

## 7. Accessibility checks

- Every input has a programmatic label and error association.
- Buttons and upload controls work by keyboard.
- Focus order is logical and focus remains visible.
- Progress and completion status are announced to assistive technology.
- Before/after comparison has a keyboard-accessible alternative to drag-only control.
- Contrast, zoom, text scaling, and reduced-motion behavior are checked.

## 8. Release checklist

- [ ] P0 acceptance criteria in SRD.md pass.
- [ ] Provider integration and model choice verified in canonical environment.
- [ ] Upload limits and privacy/retention choices are documented.
- [ ] No critical/high-severity access-control or upload findings remain.
- [ ] Failure and retry paths are tested.
- [ ] Concept disclaimer is visible before and after generation.
- [ ] Monitoring and operational owner are in place for pilot.
