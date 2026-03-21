/**
 * Expo config plugin: pins the Android Gradle wrapper to 8.10.2 and sets
 * org.gradle.java.home to Android Studio's bundled JDK 21.
 *
 * Why needed:
 * - react-native-gradle-plugin uses JvmVendorSpec.IBM_SEMERU, removed in Gradle 9.0.0
 *   → Solution: pin wrapper to 8.10.2 (last stable 8.x)
 * - System JDK is 25, which Groovy 3.x (used by Gradle 8.x) cannot compile
 *   → Solution: point org.gradle.java.home to Android Studio's JDK 21
 */
const { withDangerousMod, withGradleProperties } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const COMPATIBLE_GRADLE_VERSION = '8.10.2';
const ANDROID_STUDIO_JDK = 'C:/Program Files/Android/Android Studio/jbr';

function withGradleWrapperVersion(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const gradleWrapperPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle',
        'wrapper',
        'gradle-wrapper.properties'
      );

      if (fs.existsSync(gradleWrapperPath)) {
        let content = fs.readFileSync(gradleWrapperPath, 'utf8');
        content = content.replace(
          /distributionUrl=.*/,
          `distributionUrl=https\\://services.gradle.org/distributions/gradle-${COMPATIBLE_GRADLE_VERSION}-bin.zip`
        );
        fs.writeFileSync(gradleWrapperPath, content);
      }

      return config;
    },
  ]);
}

function withJdk21(config) {
  return withGradleProperties(config, (config) => {
    // Remove any existing org.gradle.java.home entry first
    config.modResults = config.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'org.gradle.java.home')
    );
    // Add our entry pointing to Android Studio JDK 21
    config.modResults.push({
      type: 'property',
      key: 'org.gradle.java.home',
      value: ANDROID_STUDIO_JDK,
    });
    return config;
  });
}

module.exports = function withGradleBuildFixes(config) {
  config = withGradleWrapperVersion(config);
  config = withJdk21(config);
  return config;
};
