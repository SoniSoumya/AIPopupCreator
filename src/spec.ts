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

    // Always present keys: enabled/url/alt
    image: z
      .object({
        enabled: z.boolean(),
        url: z.string(),
        alt: z.string(),
      })
      .superRefine((val, ctx) => {
        if (val.enabled) {
          if (!val.url || !/^https?:\/\//.test(val.url)) {
            ctx.addIssue({ code: "custom", message: "image.url must be a valid URL when image.enabled is true." });
          }
          if (!val.alt || val.alt.trim().length < 1) {
            ctx.addIssue({ code: "custom", message: "image.alt is required when image.enabled is true." });
          }
        }
      }),
  }),
  ctas: z
    .array(
      z.object({
        id: z.enum(["primary", "secondary"]),
        label: z.string().min(1).max(30),
        // Always present keys: type/value
        action: z
          .object({
            type: z.enum(["dismiss", "url"]),
            value: z.string(),
          })
          .superRefine((val, ctx) => {
            if (val.type === "url") {
              if (!val.value || !/^https?:\/\//.test(val.value)) {
                ctx.addIssue({ code: "custom", message: "action.value must be a valid URL when action.type is 'url'." });
              }
            }
          }),
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
