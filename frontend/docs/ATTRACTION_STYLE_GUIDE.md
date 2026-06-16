# Attraction Page — Style & Size Standards

Purpose

- Provide clear, machine- and human-readable standards for the Attractions page visual system so AI assistants and developers keep a consistent look and spacing across edits.

Scope

- Applies to: `attractions.html`, `css/attractions.css`, any components used by the Attractions page (cards, hero, filters, sidebar, map, pagination, trust badges).
- Does NOT change behavior, data logic, or routing.

Layout & Container

- Page content center container: `min(100%, 1400px)` (matches current design); horizontal padding `16px` on mobile and `40px` on desktop.
- Grid: 2 columns on desktop: `grid-template-columns: minmax(0, 1fr) 350px`, gap `18px`.
- Main grid: `explorer-main-grid` with `display: grid` and `align-items: start`.
- Breakpoints: desktop >= 1180px (two-column); tablet 768–1179: single column with stacked sidebar; mobile <768: stacked with full-width layout.

Hero

- Hero height: `100vh` (full viewport height), `min-height: 100vh`, padding `80px 40px` on desktop.
- Background: Full-width image with overlay gradient `linear-gradient(120deg, rgba(12, 34, 32, 0.74), rgba(12, 34, 32, 0.42))`, background-attachment `fixed`.
- Hero extends full viewport width: `width: calc(100vw)`, with negative margins `margin-left: calc(-50vw + 50%)`.
- Heading `h1` sizing: `font-size: clamp(1.6rem, 3.6vw, 2.8rem)`, `line-height: 1.02`, `letter-spacing: -0.04em`, color `#fff`.
- Hero tag: `background: rgba(255, 255, 255, 0.16)`, `border-color: rgba(255, 255, 255, 0.18)`, border-radius `999px`.
- Tagline/body: `font-size: 1.05rem`, `color: rgba(255, 255, 255, 0.88)`, `line-height: 1.7`, `max-width: 640px`.
- Positioned at bottom with `display: flex`, `align-items: flex-end`.

Filters bar

- Container class: `explorer-filters-card explorer-filters-bar`. Padding `12px 14px`.
- Elevated card with negative margin-top: `-18px` to overlap hero.
- Border-radius: `24px`. Background `#fff`. Border `1px solid #e8e1d8`.
- Filter grid: `explorer-filter-grid-compact` with `grid-template-columns: minmax(190px, 1.18fr) repeat(4, minmax(120px, 1fr)) auto`.
- Inputs/selects height: `min-height: 40px`, border-radius `11px`, padding `0 11px`.
- Border: `1px solid #e8e1d8`. Box-shadow: `inset 0 1px 0 rgba(255, 255, 255, 0.9)`.
- Focus state: `border-color: rgba(15, 76, 76, 0.5)`, `box-shadow: 0 0 0 4px rgba(15, 76, 76, 0.08)`.
- Labels: `font-size: 0.62rem`, `font-weight: 700`, `letter-spacing: 0.12em`, `text-transform: uppercase`, color `#6b7280`.
- Input text: `font-size: 0.88rem`, color `#1d2525`.

Listing Cards (Attraction Card)

- Card dimensions: desktop thumbnail width `220px`–`240px`, thumbnail height `170px`–`180px`; overall card min-height `170px` max `190px`.
- Card padding: `p-4` (approx `16px`). Border-radius `16px`–`20px`.
- Grid: `grid-template-columns: 230px 1fr` (use `230px` thumbnail for compact look).
- Title: `font-size: 1.0rem`–`1.1rem` (use `1.08rem`), `line-height: 1.12`.
- Description: `font-size: 0.88rem`, clamp to 2 lines (`-webkit-line-clamp: 2`).
- Metadata/chips: `font-size: 0.72rem`, padding `px-3 py-1` (approx `5px 9px`), gap `6px`.
- Favorite button: `34px` square (small round button).
- Actions/buttons: height ~`40px`, padding `px-4`, font-size `0.9rem`.

Images

- Use `object-fit: cover` and set explicit width/height as above.
- Corners: left side of card image should have rounded corners matching card radius and no overflow on right.

Badges / Chips

- Use `border-radius: 999px`, `font-size: 0.72rem`, padding `5px 9px`, gap `6px`.

Sidebar

- Width: `350px` on desktop (actual vs documented `340px`–`360px`). Class: `explorer-sidebar`.
- Sticky positioning: `position: sticky; top: calc(var(--explorer-nav-offset) + 14px)`.
- Gap between items: `14px`. Align self: `start`.
- Sidebar cards padding: `16px`. Border-radius `24px`.
- Background `#fff`. Border `1px solid #e8e1d8`. Box-shadow: `var(--shadow-ambient)`.

Map Card

- Map height: `260px`–`280px` (we use `~274px`). Border-radius `14px`–`16px`.
- Button: `height: 40px`, font-size `0.92rem`.

Top Rated

- Thumbnail: `48px` square, radius `12px`.
- Name: `font-size: 0.94rem`, location: `font-size: 0.82rem`.
- Row gap `8px`, padding `8px 0`.

CTA Card

- Padding `16px`, heading `font-size: 1.06rem`, body `0.9rem`.
- Button medium sized (`h-10`, `px-4`).

Trust Badges (Hero)

- Container class: `explorer-hero-trust`. Display `flex`, `flex-wrap: wrap`, gap `14px`, margin-top `22px`.
- Badge class: `explorer-trust-item`. Display `inline-flex`, `align-items: center`, gap `10px`, padding `0 14px`.
- Min-height: `40px`. Border-radius: `999px` (fully rounded pill).
- Background: `rgba(255, 255, 255, 0.14)`. Color: `rgba(255, 255, 255, 0.94)`.
- Font-size: `0.9rem`, `font-weight: 700`.
- Backdrop-filter: `blur(16px)`.
- Icon: width/height `18px`, color `#f9e9dc`.

Pagination

- Buttons `36px` square, rounded `11px`, small text `0.9rem`.

Responsive Rules Summary

- Desktop (≥1180px): Full-height hero, container centered `min(100%, 1400px)`, two-column grid with `1fr 350px`, filters overlap hero.
- Tablet (768–1179px): Reduced hero height, single column layout (list first), sidebar stacked below, filters adjust grid.
- Mobile (<768px): Stack everything, hero adjusted for mobile viewport, padding `16px`, all cards full-width.

CSS Variables (in use)

Current color and layout tokens:

```css
:root {
  --explorer-nav-offset: 94px;
  --container-width: 1400px;
  --card-radius: 24px;
  --sidebar-w: 350px;
  --btn-h: 40px;
  --field-label-size: 0.62rem;
  --field-input-size: 0.88rem;
}
```

Color palette:

- Text primary: `#1d2525`
- Text secondary: `#6b7280`
- Background: `#ffffff`
- Border: `#e8e1d8`
- Accent (teal): `#0f4c4c`
- White overlay: `rgba(255, 255, 255, 0.14)` to `rgba(255, 255, 255, 0.18)`

---

## Implementation Notes

**Class Naming Convention:**

- `.explorer-*` prefix for layout and component classes
- `.explorer-hero-*` for hero section components
- `.explorer-filters-*` for filter-related elements
- `.explorer-results-*` for results/listing components
- `.explorer-sidebar-*` for sidebar components

**Shadow System:**

- Use `var(--shadow-ambient)` for card shadows

**Grid System:**

- Main grid: `display: grid`, `grid-template-columns: minmax(0, 1fr) 350px`
- Filter grid: `grid-template-columns: minmax(190px, 1.18fr) repeat(4, minmax(120px, 1fr)) auto`
- All components use CSS Grid for layout

**Current Page Classes:**

- `.attraction-explorer-page` - Main page container
- `.explorer-shell` - Grid wrapper for hero + content

- Only modify sizing, spacing, and token values above — do not change data flow, JS logic, API endpoints, or route names.
- Prefer using the CSS variables above when changing sizes so values remain consistent.
- Keep typography scale subtle; headings should not be oversized relative to the card content.

Where to add changes

- Primary stylesheet: `css/attractions.css` (component-scoped overrides)
- Shared tokens: `css/style.css` (`:root` variables)

If you want, I can add this file to `docs/` and also add the CSS `:root` variables stub to `css/style.css` so tokens are present. Reply "apply tokens" to add variable tokens to `css/style.css` and I'll patch the file.
