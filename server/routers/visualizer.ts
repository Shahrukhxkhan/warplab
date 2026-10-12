import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { generateImage } from "../_core/imageGeneration";
import { protectedProcedure, router } from "../_core/trpc";

const MAX_IMAGE_BYTES = 7 * 1024 * 1024;
const wrapColors = {
  obsidian: "deep obsidian black",
  porcelain: "warm porcelain white",
  evergreen: "deep British racing green",
  amethyst: "satin amethyst violet",
  glacier: "glacier ice blue",
  copper: "burnished copper orange",
  crimson: "rich crimson red",
  graphite: "metallic graphite gray",
} as const;

const finishes = {
  gloss: "high-gloss",
  satin: "satin",
  matte: "matte",
  metallic: "metallic",
} as const;

export type WrapColorId = keyof typeof wrapColors;
export type WrapFinishId = keyof typeof finishes;

const generationInput = z.object({
  imageDataUrl: z.string().min(1).max(10_000_000),
  colorId: z.enum([
    "obsidian",
    "porcelain",
    "evergreen",
    "amethyst",
    "glacier",
    "copper",
    "crimson",
    "graphite",
  ]),
  finish: z.enum(["gloss", "satin", "matte", "metallic"]),
  additionalNotes: z.string().trim().max(220).optional(),
});

export function parseImageDataUrl(value: string) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(value);
  if (!match) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a valid JPEG, PNG, or WebP car photo." });
  }

  const mimeType = match[1].toLowerCase();
  const base64 = match[2];
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The processed photo must be smaller than 7 MB." });
  }

  const isJpeg = mimeType === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = mimeType === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = mimeType === "image/webp" && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!isJpeg && !isPng && !isWebp) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The photo content does not match its image format." });
  }

  return { mimeType, base64, bytes };
}

export function buildWrapPrompt(
  colorId: WrapColorId,
  finish: WrapFinishId,
  additionalNotes?: string,
) {
  const color = wrapColors[colorId];
  const surface = finishes[finish];
  const notes = additionalNotes?.trim();
  return [
    "Edit the supplied real car photograph into a realistic automotive vinyl wrap concept preview.",
    `Change only the vehicle's exterior painted body panels to a ${surface} ${color} wrap.`,
    "Preserve the same exact vehicle identity, body shape, proportions, panel lines, camera angle, perspective, lighting, reflections, shadows, wheels, tires, glass, lights, trim, background, and composition wherever possible.",
    "Do not add text, logos, people, accessories, body kits, or new objects. Do not redesign or replace the car. Make the wrap follow the existing body panels naturally.",
    notes ? `Additional style direction from the user: ${notes}` : "",
    "This is a visual concept, not a guarantee of real material color or installation accuracy.",
  ].filter(Boolean).join(" ");
}

export const visualizerRouter = router({
  generatePreview: protectedProcedure
    .input(generationInput)
    .mutation(async ({ input }) => {
      const { mimeType, base64 } = parseImageDataUrl(input.imageDataUrl);
      const prompt = buildWrapPrompt(input.colorId, input.finish, input.additionalNotes);

      try {
        const result = await generateImage({
          prompt,
          originalImages: [{ b64Json: base64, mimeType }],
          quality: "medium",
        });
        if (!result.url) {
          throw new Error("The image service returned no preview URL.");
        }
        return { imageUrl: result.url };
      } catch (error) {
        console.error("[Visualizer] Preview generation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "We couldn't generate this preview. Your photo and selections are still here—please try again.",
        });
      }
    }),
});
