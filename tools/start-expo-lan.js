const os = require('node:os');
const net = require('node:net');
const { spawn } = require('node:child_process');
const path = require('node:path');
const qrcode = require('qrcode-terminal');

function pickPreferredIp() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const [name, entries] of Object.entries(nets)) {
    for (const net of entries || []) {
      if (net.family !== 'IPv4' || net.internal) continue;
      candidates.push({ name: name.toLowerCase(), ip: net.address });
    }
  }

  const nonVpn = candidates.filter((c) => !c.name.includes('nord') && !c.name.includes('vpn'));
  const preferred = nonVpn.find((c) => c.ip.startsWith('192.168.')) ?? nonVpn[0] ?? candidates[0];
  return preferred?.ip ?? '127.0.0.1';
}

const ip = pickPreferredIp();

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
  throw new Error(`No free port found from ${startPort}`);
}

async function main() {
  const port = await getAvailablePort(19000);
  const expoUrl = `exp://${ip}:${port}`;
  console.log(`Using Expo LAN host: ${ip}`);
  console.log(`Using Expo port: ${port}`);
  console.log(`Open in Expo Go: ${expoUrl}`);
  console.log('');
  qrcode.generate(expoUrl, { small: true });
  console.log('');

  const child = spawn(
    'npx',
    ['expo', 'start', '--clear', '--lan', '--port', String(port)],
    {
      cwd: path.resolve(__dirname, '..', 'facetrack-expo'),
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        REACT_NATIVE_PACKAGER_HOSTNAME: ip,
      },
    },
  );

  child.on('exit', (code) => process.exit(code ?? 1));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
