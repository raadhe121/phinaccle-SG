// @ts-check
const { withAppBuildGradle } = require('@expo/config-plugins');

// @2c2p/pgw-sdk-react-native@4.0.5 bundles kotlin-stdlib 2.1.20 and pins Kotlin 2.3.21 in its
// own android/build.gradle. Compiling :app against that stdlib jar fails ("compiled with an
// incompatible version of Kotlin") unless the whole project's kotlinVersion (android/build.gradle)
// matches - but it can't be bumped to Kotlin 2.x, because expo-dev-launcher's precompiled gradle
// plugin is built against Kotlin Gradle Plugin 1.9.25 and breaks under Kotlin 2.x
// (KotlinTopLevelExtension changed from a class to an interface in Kotlin Gradle Plugin 2.0,
// causing "Found interface ..., but class was expected" during :app's configuration).
//
// Forcing the resolved kotlin-stdlib version down keeps the whole project on 1.9.25 (compatible
// with expo-dev-launcher) while stopping :app from ever seeing 2c2p's newer stdlib jar.
const KOTLIN_STDLIB_VERSION = '1.9.25';
const MARKER = `force 'org.jetbrains.kotlin:kotlin-stdlib:${KOTLIN_STDLIB_VERSION}'`;

module.exports = function withForcedKotlinStdlib(config) {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.language !== 'groovy') {
            throw new Error('withForcedKotlinStdlib only supports a Groovy android/app/build.gradle');
        }
        if (config.modResults.contents.includes(MARKER)) {
            return config;
        }
        config.modResults.contents += `
// Injected by plugins/force-kotlin-stdlib.js - see comment there for why.
configurations.all {
    resolutionStrategy {
        force 'org.jetbrains.kotlin:kotlin-stdlib:${KOTLIN_STDLIB_VERSION}'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:${KOTLIN_STDLIB_VERSION}'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:${KOTLIN_STDLIB_VERSION}'
        force 'org.jetbrains.kotlin:kotlin-stdlib-common:${KOTLIN_STDLIB_VERSION}'
    }
}
`;
        return config;
    });
};
