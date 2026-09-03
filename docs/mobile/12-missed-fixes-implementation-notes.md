# 12 - Missed Fixes Implementation Notes

**Date:** 2026-06-22

This note tracks the fixes called out after the gap-closure architecture pass in `11-gap-closure-ux-architecture.md`.

## Added foundations

- `mobile/src/components/AnimatedEmptyState.tsx`
  - Reanimated + SVG fallback for missing Lottie/Rive assets.
  - Supports `constellation` and `success` variants.
  - Intended for Jadhagam reveal success, Insights empty state, and future goal completion states until branded animation assets arrive.

- `mobile/src/components/OnboardingProgressBar.tsx`
  - Reusable progress indicator for onboarding and chart creation.
  - Replaces dot-only progress patterns where we want clearer habit/onboarding progression.

- `mobile/src/components/SwipeRouteView.tsx`
  - Gesture-handler wrapper for sibling route swipes.
  - Intended first use: Panchangam daily screen swipes left to monthly calendar; monthly calendar swipes right to daily.

## Still requiring assets or decisions

### Lottie / Rive

Do not add `lottie-react-native` or Rive runtime until the actual animation assets are chosen.

Use `AnimatedEmptyState` meanwhile for:

- Jadhagam reveal success
- Insights empty state
- Goal completed state

### Custom illustrations

Designer-owned. Native fallback is now available through `AnimatedEmptyState`, but final art direction should come from the mobile visual system.

### Temple directory

Keep P2. Recommended implementation remains hybrid:

- native summary entry in Learn
- web deep link for full directory until mobile content model is designed

### PDF export

Backend endpoint exists:

- `GET /api/v1/charts/{chart_id}/export/pdf`

Mobile needs a file-write/share dependency before this is a complete native feature. Use `expo-file-system` or an equivalent approved file persistence path, then share with `react-native-share`.

### Social/community

Do not start without a product spec. Community affects moderation, safety, identity, reporting, privacy, and App Store review posture.

## Wiring checklist

- [ ] Replace Jadhagam reveal checkmark with `AnimatedEmptyState variant="success"`.
- [ ] Replace Insights empty chart panel with `AnimatedEmptyState variant="constellation"`.
- [ ] Replace birth-details progress dots with `OnboardingProgressBar`.
- [ ] Wrap Panchangam daily screen in `SwipeRouteView leftRoute="/(tabs)/panchangam/calendar"`.
- [ ] Wrap Panchangam calendar screen in `SwipeRouteView rightRoute="/(tabs)/panchangam"`.
- [ ] Add a visible streak chip to Today once `useConversionPrompt.recordTodayVisit()` is wired on mount.
- [ ] Add PDF export after file persistence dependency is approved.

