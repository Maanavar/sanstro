# Public Site QA Checklist
**Version:** 1.0  
**Date:** 2026-06-02  
**Purpose:** Repeatable pre-launch and post-change QA for all Vinaadi public pages

---

## How to use

Run this checklist before deploying any new public page or making significant changes to existing ones.

---

## 1. Metadata

- [ ] Page has a `<title>` tag (via `export const metadata`)
- [ ] Title is unique and descriptive (not just "Vinaadi")
- [ ] `description` meta is present, 120–160 characters, assistant-first copy
- [ ] `canonical` URL is set correctly
- [ ] `openGraph.title` and `openGraph.description` are present
- [ ] `robots` directive is correct — `index: true` for public pages, `index: false` for login/dashboard

---

## 2. Content quality

- [ ] Page has a clear, useful H1
- [ ] Copy is assistant-first and Thirukanitham-grounded — not tool-first or keyword-stuffed
- [ ] No placeholder copy ("Lorem ipsum", "TBD", "[TODO]")
- [ ] No fake claims or overclaiming astrology results
- [ ] Content is substantial — not a thin page
- [ ] Calm tone — no fear language, no doom language

---

## 3. Links

- [ ] All internal links point to existing pages (no 404s)
- [ ] Footer privacy/terms links point to `/privacy` and `/terms` (not `href="#"`)
- [ ] Nav links resolve correctly
- [ ] CTA links point to `/dashboard` or `/login` (real destinations)
- [ ] No orphan pages — each page links to at least one related page

---

## 4. Sitemap

- [ ] New page is added to `web/app/sitemap.ts`
- [ ] Priority is appropriate (0.9 for key tool/feature pages, 0.7 for learn pages, 0.4 for legal)
- [ ] `changeFrequency` is appropriate for the page type

---

## 5. Robots

- [ ] `robots.ts` allows indexing of the page's route prefix
- [ ] Private routes (dashboard, API) remain disallowed

---

## 6. Visual / Layout

- [ ] Page uses `clarity-shell` root class and `cl-nav` / `cl-footer` structure
- [ ] Page renders correctly at 1280px desktop width
- [ ] Page renders correctly at 768px tablet width
- [ ] Page renders correctly at 375px mobile width
- [ ] No horizontally overflowing content on mobile
- [ ] Typography is readable — no tiny text or broken line-heights
- [ ] CTA buttons are visible and have adequate tap target size

---

## 7. Accessibility

- [ ] Images have `alt` text (decorative images use `aria-hidden`)
- [ ] Headings form a logical hierarchy (H1 → H2 → H3)
- [ ] Links have descriptive text (not "click here" or bare URLs)
- [ ] Nav has `aria-label="Primary navigation"`
- [ ] Color contrast is sufficient (the cl- design system passes this by default)

---

## 8. Build

- [ ] `npm run build` passes with no errors in `web/`
- [ ] No TypeScript errors
- [ ] No missing imports

---

## 9. Internal linking

- [ ] Page links to at least one feature page (for tool/learn pages)
- [ ] Page links to at least one tool page where relevant
- [ ] Page links to the assistant product story (homepage or dashboard CTA)
- [ ] Learn pages link to a relevant tool page

---

## 10. Product truth

- [ ] Page is assistant-first, not tool-first
- [ ] Vinaadi is positioned as a guide/assistant, not a collection of calculators
- [ ] Thirukanitham is referenced where methodology is discussed
- [ ] No generic or reused copy from other astrology sites

---

## Quick pre-launch sign-off

| Check | Status |
|---|---|
| Metadata complete | ☐ |
| No broken links | ☐ |
| Mobile layout valid | ☐ |
| CTA destinations valid | ☐ |
| No placeholder copy | ☐ |
| Build passes | ☐ |
| Sitemap updated | ☐ |
| Assistant-first copy | ☐ |
