export type PopupType = "modal" | "banner" | "slideup";
export type Mode = "light" | "dark";

export type ElementType = "text" | "image" | "cta";

export type Spacing = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type Align = "left" | "center" | "right";

export type BaseElement = {
  id: string;
  type: ElementType;
  name: string;
  order: number;

  // layout constraints
  margin: Spacing;
  padding: Spacing;
  align: Align;
};

export type TextElement = BaseElement & {
  type: "text";
  text: string;
  fontSize: number; // px
  fontWeight: 400 | 500 | 600 | 700;
  color?: string; // optional override; otherwise theme.textColor
};

export type ImageElement = BaseElement & {
  type: "image";
  url: string;
  alt: string;
  height: number; // px
  radius: number; // px
};

export type CtaElement = BaseElement & {
  type: "cta";
  label: string;
  action: { type: "url" | "dismiss"; value?: string };
  variant: "primary" | "secondary";
  fullWidth: boolean;
};

export type PopupTheme = {
  mode: Mode;
  brandColor: string;
  backgroundColor: string;
  textColor: string;
  mutedTextColor: string;
};

export type PopupContainer = {
  aspectRatio: "auto" | "1:1" | "4:3" | "16:9";
  backgroundColor: string; // can override theme background
  cornerRadius: number;
  showCloseIcon: boolean;
  padding: number;
  backdrop: boolean;
  dismissible: boolean;
  maxWidth: number; // px
};

export type PopupSpec = {
  version: "2.0";
  popupType: PopupType;

  theme: PopupTheme;
  container: PopupContainer;

  // elements render in "order" (ascending)
  elements: Array<TextElement | ImageElement | CtaElement>;

  warnings: string[];
};

export const DEFAULT_SPACING: Spacing = { top: 0, right: 0, bottom: 0, left: 0 };

export function cloneSpacing(s: Spacing): Spacing {
  return { top: s.top, right: s.right, bottom: s.bottom, left: s.left };
}
