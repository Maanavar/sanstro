/**
 * Writes today's panchangam snapshot to shared native storage so the iOS
 * and Android home-screen widgets can display it without opening the app.
 *
 * iOS:  react-native-shared-group-preferences → UserDefaults(suiteName: "group.ai.vinaadi")
 * Android: same library → SharedPreferences file "vinaadi_widget"
 *
 * After writing, reloads the iOS WidgetKit timeline so widgets update instantly.
 */

import { Platform } from "react-native";

const IOS_GROUP    = "group.ai.vinaadi";
const ANDROID_FILE = "vinaadi_widget";

type PrefsModule = {
  setItem: (key: string, value: string, group: string) => Promise<void>;
};

type WidgetKitModule = {
  reloadAllTimelines: () => void;
};

export interface WidgetSnapshot {
  nallaNeram: string;
  rahuKalam:  string;
  rasiPalan:  string;
  tamilDate:  string;
  lang:       "ta" | "en";
}

// Lazy-load the native module so the app doesn't crash if the package is not
// yet linked (e.g., during Expo Go dev builds that skip native modules).
function getPrefsModule() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("react-native-shared-group-preferences") as
      | ({ default?: PrefsModule } & Partial<PrefsModule>)
      | PrefsModule;
    return "default" in mod && mod.default ? mod.default : (mod as PrefsModule);
  } catch {
    return null;
  }
}

function getWidgetKitModule() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("react-native-widgetkit") as
      | ({ default?: WidgetKitModule } & Partial<WidgetKitModule>)
      | WidgetKitModule;
    return "default" in mod && mod.default
      ? mod.default
      : (mod as WidgetKitModule);
  } catch {
    return null;
  }
}

export async function pushWidgetData(snap: WidgetSnapshot): Promise<void> {
  const prefs = getPrefsModule();
  if (!prefs) return;

  const group = Platform.OS === "ios" ? IOS_GROUP : ANDROID_FILE;

  try {
    await Promise.all([
      prefs.setItem("vinaadi_nalla_neram", snap.nallaNeram, group),
      prefs.setItem("vinaadi_rahu_kalam",  snap.rahuKalam,  group),
      prefs.setItem("vinaadi_rasi_palan",  snap.rasiPalan,  group),
      prefs.setItem("vinaadi_tamil_date",  snap.tamilDate,  group),
      prefs.setItem("vinaadi_lang",        snap.lang,        group),
    ]);

    if (Platform.OS === "ios") {
      getWidgetKitModule()?.reloadAllTimelines();
    }
  } catch {
    // Non-fatal — widgets will show cached or placeholder data.
  }
}
