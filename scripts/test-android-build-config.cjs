// 실행: node scripts/test-android-build-config.cjs [격리된 prebuild의 android 경로]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const app = require('../app.json').expo;
const options = app.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties')[1].android;
assert.equal(options.enableMinifyInReleaseBuilds, true);
assert.equal(options.enableShrinkResourcesInReleaseBuilds, true);
const mods = {};
let keepXml;
const context = { module: { exports: {} }, require(name) {
  if (name === 'expo/config-plugins') return {
    withAppBuildGradle(config, mod) { mods.gradle = mod; return config; },
    withDangerousMod(config, [, mod]) { mods.resources = mod; return config; },
  };
  if (name === 'node:fs') return { ...fs, mkdirSync() {}, writeFileSync(file, content) { keepXml = content; } };
  return require(name);
} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'plugins/with-android-r8.js'), 'utf8'), context);
context.module.exports({});
const template = execFileSync('tar', ['-xOf', path.join(root, 'node_modules/expo/template.tgz'), 'package/android/app/build.gradle'], { encoding: 'utf8' });
const input = { modResults: { language: 'groovy', contents: template } };
mods.gradle(input);
const optimized = template.replace('getDefaultProguardFile("proguard-android.txt")', 'getDefaultProguardFile("proguard-android-optimize.txt")');
assert.equal(input.modResults.contents, optimized);
mods.gradle(input);
assert.equal(input.modResults.contents, optimized);
assert.throws(() => mods.gradle({ modResults: { language: 'kotlin', contents: '' } }), /Unsupported/);
assert.throws(() => mods.gradle({ modResults: { language: 'groovy', contents: 'unknown template' } }), /Unsupported/);

(async () => {
  await mods.resources({ modRequest: { projectRoot: root, platformProjectRoot: path.join(root, '.expo/r8-test-virtual') } });
  for (const name of ['assets_widgets_characterpeek', 'assets_widgets_characterjump', 'assets_widgets_refreshicon',
    'assets_characters_normalized_easydobase']) assert(keepXml.includes(`@drawable/${name}`), name);
  assert(!keepXml.includes('*'));
  for (const qa of [undefined, '1']) {
    // 동적 설정 캐시를 공유하지 않도록 실제 빌드처럼 별도 프로세스로 확인합니다.
    const config = JSON.parse(execFileSync(process.execPath, ['-e', `
      const { exp } = require('expo/config').getConfig(process.cwd());
      process.stdout.write(JSON.stringify({ package: exp.android.package, version: exp.version,
        versionCode: exp.android.versionCode, widgets: exp.plugins.find(p => Array.isArray(p) &&
          p[0] === 'react-native-android-widget')[1].widgets.map(w => w.name) }));
    `], { cwd: root, env: { ...process.env, EASY_DO_QA: qa ?? '' }, encoding: 'utf8' }));
    assert.equal(config.package, qa ? 'com.justinhjm.easydo.qa' : app.android.package);
    assert.equal(config.version, app.version);
    assert.equal(config.versionCode, app.android.versionCode);
    assert.deepEqual(config.widgets, ['TodoWidget', 'AllTodoWidget']);
  }
  if (process.argv[2]) {
    const android = path.resolve(process.argv[2]);
    const properties = fs.readFileSync(path.join(android, 'gradle.properties'), 'utf8');
    assert(/^android.enableMinifyInReleaseBuilds=true\s*$/m.test(properties));
    assert(/^android.enableShrinkResourcesInReleaseBuilds=true\s*$/m.test(properties));
    assert(fs.readFileSync(path.join(android, 'app/build.gradle'), 'utf8').includes('getDefaultProguardFile("proguard-android-optimize.txt")'));
    assert.equal(fs.readFileSync(path.join(android, 'app/src/main/res/raw/easy_do_keep.xml'), 'utf8'), keepXml);
    const rules = fs.readFileSync(path.join(android, 'app/proguard-rules.pro'), 'utf8');
    const originalRules = execFileSync('tar', ['-xOf', path.join(root, 'node_modules/expo/template.tgz'), 'package/android/app/proguard-rules.pro'], { encoding: 'utf8' });
    assert.equal(rules, originalRules);
    const manifest = fs.readFileSync(path.join(android, 'app/src/main/AndroidManifest.xml'), 'utf8');
    assert(manifest.includes('.widget.TodoWidget'));
    assert(manifest.includes('.widget.AllTodoWidget'));
    console.log('PASS: generated release flags, optimized defaults, unchanged keep rules, image resources and Widget receivers');
  }
  console.log('PASS: SDK 57 template conversion, idempotence, unsupported-template guards, scoped image preservation and normal/QA identity');
})().catch((error) => { console.error(error); process.exitCode = 1; });
