// Source: https://stackoverflow.com/a/75997550/6944050
// Source: https://stackoverflow.com/a/75907392/6944050
// 1. Add this file to plugins/disable_android_tablet.js
// 2. Add the { "plugins": [ "./plugins/disable_android_tablet.js" ] } to app.config.js
// 3. Run `npx expo prebuild --platform android --no-install` to view the Android build
const { withAndroidManifest } = require("@expo/config-plugins")

function addAttributesToManifest(androidManifest) {
  const { manifest } = androidManifest;

  const supportsScreens = {};
  supportsScreens.$ = {
    ...supportsScreens.$,
    ...{
      "android:smallScreens": true,
      "android:normalScreens": true,
      "android:largeScreens": true,
      "android:xlargeScreens": true,
    },
  };

  manifest["supports-screens"] = supportsScreens;

  return androidManifest
}

module.exports = function withSupportsScreens(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = addAttributesToManifest(config.modResults);
    return config;
  });
};
