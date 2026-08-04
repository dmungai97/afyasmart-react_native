// The admin console reuses the onboarding funnel's "clinical stationery"
// palette (see src/onboarding/theme.ts) so it reads as the same product
// instead of a bolted-on generic SaaS dashboard. Screens here currently
// inline these as local hex constants rather than importing this file
// directly (StyleSheet.create runs at module load, before most components
// exist, so there's little practical difference) — treat this file as the
// source of truth for admin colors and keep new work consistent with it.
export {
  PAPER,
  INK,
  INK_MUTED,
  INK_FAINT,
  ACCENT,
  RULE,
  RULE_STRONG,
  SUCCESS,
  WARNING,
  DANGER,
} from "@/src/onboarding/theme";

// Card/panel surface — a near-white, warm-tinted white rather than pure
// #fff, so bordered "cards" still read as paper rather than glossy chrome.
// The admin console is data-dense enough (tables, KPI grids, forms) that
// going fully cardless like the onboarding funnel isn't practical, so this
// is the one deliberate departure from the onboarding palette.
export const SURFACE = "#FBFCF9";

// Muted status tints — a light background + a slightly darker border, both
// desaturated into the stationery family, used for badges/pills instead of
// the saturated pastel fills (bright green/red/amber) a generic dashboard
// would reach for.
export const TINT_SUCCESS_BG = "#E4EAE0";
export const TINT_SUCCESS_BORDER = "#B9C9BC";
export const TINT_WARNING_BG = "#F4EBD3";
export const TINT_WARNING_BORDER = "#DDC98A";
export const TINT_DANGER_BG = "#F1E3DE";
export const TINT_DANGER_BORDER = "#D9B3A8";
export const TINT_NEUTRAL_BORDER = "#B9C9BC";
