import { Platform } from "react-native";

/**
 * The store's own subscriptions screen — the only place a subscription bought
 * in the app can be stopped. Lived inline in `(tabs)/me.tsx`; shared now that
 * `premium.tsx` sends people to the same place (and only when the subscription
 * really came from the store — see `@vinaadi/shared/subscriptionManage`).
 */
export const MANAGE_SUB_URL =
  Platform.OS === "ios"
    ? "itms-apps://apps.apple.com/account/subscriptions"
    : "https://play.google.com/store/account/subscriptions?package=ai.vinaadi.app";
