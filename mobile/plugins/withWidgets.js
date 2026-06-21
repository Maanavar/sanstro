const {
  withEntitlementsPlist,
  withAndroidManifest,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const APP_GROUP = "group.ai.vinaadi";
const DEFAULT_ANDROID_PACKAGE = "ai.vinaadi.app";

function getAndroidPackage(config) {
  return config.android?.package ?? DEFAULT_ANDROID_PACKAGE;
}

function getWidgetPackage(config) {
  return `${getAndroidPackage(config)}.widgets`;
}

const withIosAppGroup = (config) =>
  withEntitlementsPlist(config, (mod) => {
    const existing =
      mod.modResults["com.apple.security.application-groups"] ?? [];

    if (!existing.includes(APP_GROUP)) {
      mod.modResults["com.apple.security.application-groups"] = [
        ...existing,
        APP_GROUP,
      ];
    }

    return mod;
  });

const withAndroidWidgetManifest = (config) =>
  withAndroidManifest(config, (mod) => {
    const widgetPackage = getWidgetPackage(config);
    const app = mod.modResults.manifest.application?.[0];
    if (!app) return mod;

    app.receiver = app.receiver ?? [];

    const providerExists = app.receiver.some(
      (receiver) =>
        receiver.$?.["android:name"] ===
        `${widgetPackage}.VinaadiWidgetProvider`
    );

    if (!providerExists) {
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

      app.receiver.push({
        $: {
          "android:name": `${widgetPackage}.VinaadiWidgetRefreshReceiver`,
          "android:exported": "false",
        },
        "intent-filter": [
          {
            action: [{ $: { "android:name": "ai.vinaadi.WIDGET_REFRESH" } }],
          },
        ],
      });
    }

    return mod;
  });

const withAndroidWidgetFiles = (config) =>
  withDangerousMod(config, [
    "android",
    (mod) => {
      const projectRoot = mod.modRequest.projectRoot;
      const androidRoot = path.join(projectRoot, "android", "app", "src", "main");
      const widgetSrc = path.join(projectRoot, "widgets", "android");
      const androidPackage = getAndroidPackage(config);
      const widgetPackage = getWidgetPackage(config);

      const ktDest = path.join(androidRoot, "java", ...widgetPackage.split("."));
      fs.mkdirSync(ktDest, { recursive: true });

      for (const file of [
        "VinaadiWidgetProvider.kt",
        "VinaadiWidgetRefreshReceiver.kt",
      ]) {
        const src = path.join(widgetSrc, file);
        const dst = path.join(ktDest, file);
        if (fs.existsSync(src)) {
          copyWidgetSourceFile(src, dst, widgetPackage, androidPackage);
        }
      }

      const resSrc = path.join(widgetSrc, "res");
      const resDst = path.join(androidRoot, "res");
      copyDirRecursive(resSrc, resDst);

      return mod;
    },
  ]);

function copyDirRecursive(src, dst) {
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

function copyWidgetSourceFile(src, dst, widgetPackage, androidPackage) {
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

const withWidgets = (config) => {
  config = withIosAppGroup(config);
  config = withAndroidWidgetManifest(config);
  config = withAndroidWidgetFiles(config);
  return config;
};

module.exports = withWidgets;
