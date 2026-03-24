const os = require('node:os');
const net = require('node:net');
const { spawn } = require('node:child_process');
const qrcode = require('qrcode-terminal');

const DEFAULT_PORT = Number(process.env.FACETRACK_PORT || '8080');
const flutterPath = 'c:\\src\\flutter\\bin\\flutter.bat';

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(false));
    server.listen(port, '0.0.0.0', () => {
      server.close(() => resolve(true));
    });
  });
}

async function getAvailablePort(startPort, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const port = startPort + i;
    // eslint-disable-next-line no-await-in-loop
    const free = await isPortFree(port);
    if (free) return port;
  }
  throw new Error(`Geen vrije poort gevonden vanaf ${startPort}.`);
}

async function main() {
  const port = await getAvailablePort(DEFAULT_PORT);
  const ip = getLocalIp();
  const url = `http://${ip}:${port}`;

  console.log('\nOpen deze URL op je telefoon of scan de QR-code:\n');
  console.log(url);
  console.log('');
  qrcode.generate(url, { small: true });
  console.log('\nFlutter web server wordt gestart...\n');

  const child = spawn(
    flutterPath,
    [
      'run',
      '-d',
      'web-server',
      '--web-hostname',
      '0.0.0.0',
      '--web-port',
      String(port),
    ],
    {
      stdio: 'inherit',
      shell: true,
    },
  );

  child.on('exit', (code) => process.exit(code ?? 1));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
