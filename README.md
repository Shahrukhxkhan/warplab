# Vanta Auto Studio (Warplab)

A web app for visualizing car wraps and exterior modification concepts on a user's own vehicle photo. The current MVP focuses on uploading a car image, selecting a wrap color and finish, generating an AI-edited concept preview, comparing it with the original, and saving concepts locally in the browser.

> AI outputs are visual concepts only. They may change details beyond the requested wrap and do not guarantee real-world color, fitment, installation, or final appearance.

## Current MVP

- Responsive photo upload for JPEG, PNG, and WebP images, with browser-side resizing before a preview request.
- Curated wrap color and finish selection with optional styling notes.
- Protected server-side AI image editing via the existing Manus image-generation helper.
- Before/after comparison slider and preview status/error handling.
- Browser-local saved builds, with reopen and remove controls.
- Server-side image data URL, size, and file-signature validation.

Saved build records are stored in IndexedDB on the current browser/device. Generated image assets are handled by the configured project image service. Removing a local saved record does not delete the stored generated image.

## Technology

- React 19, TypeScript, Vite, Tailwind CSS
- Express 4 and tRPC 11
- Drizzle ORM with MySQL/TiDB support (starter scaffold)
- Manus OAuth, object storage, and server-side image-generation helper

## Development

This repository is based on the Manus WebDev full-stack scaffold. The normal project scripts are:

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm build
```

The app expects its platform-provided runtime configuration for Manus OAuth, image generation, and storage. Keep all credentials in the platform's managed secrets or a local ignored `.env` file. Never commit secrets or generated user photos.

## Image-generation flow

The browser submits the resized photo and selected wrap configuration to the authenticated `visualizer.generatePreview` tRPC procedure. The server validates the image data and builds a constrained edit prompt, then calls the server-side image service. Provider credentials are not exposed to the browser.

## Current limitations

- This is a wrap-concept prototype, not a precision 3D configurator.
- Generated results can alter unrequested vehicle details.
- Saved concepts are browser-local, not synchronized to an account or shared between devices.
- Image-generated URLs use the project's storage service; local removal only removes the IndexedDB record.
- No production retention/deletion workflow, image moderation policy, usage quotas, or model-quality service-level targets have been established yet.

## Security and privacy notes

Do not upload photos unless you have permission to use them. Vehicle photographs can include identifying details such as license plates, people, homes, or location metadata. The app resizes an image client-side before generation, but users should not treat this as a guarantee of anonymity. Review the project's provider processing and storage settings before using sensitive or customer photos.
