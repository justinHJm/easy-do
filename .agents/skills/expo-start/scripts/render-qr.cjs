// 터미널이 사이드바에 노출되지 않아도 같은 LAN 주소를 바로 스캔할 수 있게 만듭니다.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

try {
  const url = process.argv[2];
  if (!url || new URL(url).protocol !== 'exp:') throw new Error('실제 Expo 로그의 exp:// 주소가 필요합니다.');
  const root = path.resolve(__dirname, '../../../..');
  const expoRequire = createRequire(path.join(root, 'node_modules/expo/package.json'));
  const cliRequire = createRequire(expoRequire.resolve('@expo/cli/package.json'));
  // CLI 내부 의존성이므로 Expo 업데이트로 없어지면 설치하지 않고 터미널 QR로 돌아갑니다.
  const cells = cliRequire('toqr').toQR(url);
  const { PNG } = cliRequire('pngjs');
  const count = Math.sqrt(cells.length);
  const scale = 12;
  const width = (count + 8) * scale;
  const png = new PNG({ width, height: width });
  // 사방 4칸의 흰 여백을 확보해야 카메라가 QR 경계를 안정적으로 구분합니다.
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      const col = Math.floor(x / scale) - 4;
      const row = Math.floor(y / scale) - 4;
      const value = col >= 0 && row >= 0 && col < count && row < count && cells[row * count + col] ? 0 : 255;
      const index = (y * width + x) * 4;
      png.data[index] = png.data[index + 1] = png.data[index + 2] = value;
      png.data[index + 3] = 255;
    }
  }
  const output = path.join(root, '.expo', 'expo-go-qr.png');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, PNG.sync.write(png));
  console.log(output);
} catch (error) {
  console.error(`QR 이미지 생성 실패: ${error.message} 터미널에서 c를 눌러 QR을 표시하세요.`);
  process.exitCode = 1;
}
