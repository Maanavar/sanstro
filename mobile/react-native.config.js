// Override expo's android autolinking to use the correct package path.
// expo@52 has `namespace "expo.core"` in build.gradle but ExpoModulesPackage
// lives in the `expo.modules` Java package. Without this override the
// autolinking fallback generates `import expo.core.ExpoModulesPackage;`
// which fails to compile.
module.exports = {
  dependencies: {
    expo: {
      platforms: {
        android: {
          packageImportPath: 'import expo.modules.ExpoModulesPackage;',
          packageInstance: 'new ExpoModulesPackage()',
        },
      },
    },
  },
};
