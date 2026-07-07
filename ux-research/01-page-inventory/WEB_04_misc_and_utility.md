# Page Inventory — Web · Misc / Utility / Legal / Admin

---

## PAGE — Family (marketing) `/family`
- **Purpose:** Marketing landing for the Family Vault feature (distinct from the in-dashboard family tab).
- **Inputs:** Language; static sample member data (Amma/Appa/Kavitha with scores).
- **Outputs:** Hero + family-score mockup figure; 4 benefit cards (Vault/Daily/Match/Private); 3-step "how it works"; CTA strip.
- **Buttons:** "Get started" → `/dashboard`; "See all features" → `/features/family-planning`; CTA → `/dashboard`.
- **Dependencies:** `marketing-i18n` (FAMILY_PAGE). No API.

## PAGE — Notifications Inbox `/notifications`
- **Purpose:** Desktop mirror of the mobile notification history (Chandrashtama alerts, timing reminders, daily nudges). **Requires session.**
- **Inputs:** Session (`useSession` hydration); loads inbox on mount.
- **Outputs:** Header w/ unread count; list of notification cards (type badge, title, body, timestamp, unread dot); loading/empty/error states.
- **Buttons:** "Back to dashboard" → `/dashboard`; "Mark all read" (`POST /notifications/read-all`); per-item "Mark read" (`POST /notifications/{id}/read`).
- **Actions:** Load inbox (`GET /notifications`), mark read (single/all).
- **Dependencies:** `apiFetchJson`, `useSession`, `NotificationInboxResponse` type. Not in PublicNav shell (own layout).

## PAGE — Beta `/beta`
- **Purpose:** Explain open-beta status (everything free while refining), roadmap, feedback framing.
- **Component:** `BetaPageContent` inside PublicNav/Footer shell.
- **Inputs:** Static. **Outputs:** Beta explainer content. Linked from footer beta line.

## PAGE — Privacy `/privacy` & Terms `/terms`
- **Purpose:** Legal pages (privacy policy / terms of service).
- **Inputs:** Static content. **Outputs:** Long-form legal prose. Linked from footer.

## PAGE — Share Panchangam `/share/panchangam`
- **Purpose:** Standalone shareable panchangam card surface (for social/WhatsApp share targets/deep-links).
- **Outputs:** Rendered share card. **Dependencies:** panchangam share-card components + `/public/panchangam`.

## PAGE — Widget Panchangam `/widget/panchangam`
- **Purpose:** Embeddable panchangam widget (compact, likely for embedding on other sites / minimal chrome).
- **Outputs:** Compact panchangam widget. **Dependencies:** `/public/panchangam`.

## PAGE — Admin Console `/admin`
- **Purpose:** Internal admin panel (user lookup, stats, analytics).
- **Access control:** Server component — reads `vinaadi_token` cookie; if absent → redirect `/login`; verifies admin by calling `GET /api/v1/admin/stats` (backend `get_admin_user` 403s non-admins) → non-admin redirect `/`. `robots: noindex,nofollow`.
- **Component:** `AdminConsole` (own `admin.css`).
- **Outputs:** Admin dashboards (users, stats, analytics — via `/admin/*` + `/admin_analytics` endpoints).
- **Dependencies:** cookie auth, `/admin/stats`, `AdminConsole` component.
