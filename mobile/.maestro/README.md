# Maestro Visual QA

Maestro is a lightweight YAML-based E2E harness that drives a real iOS simulator or Android emulator.

## Prerequisites

1. **Install Maestro CLI** (macOS/Linux):
   ```sh
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```
   Windows: use WSL2 or the [GitHub releases](https://github.com/mobile-dev-inc/maestro/releases).

2. **Build a dev client** (Expo Go does NOT load native modules like RevenueCat/Sentry):
   ```sh
   pnpm eas build --profile development --platform ios
   # or for a local build:
   pnpm expo run:ios
   ```

3. **Boot a simulator / connect a device** and install the dev build.

4. **Set environment variables** for the login flow:
   ```sh
   export TEST_EMAIL=your-sandbox-account@example.com
   export TEST_PASSWORD=yourpassword
   ```

## Running flows

Run all six golden-path flows in order:
```sh
cd mobile
maestro test .maestro/flows \
  --env TEST_EMAIL=$TEST_EMAIL \
  --env TEST_PASSWORD=$TEST_PASSWORD
```

Run a single flow:
```sh
maestro test .maestro/flows/01_launch.yaml
```

Or via npm:
```sh
pnpm qa:maestro
```

## Flow overview

| File | What it tests |
|------|--------------|
| `01_launch.yaml` | App boots, splash clears, auth gate visible |
| `02_login.yaml` | Login with sandbox credentials → Today tab |
| `03_today.yaml` | Today tab renders without crash, scrollable |
| `04_panchangam.yaml` | Panchangam tab renders, calendar swipeable |
| `05_premium.yaml` | Premium screen opens, offerings or skeleton visible |
| `06_tools.yaml` | Tools grid renders, Muhurta screen opens |

## RevenueCat sandbox validation

- Requires a sandbox Apple/Google account.
- After installing the dev build, `05_premium.yaml` will trigger `Purchases.getOfferings()`.
- Verify purchase flow manually: tap a package in the Premium screen → Apple/Google sandbox dialog should appear.

## Sentry validation

After adding a real `SENTRY_DSN` to `.env.local`:
1. Trigger a test error in the app (or add a temporary throw in `analytics.ts`).
2. Open your Sentry dashboard → Issues — the event should appear within seconds.

## Screenshot capture (optional)

`react-native-view-shot` is already installed. To add screenshot assertions, use:
```yaml
- takeScreenshot: my_screenshot
```
Maestro saves screenshots to `~/.maestro/tests/<run-id>/`. Pixel-diff regression needs a baseline run first.
