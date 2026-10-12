# Architecture & Technology Decisions

**Project:** Car Modification Visualizer  
**Version:** 0.1 — Draft  
**Date:** 10 October 2026

## 1. Architectural direction

Build a modular web application with a browser-based React client, a TypeScript API layer, relational persistence for project metadata, and object storage for image bytes. Route generation through the server to an image-generation provider. Keep the provider replaceable and isolate expensive/slow image generation behind a job-oriented workflow.

The first version should not split the product into microservices. It has one primary workflow and the supplied starter already provides the client/server boundary, authentication plumbing, database integration, storage helpers, and a server image-generation helper.

## 2. Reference starter stack observed

The read-only `car-wrap-visualizer` reference contains:

- React 19 + TypeScript + Vite frontend, Tailwind 4 and reusable UI components.
- Express 4 with tRPC 11 for typed API procedures.
- Drizzle ORM and MySQL/TiDB-compatible database configuration.
- Existing auth plumbing, S3-compatible storage helpers, and `server/_core/imageGeneration.ts` helper.
- A minimal home page that currently renders example content rather than the visualizer workflow.

This makes TypeScript the practical initial choice. Do not introduce a Go or Rust backend merely as a language preference. A Go/Rust service can be added later if profiling identifies a distinct requirement such as high-volume media processing, low-level computer vision, or a separate model-serving workload.

## 3. Logical components

```text
React web client
  ├─ Upload/validation UX and local preview
  ├─ Modification controls and prompt-friendly options
  ├─ Generation status, before/after comparison, saved-project UI
  └─ Typed tRPC client
          │
          ▼
Express + tRPC application server
  ├─ Auth and project ownership checks
  ├─ Upload authorization / signed storage URL orchestration
  ├─ Project, asset, and generation-job procedures
  ├─ Image validation and metadata normalization
  ├─ Prompt builder (versioned template)
  └─ ImageProvider interface
          │                    │
          ▼                    ▼
Relational DB             Private object storage
  ├─ users via auth        ├─ source images
  ├─ projects              └─ generated previews
  ├─ assets
  ├─ modification configs
  └─ generation jobs
          │
          ▼
External/internal image editing service
```

## 4. Recommended request flow

1. Client requests an upload authorization or sends the image through a protected endpoint, according to storage support.
2. Server validates file size/type and creates a project and opaque asset record. The original filename is not used as the storage key.
3. Server normalizes the image if supported: decode/re-encode, remove EXIF metadata, enforce dimensions, and generate a preview thumbnail.
4. Client submits a structured modification config. Server checks ownership, quotas, and allowed options.
5. Server creates a generation-job row, builds a prompt from a versioned template, retrieves the private source asset, and calls the selected image provider using server-only credentials.
6. Provider output is validated and stored as a new private asset. The job transitions to succeeded or a safe categorized failure.
7. Client polls or subscribes to status through tRPC and displays the result, with comparison controls and limitations disclosure.
8. Project deletion removes database references and schedules/executes associated storage deletion based on the retention policy.

If the existing hosting environment cannot run a background queue, the initial implementation may use a bounded request with visible pending state. Before production, move generation to a durable queue/worker if timeouts, concurrency, retries, or cost controls require it.

## 5. Main domain entities

- `Project`: owner, title, timestamps, status.
- `Asset`: project, role, storage key, detected MIME, dimensions, size, creation/deletion timestamps.
- `ModificationConfig`: version, category, selected palette/finish, optional prompt instructions.
- `GenerationJob`: provider/model alias, prompt-template version, status, timestamps, sanitized error code, output asset.

Use database migrations and keep the DB schema aligned with the code. Avoid adding large binary data to relational rows.

## 6. API boundaries (illustrative)

- `project.create`, `project.listMine`, `project.get`, `project.rename`, `project.delete`
- `asset.requestUpload` / `asset.completeUpload` or `asset.upload`, depending on the existing storage contract
- `visualization.createJob` with project id and validated modification configuration
- `visualization.getJob` and `visualization.retryJob`
- `asset.getAccessUrl` only after ownership authorization

The exact names are illustrative. Keep all validation at the server boundary. Never accept a client-supplied provider model name, storage key, owner id, or unrestricted prompt as authoritative.

## 7. Provider abstraction

Define an application interface similar to:

```ts
type ImageEditRequest = {
  source: { bytes: Buffer; mimeType: string };
  prompt: string;
  mask?: { bytes: Buffer; mimeType: string };
  output: { format: "png" | "jpeg"; quality?: "medium" };
};

type ImageEditResult = {
  bytes: Buffer;
  mimeType: string;
  providerModel: string;
};

interface ImageProvider {
  editImage(request: ImageEditRequest): Promise<ImageEditResult>;
}
```

Do not expose provider-specific types to the browser. Pin a validated server-side model alias, log only safe metadata, and version prompt templates. Use the reference helper where appropriate, but wrap it so tests can mock provider behavior and later providers can be swapped.

## 8. Security, privacy, and operations

- Use authenticated ownership checks for project, job, and asset access.
- Prefer private storage with short-lived access URLs.
- Validate file signature and decode image content; use allowlists and explicit limits.
- Use randomized server-generated storage keys; isolate uploaded files from executable/static application paths.
- Rate-limit generation and upload operations; enforce per-account quotas.
- Keep provider keys server-side; redact headers and user-supplied content from logs.
- Decide retention, deletion, provider data processing, and privacy disclosures before public pilot.
- Track latency, provider failures, output storage failures, and cost per successful preview.
- Use strict timeouts and bounded retries; prevent duplicate user actions from creating unintended repeated paid jobs.

## 9. Language decision: TypeScript vs. Go vs. Rust

**Decision for prototype:** retain TypeScript throughout the app. It matches the existing starter and keeps shared types, frontend implementation, API, and test setup in one ecosystem.

**Go:** Consider for a separate stateless job worker or high-concurrency service if deployment simplicity and operational performance justify another runtime.

**Rust:** Consider for a performance-sensitive image/geometry component or specialized native processing library where benchmark results justify its learning and maintenance cost.

**Do not use both Go and Rust in the initial backend.** Neither language automatically improves image-model output quality; model choice, prompt/mask design, source photo, and evaluation matter more.

## 10. Deployment topology

Prototype: managed web app runtime, managed relational DB, private object storage, server-side image provider. Keep application and storage environments separated between development and production. Use environment-managed secrets, not committed `.env` values.

Scale-up options, only when needed: queue/worker, dedicated image preprocessing service, CDN for controlled preview delivery, and observability/alerting. Avoid public image URLs unless the product explicitly requires them and access controls are designed accordingly.

## 11. Architecture decision record

### ADR-001 — Photo-first web prototype

- **Status:** Proposed.
- **Context:** 3D needs high-quality per-vehicle assets and specialized configuration; the starter already has image-generation and storage scaffolding.
- **Decision:** Validate a photo-first concept workflow before building a broad 3D catalog.
- **Consequences:** Fast first demo; outputs are probabilistic and must carry a concept disclaimer. Add masking or deterministic overlays if tests show unacceptable drift.

### ADR-002 — Keep TypeScript initially

- **Status:** Proposed.
- **Context:** Existing application is TypeScript across client/server.
- **Decision:** Use existing TypeScript stack for MVP; evaluate Go/Rust only for measured component needs.
- **Consequences:** Lower integration complexity now; future service boundaries remain possible through the provider/job interfaces.

### ADR-003 — AI previews are concepts, not specifications

- **Status:** Proposed.
- **Context:** Generative edits can alter details beyond the requested target.
- **Decision:** UI and exported outputs disclose non-guaranteed appearance/fitment.
- **Consequences:** Prevents unsupported accuracy claims and aligns user expectations.
