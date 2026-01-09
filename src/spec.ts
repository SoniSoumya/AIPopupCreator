import { z } from "zod";

export const PopupTypeEnum = z.enum(["modal", "banner", "slideup"]);
export type PopupType = z.infer<typeof PopupTypeEnum>;

export const LayoutStructureEnum = z.enum(["image_top", "no_image"]);

export const PopupSpecSchema = z.object({
  type: PopupTypeEnum,
  version: z.literal("1.0"),
  layout: z.object({
    structure: LayoutStructureEnum,
    padding: z.number().int().min(0).max(48),
    cornerRadius: z.number().int().min(0).max(40),
    maxWidth: z.number().int().min(280).max(860),
  }),
  theme: z.object({
    mode: z.enum(["light", "dark"]),
    brandColor: z.string().min(4),
    backgroundColor: z.string().min(4),
    textColor: z.string().min(4),
    mutedTextColor: z.string().min(4),
  }),
  content: z.object({
    headline: z.string().min(1).max(80),
    body: z.string().min(1).max(240),
    image: z.union([
      z.object({ kind: z.literal("none") }),
      z.object({
        kind: z.literal("url"),
        url: z.string().url(),
        alt: z.string().min(1).max(120),
      }),
    ]),
  }),
  ctas: z
    .array(
      z.object({
        id: z.enum(["primary", "secondary"]),
        label: z.string().min(1).max(30),
        action: z.union([
          z.object({ type: z.literal("dismiss") }),
          z.object({ type: z.literal("url"), value: z.string().url() }),
        ]),
        style: z.enum(["primary", "secondary"]),
      })
    )
    .min(1)
    .max(2),
  behavior: z.object({
    dismissible: z.boolean(),
    backdrop: z.boolean(),
  }),
  warnings: z.array(z.string()),
});

export type PopupSpec = z.infer<typeof PopupSpecSchema>;
