# Attraction Page — Style & Size Standards

Purpose

- Provide clear, machine- and human-readable standards for the Attractions page visual system so AI assistants and developers keep a consistent look and spacing across edits.

Scope

- Applies to: `attractions.html`, `css/attractions.css`, any components used by the Attractions page (cards, hero, filters, sidebar, map, pagination, trust badges).
- Does NOT change behavior, data logic, or routing.

Layout & Container

- Page content center container: `max-width: 1180px` (preferred) or `min(100%, 1180px)`; horizontal padding `16px` on small screens and `24px` on large screens.
- Grid: 2 columns on desktop: `grid-template-columns: 1fr 340px` (or `1fr 360px`), gap `18px`.
- Breakpoints: desktop >= 1180px (two-column); tablet 768–1179: single column with stacked sidebar; mobile <768: stacked with compact paddings.

Hero

- Hero height: compact: `min-height: 320px` (desktop smaller variant `~420px` allowed), padding `48px 28px` (desktop) then `24px` on mobile.
- Heading `h1` sizing: `font-size: clamp(1.6rem, 3.6vw, 2.8rem)` (keeps hero title compact and responsive).
- Tagline/body: `font-size: 1rem` and `max-width: 640px`.

Filters bar

- Container: elevated card overlapping hero. Padding `12px 14px`.
- Inputs/selects height: `min-height: 40px` (h-10 equivalent), border-radius `10-12px`.
- Fonts: labels `font-size: 0.62rem`, inputs `0.88rem`.

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

- Width: `340px`–`360px` on desktop; sticky: `position: sticky; top: calc(var(--explorer-nav-offset) + 14px)`.
- Sidebar cards padding `p-4` (`16px`) and gap between items `12`–`14px`.

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

Trust Badges

- Use 4 compact cards in a row; padding `12px-14px`; icon size `38px`; text `0.9rem` heading, body `0.82rem`.

Pagination

- Buttons `36px` square, rounded `11px`, small text `0.9rem`.

Responsive Rules Summary

- Desktop (>=1180px): container centered max-width 1180px, two-column grid with `1fr 340px`.
- Tablet (768–1179px): single column (list first), sidebar stacked, inputs 40px high, spacing reduced.
- Mobile (<768px): stack everything, hero reduced to `min-height: 260px`, headings reduced to `clamp(1.6rem,6vw,2.8rem)`.

CSS Variables (recommended)

- Use variables in `:root` for key tokens:
  - `--container-width: 1180px`
  - `--card-radius: 16px`
  - `--thumb-w: 230px`
  - `--thumb-h: 180px`
  - `--sidebar-w: 340px`
  - `--map-h: 274px`
  - `--btn-h: 40px`

Example snippets

```css
:root {
  --container-width: 1180px;
  --thumb-w: 230px;
  --thumb-h: 180px;
  --card-radius: 16px;
  --sidebar-w: 340px;
  --map-h: 274px;
}
.explorer-shell {
  max-width: min(100%, var(--container-width));
  padding: 0 16px;
}
.attraction-card {
  grid-template-columns: var(--thumb-w) 1fr;
  border-radius: var(--card-radius);
}
.attraction-card-media img {
  width: var(--thumb-w);
  height: var(--thumb-h);
  object-fit: cover;
}
```

Guidelines for AI/editor

- Only modify sizing, spacing, and token values above — do not change data flow, JS logic, API endpoints, or route names.
- Prefer using the CSS variables above when changing sizes so values remain consistent.
- Keep typography scale subtle; headings should not be oversized relative to the card content.

Where to add changes

- Primary stylesheet: `css/attractions.css` (component-scoped overrides)
- Shared tokens: `css/style.css` (`:root` variables)

If you want, I can add this file to `docs/` and also add the CSS `:root` variables stub to `css/style.css` so tokens are present. Reply "apply tokens" to add variable tokens to `css/style.css` and I'll patch the file.
