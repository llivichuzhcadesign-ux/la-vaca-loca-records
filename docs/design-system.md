# LVL public design foundation — Phase 1

## Intent
Premium independent record store: functional sans-serif UI, restrained editorial serif, photography and artwork as the visual focus. Metallic gold is a branding accent, not a universal surface. Ink, ivory, wine and olive remain unchanged.

## Shared contract
`site-theme.tokens.css` is the source of truth for UI font families, text roles, spacing and control targets. It loads on all five public pages. The current families are Arial/Helvetica and Georgia/Times New Roman; no external font request is introduced. A self-hosted font can be evaluated after browser review.

| Role | Default at a 16px root |
|---|---:|
| Label / supporting metadata | 12px |
| Metadata / compact navigation | 13px |
| Controls | 14px |
| Body / record names | 16px |
| Card emphasis | 18px |
| Subheading | 22px |
| Editorial section heading | 32–84px |
| Page heading | 42–112px (component-specific caps allowed) |

Use rem-based tokens for functional text, fluid headings and the shared gutter. Preserve the decorative equipment markings and artwork lettering; these are not the primary accessible controls. Use the existing 44px target as the baseline for touch controls. For new components, use visible focus and do not hide interactive labels. Keep form fields at 1rem or larger.

Spacing scale: 4, 8, 16, 24, 32, 48, 64 and 96px at the default root. Prefer the tokens when editing related components rather than adding another override layer.

## Boundaries
Phase 1 migrates the font declarations and key text roles in existing component stylesheets, with shared homepage rhythm and focus defaults. It does not replace the metallic SVG, redesign navigation or cursor, change audio playback, alter Admin, change content, or unify the device-dependent player architecture. Existing compatibility color aliases are retained to avoid breaking current components. Some legacy CSS and page-specific sizes remain intentional until targeted cleanup.

## Verification gates before next phase
Review 320, 375, 390, 430, 768, 820, 950/951, 1024, 1280, 1440 and 1920 CSS-pixel widths; include portrait/landscape, short laptop heights, browser zoom, keyboard navigation, iOS Safari, Android Chrome, Windows Chrome/Edge and macOS Safari. Test populated and empty catalogs, forms, drawer and player. Source checks are not a substitute for rendering or physical-device tests.
