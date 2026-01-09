import { z } from "zod";

export type Mode = "light" | "dark";

export const ElementKindEnum = z.enum(["text", "image", "button"]);
export type ElementKind = z.infer<typeof ElementKindEnum>;

export const ContainerSchema = z.object({
  // Required keys (strict-friendly)
  id: z.literal("container"),
  name: z.string(),
  mode: z.enum(["light", "dark"]),
  aspectRatio: z.number().min(0.2).max(4), // width / height
  maxWidth: z.number().int().min(280).max(860),
  cornerRadius: z.number().int().min(0).max(40),
  backgroundColor: z.string(),
  showCloseIcon: z.boolean(),
  backdrop: z.boolean(),
  dismissible: z.boolean(),
  brandColor: z.string(),
  textColor: z.string(),
  mutedTextColor: z.string(),
});

export type ContainerSpec = z.infer<typeof ContainerSchema>;

export const BaseElementSchema = z.object({
  id: z.string().min(1),
  kind: ElementKindEnum,
  name: z.string(),
  hidden: z.boolean(),
});

export const TextElementSchema = BaseElementSchema.extend({
  kind: z.literal("text"),
  text: z.string(),
  fontFamily: z.string(),
  fontSize: z.number().int().min(10).max(72),
  fontWeight: z.number().int().min(300).max(900),
  align: z.enum(["left", "center", "right"]),
  color: z.string(),
});

export type TextElement = z.infer<typeof TextElementSchema>;

export const ImageElementSchema = BaseElementSchema.extend({
  kind: z.literal("image"),
  url: z.string(),
  alt: z.string(),
  height: z.number().int().min(80).max(420),
  fit: z.enum(["cover", "contain"]),
  cornerRadius: z.number().int().min(0).max(24),
});

export type ImageElement = z.infer<typeof ImageElementSchema>;

export const ButtonElementSchema = BaseElementSchema.extend({
  kind: z.literal("button"),
  label: z.string(),
  fontSize: z.number().int().min(10).max(28),
  fontWeight: z.number().int().min(400).max(900),
  cornerRadius: z.number().int().min(0).max(24),
  fillColor: z.string(),
  textColor: z.string(),
  actionType: z.enum(["url", "dismiss"]),
  actionValue: z.string(),
  fullWidth: z.boolean(),
});

export type ButtonElement = z.infer<typeof ButtonElementSchema>;

export const ElementSchema = z.union([TextElementSchema, ImageElementSchema, ButtonElementSchema]);
export type PopupElement = z.infer<typeof ElementSchema>;

export const PopupDocSchema = z.object({
  version: z.literal("2.0"),
  container: ContainerSchema,
  elements: z.array(ElementSchema).min(1),
});

export type PopupDoc = z.infer<typeof PopupDocSchema>;
