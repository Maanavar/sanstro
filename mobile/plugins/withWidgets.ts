/**
 * Expo config plugin — native widget wiring.
 *
 * iOS:
 *   - Adds App Group entitlement (group.ai.vinaadi) to the main app target.
 *   - The Widget Extension target itself must be created in Xcode using
 *     File → New Target → Widget Extension, then adding the two Swift source
 *     files from mobile/widgets/ios/. This is a one-time manual step because
 *     Expo's config-plugin API does not yet support creating new targets
 *     without expo-apple-targets.
 *
 * Android:
 *   - Registers VinaadiWidgetProvider (small + medium) in AndroidManifest.xml.
 *   - Registers VinaadiWidgetRefreshReceiver.
 *   - Copies all XML resources from mobile/widgets/android/res/ into the
 *     generated Android project.
 *   - Copies Kotlin source files into the correct package directory.
 */

import {
  ConfigPlugin,
  withEntitlementsPlist,
  withAndroidManifest,
  withDangerousMod,
} from "@expo/config-plugins";
import * as fs from "fs";
import * as path from "path";

const APP_GROUP = "group.ai.vinaadi";
const DEFAULT_ANDROID_PACKAGE = "ai.vinaadi.app";

function getAndroidPackage(config: { android?: { package?: string } }): string {
  return config.android?.package ?? DEFAULT_ANDROID_PACKAGE;
}

function getWidgetPackage(config: { android?: { package?: string } }): string {
  return `${getAndroidPackage(config)}.widgets`;
}

// ─── iOS entitlement ────────────────────────────────────────────────────────

const withIosAppGroup: ConfigPlugin = (config) =>
  withEntitlementsPlist(config, (mod) => {
    const existing: string[] =
      (mod.modResults["com.apple.security.application-groups"] as string[] | undefined) ?? [];
    if (!existing.includes(APP_GROUP)) {
      mod.modResults["com.apple.security.application-groups"] = [
        ...existing,
        APP_GROUP,
      ];
    }
    return mod;
  });

// ─── Android manifest ───────────────────────────────────────────────────────

type AndroidManifestApplication = {
  $: Record<string, string>;
  receiver?: Array<{
    $: Record<string, string>;
    "intent-filter"?: Array<{
      action?: Array<{ $: Record<string, string> }>;
      "meta-data"?: Array<{ $: Record<string, string> }>;
    }>;
    "meta-data"?: Array<{ $: Record<string, string> }>;
  }>;
};

const withAndroidWidgetManifest: ConfigPlugin = (config) =>
  withAndroidManifest(config, (mod) => {
    const widgetPackage = getWidgetPackage(config);
    const app = mod.modResults.manifest.application?.[0] as
      | AndroidManifestApplication
      | undefined;
    if (!app) return mod;

    app.receiver = app.receiver ?? [];

    const providerExists = app.receiver.some(
      (r) =>
        r.$?.["android:name"] === `${widgetPackage}.VinaadiWidgetProvider`
    );

    if (!providerExists) {
      // A single provider can render both small and medium layouts at runtime.
      app.receiver.push({
        $: {
          "android:name": `${widgetPackage}.VinaadiWidgetProvider`,
          "android:label": "Vinaadi Widget",
          "android:exported": "false",
        },
        "intent-filter": [
          {
            action: [
              {
                $: { "android:name": "android.appwidget.action.APPWIDGET_UPDATE" },
              },
            ],
          },
        ],
        "meta-data": [
          {
            $: {
              "android:name": "android.appwidget.provider",
              "android:resource": "@xml/widget_info_small",
            },
          },
        ],
      });

      // Refresh receiver (alarm-triggered)
      app.receiver.push({
        $: {
          "android:name": `${widgetPackage}.VinaadiWidgetRefreshReceiver`,
          "android:exported": "false",
        },
        "intent-filter": [
          {
            action: [
              { $: { "android:name": "ai.vinaadi.WIDGET_REFRESH" } },
            ],
          },
        ],
      });
    }

    return mod;
  });

// ─── Android: copy native files ─────────────────────────────────────────────

const withAndroidWidgetFiles: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    "android",
    (mod) => {
      const projectRoot = mod.modRequest.projectRoot;
      const androidRoot = path.join(projectRoot, "android", "app", "src", "main");
      const widgetSrc = path.join(projectRoot, "widgets", "android");
      const androidPackage = getAndroidPackage(config);
      const widgetPackage = getWidgetPackage(config);

      // Copy Kotlin source files
      const ktDest = path.join(
        androidRoot,
        "java",
        ...widgetPackage.split(".")
      );
      fs.mkdirSync(ktDest, { recursive: true });
      for (const file of ["VinaadiWidgetProvider.kt", "VinaadiWidgetRefreshReceiver.kt"]) {
        const src = path.join(widgetSrc, file);
        const dst = path.join(ktDest, file);
        if (fs.existsSync(src)) {
          copyWidgetSourceFile(src, dst, widgetPackage, androidPackage);
        }
      }

      // Copy XML resources (res/drawable, res/layout, res/xml)
      const resSrc = path.join(widgetSrc, "res");
      const resDst = path.join(androidRoot, "res");
      copyDirRecursive(resSrc, resDst);

      return mod;
    },
  ]);

function copyDirRecursive(src: string, dst: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, dstPath);
    } else if (!fs.existsSync(dstPath)) {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

function copyWidgetSourceFile(
  src: string,
  dst: string,
  widgetPackage: string,
  androidPackage: string
) {
  let contents = fs.readFileSync(src, "utf8");
  contents = contents.replace(
    /^package\s+ai\.vinaadi\.app\.widgets/m,
    `package ${widgetPackage}`
  );

  if (src.endsWith("VinaadiWidgetProvider.kt")) {
    contents = contents.replace(
      /^package\s+[^\n]+\n/m,
      (match) => `${match}\nimport ${androidPackage}.R\n`
    );
  }

  fs.writeFileSync(dst, contents);
}

// ─── Compose ────────────────────────────────────────────────────────────────

const withWidgets: ConfigPlugin = (config) => {
  config = withIosAppGroup(config);
  config = withAndroidWidgetManifest(config);
  config = withAndroidWidgetFiles(config);
  return config;
};

export default withWidgets;
