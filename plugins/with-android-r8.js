const fs = require('node:fs');
const path = require('node:path');
const { withAppBuildGradle, withDangerousMod } = require('expo/config-plugins');
const { getAndroidResourceIdentifier } = require('@react-native/assets-registry/path-support');

module.exports = function withAndroidR8(config) {
  config = withAppBuildGradle(config, (config) => {
    const { modResults } = config;
    const optimized = 'getDefaultProguardFile("proguard-android-optimize.txt")';
    const defaultRules = 'getDefaultProguardFile("proguard-android.txt")';
    if (modResults.language !== 'groovy' ||
        (!modResults.contents.includes(defaultRules) && !modResults.contents.includes(optimized))) {
      throw new Error('Unsupported Android Gradle template: review the R8 default ProGuard configuration.');
    }
    // SDK 57 템플릿의 기본 파일은 최적화를 막으므로, 앱·라이브러리 keep 규칙은 유지하고 기본 파일만 교체합니다.
    modResults.contents = modResults.contents.replace(defaultRules, optimized);
    return config;
  });
  return withDangerousMod(config, ['android', async (config) => {
    const { projectRoot, platformProjectRoot } = config.modRequest;
    // RN과 위젯이 이름으로 조회하는 앱 이미지에만 적용하며 라이브러리 전체를 보존하지 않습니다.
    const resources = ['characters', 'bubbles', 'widgets'].flatMap((folder) => {
      const directory = path.join(projectRoot, 'assets', folder);
      return fs.readdirSync(directory, { recursive: true }).filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
        .map((file) => {
          const relative = path.posix.join('assets', folder, file.split(path.sep).join('/'));
          const name = getAndroidResourceIdentifier({ httpServerLocation: `/assets/${path.posix.dirname(relative)}`,
            name: path.posix.basename(relative, path.posix.extname(relative)) });
          return `@drawable/${name}`;
        });
    });
    const rawDirectory = path.join(platformProjectRoot, 'app/src/main/res/raw');
    fs.mkdirSync(rawDirectory, { recursive: true });
    fs.writeFileSync(path.join(rawDirectory, 'easy_do_keep.xml'),
      `<resources xmlns:tools="http://schemas.android.com/tools" tools:keep="${[...new Set(resources)].sort().join(',')}" />\n`);
    return config;
  }]);
};
